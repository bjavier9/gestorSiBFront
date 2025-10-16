import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { companyEndpoints } from '../api/company-endpoints';
import { Company, CompanyApiResponse, CompanyFromApi } from '../models/company.model';

@Injectable({
  providedIn: 'root',
})
export class CompanyService {
  private readonly http = inject(HttpClient);

  getCompanies(): Observable<Company[]> {
    return this.http.get<CompanyApiResponse>(companyEndpoints.getAll).pipe(
      map((response) => response.body.data.map(mapCompanyFromApi))
    );
  }

  getCompanyById(targetId: string): Observable<Company | undefined> {
    return this.getCompanies().pipe(
      map((companies) => companies.find((company) => company.id === targetId))
    );
  }

  createCompany(input: Partial<CompanyFromApi>): Observable<Company> {
    return this.http.post<CompanyFromApi>(companyEndpoints.create, input).pipe(
      map(mapCompanyFromApi)
    );
  }

  updateCompany(id: string, input: Partial<CompanyFromApi>): Observable<Company> {
    return this.http.put<CompanyFromApi>(companyEndpoints.update(id), input).pipe(
      map(mapCompanyFromApi)
    );
  }

  setCompanyStatus(id: string, nextStatus: boolean): Observable<void> {
    const endpoint = nextStatus ? companyEndpoints.activate(id) : companyEndpoints.deactivate(id);
    return this.http.put<void>(endpoint, {});
  }
}

const mapCompanyFromApi = (company: CompanyFromApi): Company => ({
  id: company.id,
  name: company.nombre,
  taxId: company.rif,
  address: company.direccion,
  phone: company.telefono,
  email: company.correo,
  createdAt: company.fechaCreacion,
  updatedAt: company.fechaActualizacion,
  isActive: company.activo,
  acceptedCurrencies: company.monedasAceptadas,
  defaultCurrency: company.monedaPorDefecto,
  modules: company.modulos,
  logo: company.logo,
});
