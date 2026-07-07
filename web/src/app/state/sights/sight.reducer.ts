import { createFeature, createReducer, createSelector, on } from '@ngrx/store';
import { SightActions } from './sight.actions';
import { Sight } from './sight.model';

export interface SightState {
  sights: Sight[];
  page: number;
  pageSize: number;
  totalCount: number | null;
  loading: boolean;
  error: string | null;
}

const initialState: SightState = {
  sights: [],
  page: 0,
  pageSize: 0,
  totalCount: null,
  loading: false,
  error: null,
};

export const sightFeature = createFeature({
  name: 'sights',
  reducer: createReducer(
    initialState,
    on(SightActions.load, (state): SightState => ({ ...state, loading: true, error: null })),
    on(SightActions.loadSuccess, (state, { result }): SightState => ({
      ...state,
      sights: result.page <= 1 ? result.items : [...state.sights, ...result.items],
      page: result.page,
      pageSize: result.pageSize,
      totalCount: result.totalCount,
      loading: false,
    })),
    on(SightActions.loadFailure, (state, { error }): SightState => ({ ...state, error, loading: false })),
  ),
});

export const selectHasMore = createSelector(
  sightFeature.selectSights,
  sightFeature.selectTotalCount,
  // totalCount is null until the first page has loaded — treat "unknown" as "more to fetch"
  (sights, totalCount) => totalCount === null || sights.length < totalCount,
);
