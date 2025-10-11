import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map, switchMap } from 'rxjs/operators';
import { Observable, of } from 'rxjs'; // Importamos 'of'
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
  // Mantenemos la URL de la API de Google para el futuro
  private readonly GOOGLE_API_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${environment.firebaseApiKey}`;

  currentUser = signal<User | null | undefined>(undefined);

  login(email: string, password: string): Observable<LoginResult> {
    // === INICIO: WORKAROUND TEMPORAL ===
    // Simulamos la respuesta de Firebase con el token del entorno
    // para evitar el problema de restricción de host.
    const mockFirebaseResponse: FirebaseLoginResponse = {
      idToken: environment.mockIdToken
    };

    return of(mockFirebaseResponse).pipe(
    // === FIN: WORKAROUND TEMPORAL ===

    /* === CÓDIGO ORIGINAL (COMENTADO) ===
    const cleanEmail = email.replace(/ /g, "");
    const cleanPassword = password.replace(/ /g, "");

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<FirebaseLoginResponse>(this.GOOGLE_API_URL, 
      { email: cleanEmail, password: cleanPassword, returnSecureToken: true }, 
      { headers: headers } 
    )
      .pipe(
    */
        switchMap(firebaseResponse => {
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
