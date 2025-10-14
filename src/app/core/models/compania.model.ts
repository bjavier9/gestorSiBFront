export interface Compania {
  id: string;
  nombre: string;
  rif: string;
  direccion: string;
  telefono: string;
  correo: string;
  fechaCreacion: string; // O puedes usar Date si prefieres transformar el string
  fechaActualizacion: string; // O puedes usar Date
  activo: boolean;
  creada: {
    idente: number;
  };
  modificado: {
    idente: number;
    fechaActualizacion: string;
  }[];
  monedasAceptadas: string[];
  monedaPorDefecto: string;
  modulos: string[];
  foto?: string;
}

// Para la respuesta de la API que envuelve los datos
export interface CompanyApiResponse {
  body: {
    data: Compania[];
  };
}
