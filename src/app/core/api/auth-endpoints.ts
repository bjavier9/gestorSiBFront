import { environment } from '../../../environments/environment';

const baseAuthUrl = `${environment.apiHost}/api/auth`;

export const authEndpoints = {
  login: `${baseAuthUrl}/login`,
  // Additional authentication endpoints can be added here.
};
