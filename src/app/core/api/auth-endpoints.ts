import { environment } from '../../../environments/environment';

const baseAuthUrl = `${environment.apiHost}/api/auth`;

export const authEndpoints = {
  login: `${baseAuthUrl}/login`,
  selectCompany: `${baseAuthUrl}/select/compania`,
  // Additional authentication endpoints can be added here.
};
