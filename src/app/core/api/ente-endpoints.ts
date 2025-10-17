import { environment } from '../../../environments/environment';

const baseUrl = `${environment.apiHost}/api/entes`;

export const enteEndpoints = {
  create: `${baseUrl}`,
};
