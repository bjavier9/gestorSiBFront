import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Compania, CompanyApiResponse } from '../models/compania.model';
import { companyEndpoints } from '../api/company-endpoints';

@Injectable({
  providedIn: 'root'
})
export class CompaniaService {
  private http = inject(HttpClient);

  getCompanias(): Observable<Compania[]> {
    return this.http.get<CompanyApiResponse>(companyEndpoints.getAll).pipe(
      map(response => response.body.data)
    );
  }

  create(companyData: Partial<Compania>): Observable<Compania> {
    return this.http.post<Compania>(companyEndpoints.create, companyData);
  }

  update(id: string, companyData: Partial<Compania>): Observable<Compania> {
    return this.http.put<Compania>(companyEndpoints.update(id), companyData);
  }

  /**
   * Cambia el estado (activo/inactivo) de una compañía.
   * @param id - El ID de la compañía.
   * @param nuevoEstatus - El nuevo estado (true para activo, false para inactivo).
   * @returns Un observable que confirma la operación.
   */
  changeStatus(id: string, nuevoEstatus: boolean): Observable<void> {
    const endpoint = nuevoEstatus ? companyEndpoints.activate(id) : companyEndpoints.deactivate(id);
    return this.http.put<void>(endpoint, {});
  }
}
