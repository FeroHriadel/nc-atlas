import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of, switchMap } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { TagService } from './tag.service';
import { TagActions } from './tag.actions';

const extractError = (err: HttpErrorResponse): string =>
  err.error?.error ?? err.message ?? String(err);

@Injectable()
export class TagEffects {
  private actions$ = inject(Actions);
  private tagService = inject(TagService);

  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TagActions.load),
      exhaustMap(() =>
        this.tagService.getTags().pipe(
          map((tags) => TagActions.loadSuccess({ tags })),
          catchError((error) => of(TagActions.loadFailure({ error: extractError(error) }))),
        ),
      ),
    ),
  );

  create$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TagActions.create),
      switchMap(({ name }) =>
        this.tagService.createTag(name).pipe(
          map((tag) => TagActions.createSuccess({ tag })),
          catchError((error) => of(TagActions.createFailure({ error: extractError(error) }))),
        ),
      ),
    ),
  );

  update$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TagActions.update),
      switchMap(({ id, name }) =>
        this.tagService.updateTag(id, name).pipe(
          map((tag) => TagActions.updateSuccess({ tag })),
          catchError((error) => of(TagActions.updateFailure({ error: extractError(error) }))),
        ),
      ),
    ),
  );

  delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TagActions.delete),
      switchMap(({ id }) =>
        this.tagService.deleteTag(id).pipe(
          map(() => TagActions.deleteSuccess({ id })),
          catchError((error) => of(TagActions.deleteFailure({ error: extractError(error) }))),
        ),
      ),
    ),
  );
}
