export type EnteType = 'Persona Natural' | 'Persona Juridica' | 'Persona Jur��dica';

export enum EnteGenero {
  Masculino = 'Masculino',
  Femenino = 'Femenino',
  NoBinario = 'No binario',
  PrefieroNoDecir = 'Prefiero no decir',
}

export enum EnteEstadoCivil {
  Soltero = 'Soltero',
  Casado = 'Casado',
  Divorciado = 'Divorciado',
  Viudo = 'Viudo',
  UnionLibre = 'Union libre',
}

export interface EnteMetadataPersonaNatural {
  creadoPor: string;
  fechaNacimiento: string;
  genero?: EnteGenero;
  estadoCivil?: EnteEstadoCivil;
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
  companiaCorretajeId?: string;
}

export interface Ente {
  id: string;
  companiaCorretajeId: string;
  nombre: string;
  tipo: EnteType;
  documento: string;
  tipo_documento: string;
  direccion: string;
  telefono: string;
  correo: string;
  idregion: number;
  idReferido: string | null;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  metadatos?: Partial<EnteMetadataPersonaNatural> | Record<string, unknown>;
}

export interface CreateEnteResponse {
  body: {
    data: {
      id: string;
    };
  };
}

export interface EnteListResponse {
  body: {
    data: Ente[];
  };
}
