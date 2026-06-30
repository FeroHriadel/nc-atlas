import { createFeature, createReducer, on } from '@ngrx/store';
import { CategoryActions } from './category.actions';
import { Category } from './category.model';

export interface CategoryState {
  categories: Category[];
  loading: boolean;
  error: string | null;
}

const initialState: CategoryState = {
  categories: [],
  loading: false,
  error: null,
};

export const categoryFeature = createFeature({
  name: 'categories',
  reducer: createReducer(
    initialState,
    on(CategoryActions.load, (state): CategoryState => ({ ...state, loading: true, error: null })),
    on(CategoryActions.loadSuccess, (state, { categories }): CategoryState => ({ ...state, categories, loading: false })),
    on(CategoryActions.loadFailure, (state, { error }): CategoryState => ({ ...state, error, loading: false })),
  ),
});
