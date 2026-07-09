import { createFeature, createReducer, on } from '@ngrx/store';
import { TripActions } from './trip.actions';
import { Trip } from './trip.model';

export interface TripState {
  trips: Trip[];
  loading: boolean;
  error: string | null;
}

const initialState: TripState = {
  trips: [],
  loading: false,
  error: null,
};

export const tripFeature = createFeature({
  name: 'trips',
  reducer: createReducer(
    initialState,
    on(TripActions.load, (state): TripState => ({ ...state, loading: true, error: null })),
    on(TripActions.loadSuccess, (state, { trips }): TripState => ({ ...state, trips, loading: false })),
    on(TripActions.loadFailure, (state, { error }): TripState => ({ ...state, error, loading: false })),

    on(TripActions.create, (state): TripState => ({ ...state, loading: true, error: null })),
    on(TripActions.createSuccess, (state, { trip }): TripState => ({
      ...state,
      trips: [trip, ...state.trips],
      loading: false,
    })),
    on(TripActions.createFailure, (state, { error }): TripState => ({ ...state, error, loading: false })),

    on(TripActions.update, (state): TripState => ({ ...state, loading: true, error: null })),
    on(TripActions.updateSuccess, (state, { trip }): TripState => ({
      ...state,
      trips: state.trips.map(t => t.id === trip.id ? trip : t),
      loading: false,
    })),
    on(TripActions.updateFailure, (state, { error }): TripState => ({ ...state, error, loading: false })),

    on(TripActions.delete, (state): TripState => ({ ...state, loading: true, error: null })),
    on(TripActions.deleteSuccess, (state, { id }): TripState => ({
      ...state,
      trips: state.trips.filter(t => t.id !== id),
      loading: false,
    })),
    on(TripActions.deleteFailure, (state, { error }): TripState => ({ ...state, error, loading: false })),

    on(TripActions.addSightSuccess, (state, { trip }): TripState => ({
      ...state,
      trips: state.trips.map(t => t.id === trip.id ? trip : t),
    })),
    on(TripActions.addSightFailure, (state, { error }): TripState => ({ ...state, error })),

    on(TripActions.removeSightSuccess, (state, { trip }): TripState => ({
      ...state,
      trips: state.trips.map(t => t.id === trip.id ? trip : t),
    })),
    on(TripActions.removeSightFailure, (state, { error }): TripState => ({ ...state, error })),
  ),
});
