import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';
import { Roles } from './roles';



export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const isPrivileged = (role?: string) => role === Roles.Admin || role === Roles.Owner;

  const cachedUser = auth.currentUser();
  if (cachedUser) {
    return isPrivileged(cachedUser.role) || router.createUrlTree(['/']);
  }

  return auth.loadCurrentUser().pipe(
    map((user) => (isPrivileged(user?.role) ? true : router.createUrlTree(['/'])))
  );
};
