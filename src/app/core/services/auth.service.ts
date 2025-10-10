import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Importamos HttpHeaders
import { environment } from '../../../environments/environment';
import { map, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { authEndpoints } from '../api/auth-endpoints';
import { User } from '../models/user.model';

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
  private readonly GOOGLE_API_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${environment.firebaseApiKey}`;

  currentUser = signal<User | null | undefined>(undefined);

  login(email: string, password: string): Observable<LoginResult> {
    const cleanEmail = email.replace(/ /g, "");
    const cleanPassword = password.replace(/ /g, "");

    // Creamos las cabeceras explícitamente
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<FirebaseLoginResponse>(this.GOOGLE_API_URL, 
      { email: cleanEmail, password: cleanPassword, returnSecureToken: true }, 
      { headers: headers } // Añadimos las cabeceras a la petición
    )
      .pipe(
        switchMap(firebaseResponse => {
          // La segunda petición a nuestro backend no necesita la cabecera explícita,
          // ya que HttpClient la añade por defecto.
          return this.http.post<AppLoginResponse>(authEndpoints.login, { idToken: firebaseResponse.idToken });
        }),
        map(appResponse => {
          const userData = appResponse.body.data;
          localStorage.setItem('token', userData.token);
          this.currentUser.set(userData);

          return { isSuperAdmin: !!userData.isSuperAdmin };
        })
      );
  }

  logout(){
    localStorage.removeItem('token');
    this.currentUser.set(null);
  }
}
