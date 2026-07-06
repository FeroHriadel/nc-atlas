import { createActionGroup, props } from '@ngrx/store';
import { Sight } from '../sights/sight.model';
import { PagedResult } from '../users/user.model';



export const SightActions = createActionGroup({
  source: 'Sight',
  events: {
    'Load': props<{ page?: number, pageSize?: number }>(),
    'Load Success': props<{ result: PagedResult<Sight> }>(),
    'Load Failure': props<{ error: string }>(),
  },
});