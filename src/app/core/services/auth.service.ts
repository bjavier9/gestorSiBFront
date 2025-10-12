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

  currentUser = signal<User | null | undefined>(undefined);
  isLoggedIn = computed(() => !!this.currentUser());

  constructor() {
    this.checkAuthentication();
  }

  private checkAuthentication(): void {
    const token = localStorage.getItem('token');
    if (token && !this.isTokenExpired()) {
      try {
        const decodedToken: DecodedToken = JSON.parse(atob(token.split('.')[1]));
        const user: User = {
          token: token,
          email: decodedToken.email, // Añadido para cumplir con la interfaz User
          isSuperAdmin: decodedToken.role === 'SuperAdmin',
          name: decodedToken.unique_name,
        };
        this.currentUser.set(user);
      } catch (error) {
        this.logout();
      }
    } else if (token) {
      this.logout();
    }
  }

  private isTokenExpired(): boolean {
    const expiration = localStorage.getItem('token_expiration');
    if (!expiration) return true;
    return new Date().getTime() > new Date(expiration).getTime();
  }

  isAuthenticated(): boolean {
    if (this.isTokenExpired()) {
      this.logout();
      return false;
    }
    return true;
  }

  login(email: string, password: string): Observable<LoginResult> {
    // Simulación de respuesta de Firebase
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
        const expirationDate = new Date(decodedToken.exp * 1000);

        const sessionExpiration = new Date(new Date().getTime() + 2 * 60 * 60 * 1000); // 2 horas

        localStorage.setItem('token', userData.token);
        localStorage.setItem('token_expiration', sessionExpiration.toISOString());
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
    localStorage.removeItem('token');
    localStorage.removeItem('token_expiration');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
