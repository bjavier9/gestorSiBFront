import { environment } from '../../../environments/environment';

const baseUrl = `${environment.apiHost}/api/users`;

export const userEndpoints = {
  create: `${baseUrl}`,
  listAll: `${baseUrl}`,
  listOperationalByCompany: `${baseUrl}/compania/operativos`,
  updateStatus: (id: string) => `${baseUrl}/${id}/status`,
  listAssociations: `${baseUrl}/me/associations`,
};
