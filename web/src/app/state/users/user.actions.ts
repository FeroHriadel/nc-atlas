import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { PagedResult, User } from './user.model';
import { CreateUserRequest } from './user.service';

export const UserActions = createActionGroup({
  source: 'User',
  events: {
    'Load Me': emptyProps(),
    'Load Me Success': props<{ user: User }>(),
    'Load Me Failure': props<{ error: string }>(),

    'Update Me': props<{ username: string; bio?: string; profileImageUrl?: string }>(),
    'Update Me Success': props<{ user: User }>(),
    'Update Me Failure': props<{ error: string }>(),

    'Load': props<{ page?: number, pageSize?: number }>(),
    'Load Success': props<{ result: PagedResult<User> }>(),
    'Load Failure': props<{ error: string }>(),

    'Create': props<{ request: CreateUserRequest }>(),
    'Create Success': props<{ user: User }>(),
    'Create Failure': props<{ error: string }>(),

    'Update Role': props<{ id: string; role: string }>(),
    'Update Role Success': props<{ user: User }>(),
    'Update Role Failure': props<{ error: string }>(),

    'Delete': props<{ id: string }>(),
    'Delete Success': props<{ id: string }>(),
    'Delete Failure': props<{ error: string }>(),
  },
});
