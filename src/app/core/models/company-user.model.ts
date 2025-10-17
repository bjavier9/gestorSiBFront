export type CompanyUserRole = 'admin' | 'supervisor' | 'agent' | 'viewer';

export interface CompanyUser {
  id: string;
  email: string;
  companiaCorretajeId: string;
  rol: CompanyUserRole;
  activo: boolean;
  fechaCreacion: string;
  esNuevo?: boolean;
  enteId?: string;
  oficinaId?: string;
}

export interface CreateCompanyUserRequest {
  email: string;
  password?: string;
  companiaCorretajeId?: string;
  rol: CompanyUserRole;
  enteId: string;
  oficinaId?: string;
}

export interface CreateCompanyUserResponse {
  body: {
    data: CompanyUser;
  };
}

export interface CompanyUserListResponse {
  body: {
    data: CompanyUser[];
  };
}
