import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { authEndpoints } from '../api/auth-endpoints';
import { User } from '../models/user.model';
import { DecodedToken } from '../models/token.model';

interface FirebaseLoginResponse {
  idToken: string;
}

interface AppLoginResponse {
  body: {
    data: User;
  };
}

export interface LoginResult {
  isSuperAdmin: boolean;
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

  readonly currentUser = signal<User | null>(null);
  readonly isLoggedIn = computed(() => !!this.currentUser());

  constructor() {
    this.restoreSession();
  }

  login(email: string, password: string): Observable<LoginResult> {
    const firebaseResponse: FirebaseLoginResponse = {
      idToken: environment.mockIdToken,
    };

    return of(firebaseResponse).pipe(
      switchMap((response) =>
        this.http.post<AppLoginResponse>(authEndpoints.login, {
          idToken: response.idToken,
          email,
          password,
        })
      ),
      map((appResponse) => {
        const userData = appResponse.body.data;
        this.persistSession(userData);
        return { isSuperAdmin: !!userData.isSuperAdmin };
      }),
      catchError((error) => {
        console.error('Login error', error);
        return throwError(() => new Error('Login failed'));
      })
    );
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.tokenKey);
    if (!token) {
      this.currentUser.set(null);
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

  private restoreSession(): void {
    const token = localStorage.getItem(this.tokenKey);
    if (!token) {
      this.currentUser.set(null);
      return;
    }

    if (this.isTokenExpired()) {
      this.clearSession();
      return;
    }

    const storedUser = localStorage.getItem(this.userKey);
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        this.currentUser.set({
          ...parsedUser,
          token,
        });
        return;
      } catch {
        localStorage.removeItem(this.userKey);
      }
    }

    const decodedToken = this.decodeToken(token);
    if (!decodedToken) {
      this.clearSession();
      return;
    }

    const user: User = {
      token,
      email: decodedToken.email,
      isSuperAdmin: decodedToken.role === 'SuperAdmin',
      name: decodedToken.unique_name,
    };

    this.currentUser.set(user);
  }

  private persistSession(user: User): void {
    const sessionExpiration = new Date(Date.now() + 2 * 60 * 60 * 1000);

    localStorage.setItem(this.tokenKey, user.token);
    localStorage.setItem(this.tokenExpirationKey, sessionExpiration.toISOString());
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUser.set(user);
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
    } catch {
      return null;
    }
  }

  private clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.tokenExpirationKey);
    localStorage.removeItem(this.userKey);
    this.currentUser.set(null);
  }
}
