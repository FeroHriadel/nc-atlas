import { createFeature, createReducer, on } from '@ngrx/store';
import { TagActions } from './tag.actions';
import { Tag } from './tag.model';

export interface TagState {
  tags: Tag[];
  loading: boolean;
  error: string | null;
}

const initialState: TagState = {
  tags: [],
  loading: false,
  error: null,
};

export const tagFeature = createFeature({
  name: 'tags',
  reducer: createReducer(
    initialState,
    on(TagActions.load, (state): TagState => ({ ...state, loading: true, error: null })),
    on(TagActions.loadSuccess, (state, { tags }): TagState => ({ ...state, tags, loading: false })),
    on(TagActions.loadFailure, (state, { error }): TagState => ({ ...state, error, loading: false })),
  ),
});
