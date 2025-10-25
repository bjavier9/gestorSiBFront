import { environment } from '../../../environments/environment';

const baseUrl = `${environment.apiHost}/api/gestiones`;
const notesBaseUrl = (gestionId: string) => `${baseUrl}/${gestionId}/notas`;

export const gestionEndpoints = {
  list: baseUrl,
  create: baseUrl,
  detail: (gestionId: string) => `${baseUrl}/${gestionId}`,
  update: (gestionId: string) => `${baseUrl}/${gestionId}`,
  delete: (gestionId: string) => `${baseUrl}/${gestionId}`,
  reasignar: (gestionId: string) => `${baseUrl}/${gestionId}/reasignar`,
  notas: {
    list: notesBaseUrl,
    create: notesBaseUrl,
    detail: (gestionId: string, notaId: string) => `${notesBaseUrl(gestionId)}/${notaId}`,
    update: (gestionId: string, notaId: string) => `${notesBaseUrl(gestionId)}/${notaId}`,
    delete: (gestionId: string, notaId: string) => `${notesBaseUrl(gestionId)}/${notaId}`,
  },
};
