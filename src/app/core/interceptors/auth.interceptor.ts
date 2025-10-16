import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  const isApiRequest = req.url.startsWith(environment.apiHost);

  // Skip modification when there is no token or the request targets an external resource.
  if (!token || !isApiRequest) {
    return next(req);
  }

  const authRequest = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`),
  });

  return next(authRequest);
};
