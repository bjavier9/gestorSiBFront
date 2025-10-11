import { environment } from '../../../environments/environment';

const baseUrl = `${environment.apiHost}/api/companias`;

export const companyEndpoints = {
  // GET /api/companias
  getAll: `${baseUrl}`,

  // POST /api/companias
  create: `${baseUrl}`,

  // PUT /api/companias/:id
  update: (id: string) => `${baseUrl}/${id}`,

  // PUT /api/companias/:id/activar
  activate: (id: string) => `${baseUrl}/${id}/activar`,

  // PUT /api/companias/:id/desactivar
  deactivate: (id: string) => `${baseUrl}/${id}/desactivar`,
};
