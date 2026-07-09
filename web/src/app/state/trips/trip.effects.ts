import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of, switchMap } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { TripService } from './trip.service';
import { TripActions } from './trip.actions';

const extractError = (err: HttpErrorResponse): string =>
  err.error?.error ?? err.message ?? String(err);

@Injectable()
export class TripEffects {
  private actions$ = inject(Actions);
  private tripService = inject(TripService);

  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TripActions.load),
      exhaustMap(() =>
        this.tripService.getTrips().pipe(
          map((trips) => TripActions.loadSuccess({ trips })),
          catchError((error) => of(TripActions.loadFailure({ error: extractError(error) }))),
        ),
      ),
    ),
  );

  create$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TripActions.create),
      switchMap(({ title, note }) =>
        this.tripService.createTrip(title, note).pipe(
          map((trip) => TripActions.createSuccess({ trip })),
          catchError((error) => of(TripActions.createFailure({ error: extractError(error) }))),
        ),
      ),
    ),
  );

  update$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TripActions.update),
      switchMap(({ id, title, note }) =>
        this.tripService.updateTrip(id, title, note).pipe(
          map((trip) => TripActions.updateSuccess({ trip })),
          catchError((error) => of(TripActions.updateFailure({ error: extractError(error) }))),
        ),
      ),
    ),
  );

  delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TripActions.delete),
      switchMap(({ id }) =>
        this.tripService.deleteTrip(id).pipe(
          map(() => TripActions.deleteSuccess({ id })),
          catchError((error) => of(TripActions.deleteFailure({ error: extractError(error) }))),
        ),
      ),
    ),
  );

  addSight$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TripActions.addSight),
      switchMap(({ tripId, sightId }) =>
        this.tripService.addSight(tripId, sightId).pipe(
          map((trip) => TripActions.addSightSuccess({ trip })),
          catchError((error) => of(TripActions.addSightFailure({ error: extractError(error) }))),
        ),
      ),
    ),
  );

  removeSight$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TripActions.removeSight),
      switchMap(({ tripId, sightId }) =>
        this.tripService.removeSight(tripId, sightId).pipe(
          map((trip) => TripActions.removeSightSuccess({ trip })),
          catchError((error) => of(TripActions.removeSightFailure({ error: extractError(error) }))),
        ),
      ),
    ),
  );
}
