import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { enteEndpoints } from '../api/ente-endpoints';
import { CreateEnteRequest, CreateEnteResponse } from '../models/ente.model';

@Injectable({
  providedIn: 'root',
})
export class EnteService {
  private readonly http = inject(HttpClient);

  createEnte(payload: CreateEnteRequest): Observable<string> {
    return this.http.post<CreateEnteResponse>(enteEndpoints.create, payload).pipe(
      map((response) => response.body.data.id)
    );
  }
}
