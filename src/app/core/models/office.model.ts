export interface Office {
  id: string;
  companiaCorretajeId: string;
  nombre: string;
  direccion: string;
  telefono: string;
  moneda: string;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface CreateOfficeRequest {
  nombre: string;
  direccion: string;
  telefono: string;
  moneda: string;
  activo: boolean;
}

export interface UpdateOfficeRequest {
  nombre?: string;
  direccion?: string;
  telefono?: string;
  moneda?: string;
  activo?: boolean;
}

export interface OfficeResponse<T> {
  body: {
    data: T;
  };
}
