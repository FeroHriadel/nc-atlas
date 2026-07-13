import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SightComment } from './sight-comment.model';

@Injectable({ providedIn: 'root' })
export class SightCommentService {
  private http = inject(HttpClient);

  getComments(sightId: string): Observable<SightComment[]> {
    return this.http.get<SightComment[]>(`${environment.apiUrl}/sights/${sightId}/comments`);
  }

  getLatestComments(count = 6): Observable<SightComment[]> {
    return this.http.get<SightComment[]>(`${environment.apiUrl}/comments/latest`, { params: { count } });
  }

  createComment(sightId: string, text: string, image?: File): Observable<SightComment> {
    const formData = new FormData();
    formData.append('text', text);
    if (image) formData.append('image', image);
    return this.http.post<SightComment>(`${environment.apiUrl}/sights/${sightId}/comments`, formData);
  }

  deleteComment(sightId: string, commentId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/sights/${sightId}/comments/${commentId}`);
  }
}
