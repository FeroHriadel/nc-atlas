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

    on(TagActions.create, (state): TagState => ({ ...state, loading: true, error: null })),
    on(TagActions.createSuccess, (state, { tag }): TagState => ({
      ...state,
      tags: [tag, ...state.tags],
      loading: false,
    })),
    on(TagActions.createFailure, (state, { error }): TagState => ({ ...state, error, loading: false })),

    on(TagActions.update, (state): TagState => ({ ...state, loading: true, error: null })),
    on(TagActions.updateSuccess, (state, { tag }): TagState => ({
      ...state,
      tags: state.tags.map(t => t.id === tag.id ? tag : t),
      loading: false,
    })),
    on(TagActions.updateFailure, (state, { error }): TagState => ({ ...state, error, loading: false })),

    on(TagActions.delete, (state): TagState => ({ ...state, loading: true, error: null })),
    on(TagActions.deleteSuccess, (state, { id }): TagState => ({
      ...state,
      tags: state.tags.filter(t => t.id !== id),
      loading: false,
    })),
    on(TagActions.deleteFailure, (state, { error }): TagState => ({ ...state, error, loading: false })),
  ),
});
