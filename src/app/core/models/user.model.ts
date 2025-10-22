export interface User {
  token: string;
  email: string;
  isSuperAdmin?: boolean;
  name?: string;
  uid?: string;
  role?: string;
  companyId?: string;
  officeId?: string;
  entityId?: string;
  requiresCompanySelection?: boolean;
}
