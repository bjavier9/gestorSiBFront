export enum CompanyCurrency {
  USD = 'USD',
  CRC = 'CRC',
  GTQ = 'GTQ',
  HNL = 'HNL',
  NIO = 'NIO',
  PAB = 'PAB',
  SVC = 'SVC',
  BZD = 'BZD',
  DOP = 'DOP',
}

export interface Company {
  id: string;
  name: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  acceptedCurrencies: string[];
  defaultCurrency: string;
  modules: string[];
  logo?: string;
}

export interface CompanyFromApi {
  id: string;
  nombre: string;
  rif: string;
  direccion: string;
  telefono: string;
  correo: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  activo: boolean;
  monedasAceptadas: string[];
  monedaPorDefecto: string;
  modulos: string[];
  logo?: string;
}

export interface CompanyApiResponse {
  body: {
    data: CompanyFromApi[];
  };
}
