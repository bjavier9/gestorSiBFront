import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { switchMap, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

interface FirebaseLoginResponse {
  idToken: string;
  // ... otras propiedades que Firebase devuelve
}

interface AppLoginResponse {
  body: {
    data: any;
  };
  // ... otras propiedades que tu API devuelve
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly GOOGLE_API_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${environment.firebaseApiKey}`;
  
  currentUser = signal<any | null | undefined>(undefined);

  login(email: string, password: string): Observable<any> {
    return this.http.post<FirebaseLoginResponse>(this.GOOGLE_API_URL, { email, password, returnSecureToken: true })
      .pipe(
        switchMap(firebaseResponse => {
          console.log(firebaseResponse.idToken)
          // Una vez que Firebase responde, usamos el idToken para llamar a nuestra API
          return this.http.post<AppLoginResponse>(`${environment.apiHost}/api/auth/login`, { idToken: firebaseResponse.idToken });
        }),
        tap(appResponse => {
          // Este tap ahora recibe la respuesta de nuestra API
          localStorage.setItem('token', appResponse.body.data.token);
          this.currentUser.set(appResponse.body.data);
        })
      );
  }

  logout(){
    localStorage.removeItem('token');
    this.currentUser.set(null);
  }
}
