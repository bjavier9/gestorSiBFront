import { environment } from '../../../environments/environment';

const baseUrl = `${environment.apiHost}/api/entes`;

export const enteEndpoints = {
  create: `${baseUrl}`,
  searchByEmail: (correo: string, companiaCorretajeId?: string) => {
    const params = new URLSearchParams({ correo });
    if (companiaCorretajeId) {
      params.append('companiaCorretajeId', companiaCorretajeId);
    }
    return `${baseUrl}/search?${params.toString()}`;
  },
};
