export interface CompanyAssociationCompany {
  id: string;
  nombre: string;
}

export interface CompanyAssociationOffice {
  id: string;
  nombre: string;
}

export interface CompanyAssociation {
  usuarioCompaniaId: string;
  email: string;
  rol: string;
  compania: CompanyAssociationCompany;
  oficina?: CompanyAssociationOffice | null;
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

export interface CompanyAssociationListResponse {
  header: {
    timestamp: string;
    token?: string;
  };
  body: {
    data: CompanyAssociation[];
    message?: string;
  };
  status: {
    code: number;
    success: boolean;
  };
}
