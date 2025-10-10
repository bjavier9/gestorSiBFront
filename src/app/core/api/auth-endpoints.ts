import { environment } from '../../../environments/environment';

const API_BASE = `${environment.apiHost}/api`;

export const authEndpoints = {
  login: `${API_BASE}/auth/login`,
  // Aquí se pueden añadir otros endpoints de autenticación en el futuro
  // register: `${API_BASE}/auth/register`,
  // forgotPassword: `${API_BASE}/auth/forgot-password`,
};
