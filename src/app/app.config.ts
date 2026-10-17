import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';

import { HttpHandlerFn, HttpRequest, provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    )
  ]
};

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const clonedReq = req.clone({
    withCredentials: true  // ESSENCIAL para enviar cookies
  });
  return next(clonedReq);
}
