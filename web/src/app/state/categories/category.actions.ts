import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Category } from './category.model';

export const CategoryActions = createActionGroup({
  source: 'Category',
  events: {
    'Load': emptyProps(),
    'Load Success': props<{ categories: Category[] }>(),
    'Load Failure': props<{ error: string }>(),

    'Create': props<{ name: string }>(),
    'Create Success': props<{ category: Category }>(),
    'Create Failure': props<{ error: string }>(),

    'Update': props<{ id: number, name: string }>(),
    'Update Success': props<{ category: Category }>(),
    'Update Failure': props<{ error: string }>(),

    'Delete': props<{ id: number }>(),
    'Delete Success': props<{ id: number }>(),
    'Delete Failure': props<{ error: string }>(),
  },
});
