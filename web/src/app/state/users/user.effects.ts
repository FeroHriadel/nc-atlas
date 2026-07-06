import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of, switchMap } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService } from './user.service';
import { UserActions } from './user.actions';

const extractError = (err: HttpErrorResponse): string =>
  err.error?.error ?? err.message ?? String(err);

@Injectable()
export class UserEffects {
  private actions$ = inject(Actions);
  private userService = inject(UserService);

  updateMe$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.updateMe),
      switchMap(({ username, bio, profileImageUrl }) =>
        this.userService.updateMe(username, bio, profileImageUrl).pipe(
          map((user) => UserActions.updateMeSuccess({ user })),
          catchError((error) => of(UserActions.updateMeFailure({ error: extractError(error) }))),
        ),
      ),
    ),
  );

  loadMe$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.loadMe),
      switchMap(() =>
        this.userService.getMe().pipe(
          map((user) => UserActions.loadMeSuccess({ user })),
          catchError((error) => of(UserActions.loadMeFailure({ error: extractError(error) }))),
        ),
      ),
    ),
  );

  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.load),
      exhaustMap(({ page, pageSize }) =>
        this.userService.getUsers(page, pageSize).pipe(
          map((result) => UserActions.loadSuccess({ result })),
          catchError((error) => of(UserActions.loadFailure({ error: extractError(error) }))),
        ),
      ),
    ),
  );

  create$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.create),
      switchMap(({ request }) =>
        this.userService.createUser(request).pipe(
          map((user) => UserActions.createSuccess({ user })),
          catchError((error) => of(UserActions.createFailure({ error: extractError(error) }))),
        ),
      ),
    ),
  );

  updateRole$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.updateRole),
      switchMap(({ id, role }) =>
        this.userService.updateUserRole(id, role).pipe(
          map((user) => UserActions.updateRoleSuccess({ user })),
          catchError((error) => of(UserActions.updateRoleFailure({ error: extractError(error) }))),
        ),
      ),
    ),
  );

  delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.delete),
      switchMap(({ id }) =>
        this.userService.deleteUser(id).pipe(
          map(() => UserActions.deleteSuccess({ id })),
          catchError((error) => of(UserActions.deleteFailure({ error: extractError(error) }))),
        ),
      ),
    ),
  );
}
