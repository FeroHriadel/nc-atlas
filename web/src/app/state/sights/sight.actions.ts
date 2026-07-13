import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Sight, SightFilters } from '../sights/sight.model';
import { PagedResult } from '../users/user.model';



export const SightActions = createActionGroup({
  source: 'Sight',
  events: {
    'Load': props<{ page?: number, pageSize?: number } & SightFilters>(),
    'Load Success': props<{ result: PagedResult<Sight> }>(),
    'Load Failure': props<{ error: string }>(),

    'Load Latest': emptyProps(),
    'Load Latest Success': props<{ sights: Sight[] }>(),
    'Load Latest Failure': props<{ error: string }>(),
  },
});