import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { configurationEndpoints } from '../api/configuration-endpoints';
import { RoleOption, RolesConfigurationResponse } from '../models/role.model';

@Injectable({
  providedIn: 'root',
})
export class ConfigurationService {
  private readonly http = inject(HttpClient);

  getAvailableRoles(): Observable<RoleOption[]> {
    return this.http
      .get<RolesConfigurationResponse>(configurationEndpoints.getById('roles_permitidos'))
      .pipe(map((response) => response.body.data.items.filter((role) => role.activo)));
  }
}
