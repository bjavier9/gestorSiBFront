import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, switchMap, throwError } from 'rxjs';

import { officeEndpoints } from '../api/office-endpoints';
import {
  CreateOfficeRequest,
  Office,
  OfficeResponse,
  UpdateOfficeRequest,
} from '../models/office.model';

@Injectable({
  providedIn: 'root',
})
export class OfficeService {
  private readonly http = inject(HttpClient);

  getCompanyOffices(companyId: string): Observable<Office[]> {
    return this.http
      .get<OfficeResponse<Office[]>>(officeEndpoints.list(companyId))
      .pipe(map((response) => response.body.data));
  }

  createOffice(companyId: string, payload: CreateOfficeRequest): Observable<Office> {
    return this.http
      .post<OfficeResponse<Office>>(officeEndpoints.create(companyId), payload)
      .pipe(map((response) => response.body.data));
  }

  getOfficeById(companyId: string, officeId: string): Observable<Office> {
    return this.getCompanyOffices(companyId).pipe(
      map((offices) => offices.find((office) => office.id === officeId)),
      switchMap((office) => {
        if (!office) {
          return throwError(() => new Error('Office not found.'));
        }
        return of(office);
      })
    );
  }

  updateOffice(
    companyId: string,
    officeId: string,
    payload: UpdateOfficeRequest
  ): Observable<Office> {
    return this.http
      .put<OfficeResponse<Office>>(officeEndpoints.update(companyId, officeId), payload)
      .pipe(map((response) => response.body.data));
  }

  deleteOffice(companyId: string, officeId: string): Observable<void> {
    return this.http
      .delete<OfficeResponse<unknown>>(officeEndpoints.delete(companyId, officeId))
      .pipe(map(() => undefined));
  }
}
