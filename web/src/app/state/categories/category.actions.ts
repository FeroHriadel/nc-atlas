import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Category } from './category.model';

export const CategoryActions = createActionGroup({
  source: 'Category',
  events: {
    'Load': emptyProps(),
    'Load Success': props<{ categories: Category[] }>(),
    'Load Failure': props<{ error: string }>(),
  },
});
