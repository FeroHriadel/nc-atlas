import { createFeature, createReducer, on } from '@ngrx/store';
import { UserActions } from './user.actions';
import { PagedResult, User } from './user.model';

export interface UserState {
  currentUser: User | null;
  users: PagedResult<User> | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  currentUser: null,
  users: null,
  loading: false,
  error: null,
};

export const userFeature = createFeature({
  name: 'users',
  reducer: createReducer(
    initialState,
    on(UserActions.loadMe, (state): UserState => ({ ...state, loading: true, error: null })),
    on(UserActions.loadMeSuccess, (state, { user }): UserState => ({ ...state, currentUser: user, loading: false })),
    on(UserActions.loadMeFailure, (state, { error }): UserState => ({ ...state, error, loading: false })),

    on(UserActions.updateMe, (state): UserState => ({ ...state, loading: true, error: null })),
    on(UserActions.updateMeSuccess, (state, { user }): UserState => ({ ...state, currentUser: user, loading: false })),
    on(UserActions.updateMeFailure, (state, { error }): UserState => ({ ...state, error, loading: false })),

    on(UserActions.load, (state): UserState => ({ ...state, loading: true, error: null })),
    on(UserActions.loadSuccess, (state, { result }): UserState => ({ ...state, users: result, loading: false })),
    on(UserActions.loadFailure, (state, { error }): UserState => ({ ...state, error, loading: false })),

    on(UserActions.updateRole, (state): UserState => ({ ...state, loading: true, error: null })),
    on(UserActions.updateRoleSuccess, (state, { user }): UserState => ({
      ...state,
      loading: false,
      users: state.users ? {
        ...state.users,
        items: state.users.items.map(u => u.id === user.id ? user : u),
      } : null,
    })),
    on(UserActions.updateRoleFailure, (state, { error }): UserState => ({ ...state, error, loading: false })),

    on(UserActions.create, (state): UserState => ({ ...state, loading: true, error: null })),
    on(UserActions.createSuccess, (state, { user }): UserState => ({
      ...state,
      loading: false,
      users: state.users ? {
        ...state.users,
        items: [user, ...state.users.items],
        totalCount: state.users.totalCount + 1,
      } : null,
    })),
    on(UserActions.createFailure, (state, { error }): UserState => ({ ...state, error, loading: false })),

    on(UserActions.delete, (state): UserState => ({ ...state, loading: true, error: null })),
    on(UserActions.deleteSuccess, (state, { id }): UserState => ({
      ...state,
      loading: false,
      users: state.users ? {
        ...state.users,
        items: state.users.items.filter(u => u.id !== id),
        totalCount: state.users.totalCount - 1,
      } : null,
    })),
    on(UserActions.deleteFailure, (state, { error }): UserState => ({ ...state, error, loading: false })),
  ),
});
