import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { authEndpoints } from '../api/auth-endpoints';
import { User } from '../models/user.model';
import { DecodedToken } from '../models/token.model';
import {
  CompanyAssociation,
  LoginApiResponse,
  LoginResponsePayload,
  SelectCompanyApiResponse,
  SelectCompanyPayload,
} from '../models/auth.model';

interface FirebaseLoginResponse {
  idToken: string;
}

export interface LoginResult {
  isSuperAdmin: boolean;
  needsSelection: boolean;
  companies: CompanyAssociation[];
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly tokenKey = 'token';
  private readonly tokenExpirationKey = 'token_expiration';
  private readonly userKey = 'user';
  private readonly pendingCompaniesKey = 'pending_companies';

  readonly currentUser = signal<User | null>(null);
  readonly pendingCompanies = signal<CompanyAssociation[]>([]);
  readonly isLoggedIn = computed(() => !!this.currentUser());
  readonly needsCompanySelection = computed(
    () => this.currentUser()?.requiresCompanySelection ?? false
  );

  constructor() {
    this.restoreSession();
  }

  login(email: string, password: string): Observable<LoginResult> {
    const firebaseResponse: FirebaseLoginResponse = {
      idToken: environment.mockIdToken,
    };

    return of(firebaseResponse).pipe(
      switchMap((response) =>
        this.http.post<LoginApiResponse>(authEndpoints.login, {
          idToken: response.idToken,
          email,
          password,
        })
      ),
      map((apiResponse) => this.handleLoginPayload(apiResponse.body.data)),
      catchError((error) => {
        console.error('Login error', error);
        return throwError(() => new Error('Login failed'));
      })
    );
  }

  selectCompany(companiaId: string): Observable<User> {
    return this.http
      .post<SelectCompanyApiResponse>(authEndpoints.selectCompany, { companiaId })
      .pipe(
        map((apiResponse) => this.handleCompanySelection(apiResponse.body.data)),
        catchError((error) => {
          console.error('Company selection error', error);
          return throwError(() => new Error('Company selection failed'));
        })
      );
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.tokenKey);
    if (!token) {
      this.currentUser.set(null);
      this.clearPendingCompanies();
      return false;
    }

    if (this.isTokenExpired()) {
      this.clearSession();
      return false;
    }

    return true;
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  private handleLoginPayload(payload: LoginResponsePayload): LoginResult {
    const decoded = this.decodeToken(payload.token);
    if (!decoded) {
      this.clearSession();
      throw new Error('Invalid token payload');
    }

    const user = this.createUserFromDecodedToken(decoded, payload.token, {
      isSuperAdmin: payload.isSuperAdmin,
      needsSelection: payload.needsSelection,
    });

    this.persistSession(user, decoded.exp);

    if (payload.needsSelection) {
      this.storePendingCompanies(payload.companias ?? []);
    } else {
      this.clearPendingCompanies();
    }

    return {
      isSuperAdmin: !!user.isSuperAdmin,
      needsSelection: payload.needsSelection,
      companies: payload.companias ?? [],
    };
  }

  private handleCompanySelection(payload: SelectCompanyPayload): User {
    const decoded = this.decodeToken(payload.token);
    if (!decoded) {
      this.clearSession();
      throw new Error('Invalid token payload');
    }

    const user = this.createUserFromDecodedToken(decoded, payload.token, {
      needsSelection: false,
    });

    this.persistSession(user, decoded.exp);
    this.clearPendingCompanies();

    return user;
  }

  private restoreSession(): void {
    const token = localStorage.getItem(this.tokenKey);
    if (!token) {
      this.currentUser.set(null);
      this.clearPendingCompanies();
      return;
    }

    if (this.isTokenExpired()) {
      this.clearSession();
      return;
    }

    const storedUser = this.readStoredUser(token);
    if (storedUser) {
      this.currentUser.set(storedUser);
    } else {
      const decodedToken = this.decodeToken(token);
      if (!decodedToken) {
        this.clearSession();
        return;
      }

      try {
        const user = this.createUserFromDecodedToken(decodedToken, token);
        this.persistSession(user, decodedToken.exp);
      } catch (error) {
        console.error('Failed to restore session from token', error);
        this.clearSession();
        return;
      }
    }

    if (this.currentUser()?.requiresCompanySelection) {
      this.restorePendingCompanies();
    } else {
      this.clearPendingCompanies();
    }
  }

  private persistSession(user: User, expirationEpochSeconds?: number): void {
    const sessionExpiration = expirationEpochSeconds
      ? new Date(expirationEpochSeconds * 1000)
      : new Date(Date.now() + 2 * 60 * 60 * 1000);

    localStorage.setItem(this.tokenKey, user.token);
    localStorage.setItem(this.tokenExpirationKey, sessionExpiration.toISOString());
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUser.set(user);
  }

  private readStoredUser(token: string): User | null {
    const storedUser = localStorage.getItem(this.userKey);
    if (!storedUser) {
      return null;
    }

    try {
      const parsedUser = JSON.parse(storedUser) as User;
      return {
        ...parsedUser,
        token,
      };
    } catch {
      localStorage.removeItem(this.userKey);
      return null;
    }
  }

  private storePendingCompanies(companies: CompanyAssociation[]): void {
    localStorage.setItem(this.pendingCompaniesKey, JSON.stringify(companies));
    this.pendingCompanies.set(companies);
  }

  private restorePendingCompanies(): void {
    const stored = localStorage.getItem(this.pendingCompaniesKey);
    if (!stored) {
      this.pendingCompanies.set([]);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as CompanyAssociation[];
      this.pendingCompanies.set(parsed);
    } catch {
      localStorage.removeItem(this.pendingCompaniesKey);
      this.pendingCompanies.set([]);
    }
  }

  private clearPendingCompanies(): void {
    localStorage.removeItem(this.pendingCompaniesKey);
    this.pendingCompanies.set([]);
  }

  private isTokenExpired(): boolean {
    const expiration = localStorage.getItem(this.tokenExpirationKey);
    if (!expiration) {
      return true;
    }

    return Date.now() > new Date(expiration).getTime();
  }

  private decodeToken(token: string): DecodedToken | null {
    try {
      const base64Payload = token.split('.')[1];
      const payload = atob(base64Payload);
      return JSON.parse(payload) as DecodedToken;
    } catch (error) {
      console.error('Token decode error', error);
      return null;
    }
  }

  private createUserFromDecodedToken(
    decoded: DecodedToken,
    token: string,
    meta?: { isSuperAdmin?: boolean; needsSelection?: boolean }
  ): User {
    const payload = decoded.user;
    if (!payload || typeof payload.email !== 'string') {
      throw new Error('Missing user payload in token');
    }

    const role = typeof payload.role === 'string' ? payload.role : undefined;
    const requiresSelection = meta?.needsSelection ?? !!payload.pendienteCia;
    const isSuperAdmin =
      meta?.isSuperAdmin ?? (role ? role.toLowerCase() === 'superadmin' : false);

    return {
      token,
      email: payload.email,
      uid: typeof payload.uid === 'string' ? payload.uid : undefined,
      name: typeof payload.name === 'string' ? payload.name : undefined,
      role,
      companyId:
        typeof payload.companiaCorretajeId === 'string'
          ? payload.companiaCorretajeId
          : undefined,
      officeId:
        typeof payload.oficinaId === 'string' ? payload.oficinaId : undefined,
      entityId:
        typeof payload.enteId === 'string' ? payload.enteId : undefined,
      requiresCompanySelection: requiresSelection,
      isSuperAdmin,
    };
  }

  private clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.tokenExpirationKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.pendingCompaniesKey);
    this.currentUser.set(null);
    this.pendingCompanies.set([]);
  }
}
