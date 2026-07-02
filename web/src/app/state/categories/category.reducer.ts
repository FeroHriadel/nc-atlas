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

    on(CategoryActions.create, (state): CategoryState => ({ ...state, loading: true, error: null })),
    on(CategoryActions.createSuccess, (state, { category }): CategoryState => ({
      ...state,
      categories: [category, ...state.categories],
      loading: false,
    })),
    on(CategoryActions.createFailure, (state, { error }): CategoryState => ({ ...state, error, loading: false })),

    on(CategoryActions.update, (state): CategoryState => ({ ...state, loading: true, error: null })),
    on(CategoryActions.updateSuccess, (state, { category }): CategoryState => ({
      ...state,
      categories: state.categories.map((c) => (c.id === category.id ? category : c)),
      loading: false,
    })),
    on(CategoryActions.updateFailure, (state, { error }): CategoryState => ({ ...state, error, loading: false })),

    on(CategoryActions.delete, (state): CategoryState => ({ ...state, loading: true, error: null })),
    on(CategoryActions.deleteSuccess, (state, { id }): CategoryState => ({
      ...state,
      categories: state.categories.filter((c) => c.id !== id),
      loading: false,
    })),
    on(CategoryActions.deleteFailure, (state, { error }): CategoryState => ({ ...state, error, loading: false })),
  ),
});
