import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { from, switchMap, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';



export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) return next(req);

  const msal = inject(MsalService);
  const account = msal.instance.getActiveAccount() ?? msal.instance.getAllAccounts()[0] ?? null;

  if (!account) return next(req);

  return from(msal.instance.acquireTokenSilent({ account, scopes: [environment.msal.apiScope] })).pipe(
    catchError((err) => {
      // Only catches token acquisition errors — NOT errors from the actual HTTP request.
      // Placing catchError before switchMap keeps it scoped to acquireTokenSilent only.
      if (err instanceof InteractionRequiredAuthError) {
        inject(AuthService).currentUser.set(null);
        msal.instance.setActiveAccount(null);
      }
      return of(null);
    }),
    switchMap((result) =>
      result
        ? next(req.clone({ headers: req.headers.set('Authorization', `Bearer ${result.accessToken}`) }))
        : next(req)
    )
  );
};
