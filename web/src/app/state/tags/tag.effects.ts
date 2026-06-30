import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { TagService } from './tag.service';
import { TagActions } from './tag.actions';

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
          catchError((error) => of(TagActions.loadFailure({ error: String(error) }))),
        ),
      ),
    ),
  );
}
