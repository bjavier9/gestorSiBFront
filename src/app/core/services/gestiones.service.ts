import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { gestionEndpoints } from '../api/gestion-endpoints';
import {
  CreateGestionNotaRequest,
  Gestion,
  GestionApiResponse,
  GestionNota,
  UpdateGestionNotaRequest,
} from '../models/gestion.model';

@Injectable({
  providedIn: 'root',
})
export class GestionesService {
  private readonly http = inject(HttpClient);

  getGestiones(): Observable<Gestion[]> {
    return this.http
      .get<GestionApiResponse<Gestion[]>>(gestionEndpoints.list)
      .pipe(map((response) => response.body.data ?? []));
  }

  getGestionById(gestionId: string): Observable<Gestion> {
    return this.http
      .get<GestionApiResponse<Gestion>>(gestionEndpoints.detail(gestionId))
      .pipe(map((response) => response.body.data));
  }

  getNotas(gestionId: string): Observable<GestionNota[]> {
    return this.http
      .get<GestionApiResponse<GestionNota[]>>(gestionEndpoints.notas.list(gestionId))
      .pipe(map((response) => response.body.data ?? []));
  }

  crearNota(
    gestionId: string,
    payload: CreateGestionNotaRequest,
  ): Observable<GestionNota> {
    const formData = new FormData();
    formData.append('contenido', payload.contenido ?? '');

    const attachments = payload.adjuntos?.filter((file): file is File => !!file) ?? [];
    attachments.forEach((archivo) => formData.append('adjuntos', archivo, archivo.name));

    return this.http
      .post<GestionApiResponse<GestionNota>>(gestionEndpoints.notas.create(gestionId), formData)
      .pipe(map((response) => response.body.data));
  }

  actualizarNota(
    gestionId: string,
    notaId: string,
    payload: UpdateGestionNotaRequest,
  ): Observable<GestionNota> {
    return this.http
      .put<GestionApiResponse<GestionNota>>(gestionEndpoints.notas.update(gestionId, notaId), payload)
      .pipe(map((response) => response.body.data));
  }

  eliminarNota(gestionId: string, notaId: string): Observable<void> {
    return this.http
      .delete<GestionApiResponse<unknown>>(gestionEndpoints.notas.delete(gestionId, notaId))
      .pipe(map(() => undefined));
  }
}
