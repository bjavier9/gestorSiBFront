export interface CompanyAssociation {
  id: string;
  email: string;
  companiaCorretajeId: string;
  rol: string;
  activo: boolean;
  fechaCreacion?: string;
  esNuevo?: boolean;
  enteId?: string;
  oficinaId?: string;
}

export interface LoginResponsePayload {
  token: string;
  companias: CompanyAssociation[];
  needsSelection: boolean;
  isSuperAdmin?: boolean;
}

export interface LoginApiResponse {
  header: {
    timestamp: string;
    token?: string;
  };
  body: {
    data: LoginResponsePayload;
    token?: string;
    message?: string;
  };
  status: {
    code: number;
    success: boolean;
  };
}

export interface SelectCompanyPayload {
  token: string;
}

export interface SelectCompanyApiResponse {
  header: {
    timestamp: string;
    token?: string;
  };
  body: {
    data: SelectCompanyPayload;
    token?: string;
    message?: string;
  };
  status: {
    code: number;
    success: boolean;
  };
}
