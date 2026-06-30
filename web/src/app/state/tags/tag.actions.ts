import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Tag } from './tag.model';

export const TagActions = createActionGroup({
  source: 'Tag',
  events: {
    'Load': emptyProps(),
    'Load Success': props<{ tags: Tag[] }>(),
    'Load Failure': props<{ error: string }>(),
  },
});
