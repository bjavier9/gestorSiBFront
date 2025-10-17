export interface RoleOption {
  rol: string;
  descripcion: string;
  activo: boolean;
}

export interface RolesConfiguration {
  id: string;
  name: string;
  description: string;
  items: RoleOption[];
}

export interface RolesConfigurationResponse {
  body: {
    data: RolesConfiguration;
  };
}
