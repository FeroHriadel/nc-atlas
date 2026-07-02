import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Tag } from './tag.model';

@Injectable({ providedIn: 'root' })
export class TagService {
  private http = inject(HttpClient);

  getTags(): Observable<Tag[]> {
    return this.http.get<Tag[]>(`${environment.apiUrl}/tags`);
  }

  createTag(name: string): Observable<Tag> {
    return this.http.post<Tag>(`${environment.apiUrl}/tags`, { name });
  }

  updateTag(id: string, name: string): Observable<Tag> {
    return this.http.put<Tag>(`${environment.apiUrl}/tags/${id}`, { name });
  }

  deleteTag(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/tags/${id}`);
  }
}
