import { Sight } from '../sights/sight.model';

export interface Trip {
  id: string;
  title: string;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  sights: Sight[];
}
