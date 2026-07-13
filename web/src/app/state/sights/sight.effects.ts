import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { SightActions } from './sight.actions';
import { SightService } from './sight.service';

const extractError = (err: HttpErrorResponse): string =>
  err.error?.error ?? err.message ?? String(err);

@Injectable()
export class SightEffects {
    private actions$: Actions = inject(Actions);
    private sightService = inject(SightService);

    load$ = createEffect(() =>
      this.actions$.pipe(
        ofType(SightActions.load),
        switchMap(({ page, pageSize, search, categoryId, tagId, sortDirection }) =>
          this.sightService.getSights(page, pageSize, { search, categoryId, tagId, sortDirection }).pipe(
            map((result) => SightActions.loadSuccess({ result })),
            catchError((error) => of(SightActions.loadFailure({ error: extractError(error) }))),
          ),
        ),
      ),
    );

    loadLatest$ = createEffect(() =>
      this.actions$.pipe(
        ofType(SightActions.loadLatest),
        switchMap(() =>
          this.sightService.getLatestSights().pipe(
            map((sights) => SightActions.loadLatestSuccess({ sights })),
            catchError((error) => of(SightActions.loadLatestFailure({ error: extractError(error) }))),
          ),
        ),
      ),
    );
}



