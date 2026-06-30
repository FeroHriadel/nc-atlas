import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { from, switchMap, catchError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';



export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) return next(req);

  const msal = inject(MsalService);
  const account = msal.instance.getActiveAccount() ?? msal.instance.getAllAccounts()[0] ?? null;

  if (!account) return next(req);

  return from(msal.instance.acquireTokenSilent({ account, scopes: [environment.msal.apiScope] })).pipe(
    switchMap((result) =>
      next(req.clone({ headers: req.headers.set('Authorization', `Bearer ${result.accessToken}`) }))
    ),
    catchError((err) => {
      if (err instanceof InteractionRequiredAuthError) {
        // Refresh token expired — clear local session so the UI shows the user as logged out
        inject(AuthService).currentUser.set(null);
        msal.instance.setActiveAccount(null);
      }
      return next(req);
    })
  );
};
