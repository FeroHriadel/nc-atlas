import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Tag } from './tag.model';

export const TagActions = createActionGroup({
  source: 'Tag',
  events: {
    'Load': emptyProps(),
    'Load Success': props<{ tags: Tag[] }>(),
    'Load Failure': props<{ error: string }>(),

    'Create': props<{ name: string }>(),
    'Create Success': props<{ tag: Tag }>(),
    'Create Failure': props<{ error: string }>(),

    'Update': props<{ id: string, name: string }>(),
    'Update Success': props<{ tag: Tag }>(),
    'Update Failure': props<{ error: string }>(),

    'Delete': props<{ id: string }>(),
    'Delete Success': props<{ id: string }>(),
    'Delete Failure': props<{ error: string }>(),
  },
});
