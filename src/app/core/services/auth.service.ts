import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map, switchMap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
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
  isLoggedIn = computed(() => !!this.currentUser());

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
