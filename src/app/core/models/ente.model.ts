export type EnteType = 'Persona Natural' | 'Persona Juridica' | 'Persona Jurídica';

export interface EnteMetadataPersonaNatural {
  creadoPor: string;
  fechaNacimiento: string;
  genero: 'M' | 'F';
  estadoCivil: string;
  profesion: string;
  nacionalidad: string;
  hijos?: number;
  vehiculos?: number;
  ultimaActualizacion: string;
}

export interface CreateEnteRequest {
  nombre: string;
  tipo: EnteType;
  documento: string;
  tipo_documento: string;
  direccion: string;
  telefono: string;
  correo: string;
  idregion: number;
  activo: boolean;
  metadatos?: Partial<EnteMetadataPersonaNatural>;
}

export interface CreateEnteResponse {
  body: {
    data: {
      id: string;
    };
  };
}
