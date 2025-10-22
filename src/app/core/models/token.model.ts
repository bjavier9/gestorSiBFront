export interface AuthTokenUserPayload {
  uid: string;
  email: string;
  role?: string;
  companiaCorretajeId?: string;
  oficinaId?: string;
  enteId?: string;
  pendienteCia?: boolean;
  name?: string;
  [key: string]: unknown;
}

export interface DecodedToken {
  exp: number;
  iat: number;
  user?: AuthTokenUserPayload;
  [key: string]: unknown;
}
