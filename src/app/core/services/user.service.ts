import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { userEndpoints } from '../api/user-endpoints';
import {
  CompanyUser,
  CompanyUserListResponse,
  CreateCompanyUserRequest,
  CreateCompanyUserResponse,
} from '../models/company-user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);

  createCompanyUser(payload: CreateCompanyUserRequest): Observable<CompanyUser> {
    return this.http.post<CreateCompanyUserResponse>(userEndpoints.create, payload).pipe(
      map((response) => response.body.data)
    );
  }

  getAllUsers(): Observable<CompanyUser[]> {
    return this.http.get<CompanyUserListResponse>(userEndpoints.listAll).pipe(
      map((response) => response.body.data)
    );
  }

  getOperationalUsersByCompany(): Observable<CompanyUser[]> {
    return this.http.get<CompanyUserListResponse>(userEndpoints.listOperationalByCompany).pipe(
      map((response) => response.body.data)
    );
  }

  setCompanyUserStatus(id: string, active: boolean): Observable<CompanyUser> {
    return this.http
      .patch<CreateCompanyUserResponse>(userEndpoints.updateStatus(id), { active })
      .pipe(map((response) => response.body.data));
  }
}
