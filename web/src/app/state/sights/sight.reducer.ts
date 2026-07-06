import { createFeature, createReducer, createSelector, on } from '@ngrx/store';
import { SightActions } from './sight.actions';
import { Sight } from './sight.model';
import { PagedResult } from '../users/user.model';

export interface SightState {
  sights: PagedResult<Sight> | null;
  loading: boolean;
  error: string | null;
}

const initialState: SightState = {
  sights: null,
  loading: false,
  error: null,
};

export const sightFeature = createFeature({
  name: 'sights',
  reducer: createReducer(
    initialState,
    on(SightActions.load, (state): SightState => ({ ...state, loading: true, error: null })),
    on(SightActions.loadSuccess, (state, { result }): SightState => ({ ...state, sights: result, loading: false })),
    on(SightActions.loadFailure, (state, { error }): SightState => ({ ...state, error, loading: false })),
  ),
});

export const selectSightItems = createSelector(sightFeature.selectSights, (sights) => sights?.items ?? []);
