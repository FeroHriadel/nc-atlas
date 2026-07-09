import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Trip } from './trip.model';

export const TripActions = createActionGroup({
  source: 'Trip',
  events: {
    'Load': emptyProps(),
    'Load Success': props<{ trips: Trip[] }>(),
    'Load Failure': props<{ error: string }>(),

    'Create': props<{ title: string, note?: string }>(),
    'Create Success': props<{ trip: Trip }>(),
    'Create Failure': props<{ error: string }>(),

    'Update': props<{ id: string, title: string, note?: string }>(),
    'Update Success': props<{ trip: Trip }>(),
    'Update Failure': props<{ error: string }>(),

    'Delete': props<{ id: string }>(),
    'Delete Success': props<{ id: string }>(),
    'Delete Failure': props<{ error: string }>(),

    'Add Sight': props<{ tripId: string, sightId: string }>(),
    'Add Sight Success': props<{ trip: Trip }>(),
    'Add Sight Failure': props<{ error: string }>(),

    'Remove Sight': props<{ tripId: string, sightId: string }>(),
    'Remove Sight Success': props<{ trip: Trip }>(),
    'Remove Sight Failure': props<{ error: string }>(),
  },
});
