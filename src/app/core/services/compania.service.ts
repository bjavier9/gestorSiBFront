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
    const newCompany: Compania = {
      id: String(Math.floor(Math.random() * 1000)),
      ...companyData,
      activo: true,
    } as Compania;
    return of(newCompany).pipe(delay(500));
  }

  update(id: string, companyData: Partial<Compania>): Observable<Compania> {
    // Simulación: en una app real, aquí se obtendría el estado actual antes de actualizar.
    const updatedCompany: Partial<Compania> = { id, ...companyData };
    return of(updatedCompany as Compania).pipe(delay(500));
  }

  /**
   * Cambia el estado (activo/inactivo) de una compañía.
   * @param id - El ID de la compañía.
   * @param nuevoEstatus - El nuevo estado (true para activo, false para inactivo).
   * @returns Un observable que confirma la operación.
   */
  changeStatus(id: string, nuevoEstatus: boolean): Observable<{ id: string; status: boolean }> {
    // Simula una llamada a la API para cambiar el estado
    console.log(`Cambiando estado de la compañía ${id} a ${nuevoEstatus}`);
    return of({ id: id, status: nuevoEstatus }).pipe(delay(300));
  }

}
