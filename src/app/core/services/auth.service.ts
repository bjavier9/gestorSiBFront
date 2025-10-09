import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';

interface FirebaseLoginResponse {
  idToken: string;
  // otras propiedades de Firebase...
}

interface AppLoginResponse {
  body: {
    data: {
      token: string;
      isSuperAdmin?: boolean; // Hacemos la propiedad opcional
      // otras propiedades del usuario...
    };
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
  private readonly GOOGLE_API_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${environment.firebaseApiKey}`;

  currentUser = signal<any | null | undefined>(undefined);

  login(email: string, password: string): Observable<LoginResult> {
    return this.http.post<FirebaseLoginResponse>(this.GOOGLE_API_URL, { email, password, returnSecureToken: true })
      .pipe(
        switchMap(firebaseResponse => {
          return this.http.post<AppLoginResponse>(`${environment.apiHost}/api/auth/login`, { idToken: firebaseResponse.idToken });
        }),
        map(appResponse => {
          const userData = appResponse.body.data;
          localStorage.setItem('token', userData.token);
          this.currentUser.set(userData);

          // Devolvemos si es super admin o no
          return { isSuperAdmin: !!userData.isSuperAdmin };
        })
      );
  }

  logout(){
    localStorage.removeItem('token');
    this.currentUser.set(null);
  }
}
