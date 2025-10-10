export interface User {
  token: string;
  email: string;
  isSuperAdmin?: boolean;
  name?: string;
}
