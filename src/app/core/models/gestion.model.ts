export type GestionEstado =
  | 'borrador'
  | 'en_gestion'
  | 'en_tramite'
  | 'gestionado_exito'
  | 'desistido';

export type GestionTipo = 'nueva' | 'renovacion';

export type GestionPrioridad = 'baja' | 'media' | 'alta';

export interface Gestion {
  id: string;
  companiaCorretajeId: string;
  agenteId: string;
  oficinaId?: string;
  polizaId?: string;
  leadId?: string;
  enteId?: string;
  tipo: GestionTipo;
  estado: GestionEstado;
  prioridad?: GestionPrioridad;
  notas?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  fechaVencimiento?: string | null;
  activo: boolean;
}

export interface GestionNotaAdjunto {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  downloadUrl: string;
  storagePath?: string;
}

export interface GestionNota {
  id: string;
  gestionId: string;
  contenido: string;
  autorId: string;
  autorNombre?: string;
  autorEmail?: string;
  autorRol?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  adjuntos?: GestionNotaAdjunto[];
}

export interface GestionApiResponse<T> {
  body: {
    data: T;
    message?: string;
  };
}

export interface CreateGestionNotaRequest {
  contenido: string;
  adjuntos?: File[];
}

export interface UpdateGestionNotaRequest {
  contenido: string;
}
