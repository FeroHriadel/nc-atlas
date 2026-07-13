import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GalleryImage } from './gallery-image.model';

@Injectable({ providedIn: 'root' })
export class GalleryImageService {
  private http = inject(HttpClient);

  getGalleryImages(sightId: string): Observable<GalleryImage[]> {
    return this.http.get<GalleryImage[]>(`${environment.apiUrl}/sights/${sightId}/gallery`);
  }

  getLatestGalleryImages(count = 6): Observable<GalleryImage[]> {
    return this.http.get<GalleryImage[]>(`${environment.apiUrl}/gallery/latest`, { params: { count } });
  }

  uploadImage(sightId: string, file: File, comment: string): Observable<GalleryImage> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('comment', comment);
    return this.http.post<GalleryImage>(`${environment.apiUrl}/sights/${sightId}/gallery`, formData);
  }

  deleteImage(sightId: string, imageId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/sights/${sightId}/gallery/${imageId}`);
  }
}
