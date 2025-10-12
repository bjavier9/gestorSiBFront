import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map, switchMap, catchError } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';
import { authEndpoints } from '../api/auth-endpoints';
import { User } from '../models/user.model';
import { DecodedToken } from '../models/token.model';
import { Router } from '@angular/router';

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
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly GOOGLE_API_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${environment.firebaseApiKey}`;
  private readonly TOKEN_KEY = 'token';
  private readonly TOKEN_EXPIRATION_KEY = 'token_expiration';
  private readonly USER_KEY = 'user';

  currentUser = signal<User | null | undefined>(undefined);
  isLoggedIn = computed(() => !!this.currentUser());

  constructor() {
    this.checkAuthentication();
  }

  private checkAuthentication(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);

    if (!token) {
      this.currentUser.set(null);
      return;
    }

    if (this.isTokenExpired()) {
      this.logout();
      return;
    }

    const storedUser = localStorage.getItem(this.USER_KEY);

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        this.currentUser.set({
          ...parsedUser,
          token,
        });
        return;
      } catch {
        localStorage.removeItem(this.USER_KEY);
      }
    }

    try {
      const decodedToken: DecodedToken = JSON.parse(atob(token.split('.')[1]));
      const user: User = {
        token,
        email: decodedToken.email,
        isSuperAdmin: decodedToken.role === 'SuperAdmin',
        name: decodedToken.unique_name,
      };
      this.currentUser.set(user);
    } catch {
      this.logout();
    }
  }

  private isTokenExpired(): boolean {
    const expiration = localStorage.getItem(this.TOKEN_EXPIRATION_KEY);
    if (!expiration) return true;
    return new Date().getTime() > new Date(expiration).getTime();
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) {
      this.currentUser.set(null);
      return false;
    }

    if (this.isTokenExpired()) {
      this.logout();
      return false;
    }
    return true;
  }

  login(email: string, password: string): Observable<LoginResult> {
    const mockFirebaseResponse: FirebaseLoginResponse = {
      idToken: environment.mockIdToken
    };

    return of(mockFirebaseResponse).pipe(
      switchMap(firebaseResponse => {
        return this.http.post<AppLoginResponse>(authEndpoints.login, { idToken: firebaseResponse.idToken });
      }),
      map(appResponse => {
        const userData = appResponse.body.data;
        const decodedToken: DecodedToken = JSON.parse(atob(userData.token.split('.')[1]));
        const sessionExpiration = new Date(new Date().getTime() + 2 * 60 * 60 * 1000);

        localStorage.setItem(this.TOKEN_KEY, userData.token);
        localStorage.setItem(this.TOKEN_EXPIRATION_KEY, sessionExpiration.toISOString());
        localStorage.setItem(this.USER_KEY, JSON.stringify(userData));
        this.currentUser.set(userData);

        return { isSuperAdmin: !!userData.isSuperAdmin };
      }),
      catchError(error => {
        console.error('Login error', error);
        return throwError(() => new Error('Login failed'));
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRATION_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
