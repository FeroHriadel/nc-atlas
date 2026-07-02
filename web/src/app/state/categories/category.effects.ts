import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of, switchMap } from 'rxjs';
import { CategoryService } from './category.service';
import { CategoryActions } from './category.actions';
import { HttpErrorResponse } from '@angular/common/http';

const extractError = (err: HttpErrorResponse): string =>
  err.error?.error ?? err.message ?? String(err);

@Injectable()
export class CategoryEffects {
  private actions$ = inject(Actions);
  private categoryService = inject(CategoryService);

  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CategoryActions.load),
      exhaustMap(() =>
        this.categoryService.getCategories().pipe(
          map((categories) => CategoryActions.loadSuccess({ categories })),
          catchError((error) => of(CategoryActions.loadFailure({ error: extractError(error) }))),
        ),
      ),
    ),
  );

  create$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CategoryActions.create),
      switchMap(({ name }) =>
        this.categoryService.createCategory(name).pipe(
          map((category) => CategoryActions.createSuccess({ category })),
          catchError((error) => of(CategoryActions.createFailure({ error: extractError(error) }))),
        ),
      ),
    ),
  );

  update$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CategoryActions.update),
      switchMap(({ id, name }) =>
        this.categoryService.updateCategory({ id, newName: name }).pipe(
          map((category) => CategoryActions.updateSuccess({ category })),
          catchError((error) => of(CategoryActions.updateFailure({ error: extractError(error) }))),
        ),
      ),
    ),
  );

  delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CategoryActions.delete),
      switchMap(({ id }) =>
        this.categoryService.deleteCategory(id).pipe(
          map(() => CategoryActions.deleteSuccess({ id })),
          catchError((error) => of(CategoryActions.deleteFailure({ error: extractError(error) }))),
        ),
      ),
    ),
  );
}
