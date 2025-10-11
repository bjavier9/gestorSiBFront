import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  const isApiRequest = req.url.startsWith(environment.apiHost);

  // Si no hay token o no es una petición a nuestra API, la dejamos pasar sin modificarla
  if (!token || !isApiRequest) {
    return next(req);
  }

  // Clonamos la petición para añadir la nueva cabecera
  const authReq = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`)
  });

  // Enviamos la petición clonada con la cabecera de autenticación
  return next(authReq);
};
