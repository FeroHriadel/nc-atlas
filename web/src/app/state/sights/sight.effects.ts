import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of } from 'rxjs';
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
        exhaustMap(({ page, pageSize }) =>
          this.sightService.getSights(page, pageSize).pipe(
            map((result) => SightActions.loadSuccess({ result })),
            catchError((error) => of(SightActions.loadFailure({ error: extractError(error) }))),
          ),
        ),
      ),
    );
}



