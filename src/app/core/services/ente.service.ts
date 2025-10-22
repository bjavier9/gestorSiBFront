import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, of, throwError } from 'rxjs';

import { enteEndpoints } from '../api/ente-endpoints';
import { CreateEnteRequest, CreateEnteResponse } from '../models/ente.model';

@Injectable({
  providedIn: 'root',
})
export class EnteService {
  private readonly http = inject(HttpClient);

  createEnte(payload: CreateEnteRequest): Observable<string> {
    return this.http.post<CreateEnteResponse>(enteEndpoints.create, payload).pipe(
      map((response) => response.body.data.id),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 409) {
          const existingId = this.extractExistingEnteId(error);
          if (existingId) {
            return of(existingId);
          }
        }

        return throwError(() => error);
      })
    );
  }

  private extractExistingEnteId(error: HttpErrorResponse): string | null {
    const responseBody = error?.error;
    const candidates = [
      responseBody?.body?.data?.id,
      responseBody?.body?.data?.enteId,
      responseBody?.body?.id,
      responseBody?.body?.enteId,
      responseBody?.data?.id,
      responseBody?.data?.enteId,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }

    const message = responseBody?.body?.message ?? responseBody?.message;
    if (typeof message === 'string') {
      const match = message.match(/[0-9a-fA-F-]{8,}/);
      if (match?.[0]) {
        return match[0];
      }
    }

    return null;
  }
}
