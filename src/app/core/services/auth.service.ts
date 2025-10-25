import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { authEndpoints } from '../api/auth-endpoints';
import { userEndpoints } from '../api/user-endpoints';
import { User } from '../models/user.model';
import { DecodedToken } from '../models/token.model';
import {
  CompanyAssociation,
  CompanyAssociationListResponse,
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
        switchMap((apiResponse) => {
          const initialResult = this.handleLoginPayload(apiResponse.body.data);

          if (!initialResult.needsSelection) {
            this.clearPendingCompanies();
            return of({ ...initialResult, companies: [] });
          }

          return this.loadPendingCompanies().pipe(
            map((associations) => ({
              ...initialResult,
              companies: associations,
            })),
            catchError((fetchError) => {
              console.error('Pending companies fetch error', fetchError);
              const fallback = this.normalizeAssociations(initialResult.companies ?? []);
              this.storePendingCompanies(fallback);
              return of({
                ...initialResult,
                companies: fallback,
              });
            })
          );
        }),
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

  private fetchPendingCompanies(): Observable<CompanyAssociation[]> {
    return this.http
      .get<CompanyAssociationListResponse>(userEndpoints.listAssociations)
      .pipe(map((response) => this.normalizeAssociations(response.body.data ?? [])));
  }

  loadPendingCompanies(): Observable<CompanyAssociation[]> {
    return this.fetchPendingCompanies().pipe(
      map((associations) => {
        this.storePendingCompanies(associations);
        return associations;
      })
    );
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
      const parsed = JSON.parse(stored) as unknown[];
      this.pendingCompanies.set(this.normalizeAssociations(parsed));
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

  private normalizeAssociations(raw: unknown[]): CompanyAssociation[] {
    if (!Array.isArray(raw)) {
      return [];
    }

    return raw
      .map((item) => this.mapAssociation(item))
      .filter((association): association is CompanyAssociation => association !== null);
  }

  private mapAssociation(raw: unknown): CompanyAssociation | null {
    if (typeof raw !== 'object' || raw === null) {
      return null;
    }

    const value = raw as Record<string, unknown>;

    const companiaFromNested = value['compania'] as Record<string, unknown> | undefined;
    const companiaId =
      (companiaFromNested?.['id'] as string | undefined) ??
      (value['companiaCorretajeId'] as string | undefined);

    if (!companiaId || !companiaId.trim()) {
      return null;
    }

    const companiaNombreRaw =
      (companiaFromNested?.['nombre'] as string | undefined) ??
      (value['companiaNombre'] as string | undefined);

    const usuarioCompaniaId =
      (value['usuarioCompaniaId'] as string | undefined) ??
      (value['id'] as string | undefined);

    const oficinaNested = value['oficina'] as Record<string, unknown> | undefined;
    const oficinaId =
      (oficinaNested?.['id'] as string | undefined) ?? (value['oficinaId'] as string | undefined);
    const oficinaNombreRaw =
      (oficinaNested?.['nombre'] as string | undefined) ??
      (value['oficinaNombre'] as string | undefined);

    const email = typeof value['email'] === 'string' ? value['email'] : '';
    const rol = typeof value['rol'] === 'string' ? value['rol'] : '';

    const companiaNombre =
      typeof companiaNombreRaw === 'string' && companiaNombreRaw.trim()
        ? companiaNombreRaw
        : companiaId;

    const association: CompanyAssociation = {
      usuarioCompaniaId: usuarioCompaniaId || companiaId,
      email,
      rol,
      compania: {
        id: companiaId,
        nombre: companiaNombre,
      },
    };

    if (oficinaId && oficinaId.trim()) {
      association.oficina = {
        id: oficinaId,
        nombre:
          typeof oficinaNombreRaw === 'string' && oficinaNombreRaw.trim()
            ? oficinaNombreRaw
            : oficinaId,
      };
    }

    return association;
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
