import { environment } from '../../../environments/environment';

const baseUrl = `${environment.apiHost}/api/companias`;

export const companyEndpoints = {
  // Retrieves every company
  getAll: `${baseUrl}`,

  // Creates a company
  create: `${baseUrl}`,

  // Updates a company by id
  update: (id: string) => `${baseUrl}/${id}`,

  // Activates a company by id
  activate: (id: string) => `${baseUrl}/${id}/activar`,

  // Deactivates a company by id
  deactivate: (id: string) => `${baseUrl}/${id}/desactivar`,
};
