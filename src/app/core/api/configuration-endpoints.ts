import { environment } from '../../../environments/environment';

const baseUrl = `${environment.apiHost}/api/configurations`;

export const configurationEndpoints = {
  getById: (id: string) => `${baseUrl}/${id}`,
};
