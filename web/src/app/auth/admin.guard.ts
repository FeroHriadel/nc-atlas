import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';
import { Roles } from './roles';



export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const cachedUser = auth.currentUser();
  if (cachedUser) {
    return cachedUser.role === Roles.Admin || router.createUrlTree(['/']);
  }

  return auth.loadCurrentUser().pipe(
    map((user) => (user?.role === Roles.Admin ? true : router.createUrlTree(['/'])))
  );
};
