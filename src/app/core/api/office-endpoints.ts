import { environment } from '../../../environments/environment';

const baseUrl = `${environment.apiHost}/api/companias`;
const buildCompanyOfficesUrl = (companyId: string) => `${baseUrl}/${companyId}/oficinas`;
const buildCompanyOfficeUrl = (companyId: string, officeId: string) =>
  `${buildCompanyOfficesUrl(companyId)}/${officeId}`;

export const officeEndpoints = {
  create: buildCompanyOfficesUrl,
  list: buildCompanyOfficesUrl,
  detail: buildCompanyOfficeUrl,
  update: buildCompanyOfficeUrl,
  delete: buildCompanyOfficeUrl,
};
