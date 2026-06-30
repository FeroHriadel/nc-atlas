import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { CategoryService } from './category.service';
import { CategoryActions } from './category.actions';

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
          catchError((error) => of(CategoryActions.loadFailure({ error: String(error) }))),
        ),
      ),
    ),
  );
}
