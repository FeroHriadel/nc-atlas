import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ImportJob, StartImportResponse } from '../types/ImportJob';



@Injectable({ providedIn: 'root' })
export class UploadService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/enrichments`;

  startImport(file: File): Observable<StartImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<StartImportResponse>(`${this.baseUrl}/import`, formData);
  }

  getLatestJob(): Observable<ImportJob | null> {
    return this.http
      .get<ImportJob>(`${this.baseUrl}/import/latest`, { observe: 'response' })
      .pipe(map(res => (res.status === 204 ? null : res.body)));
  }

  getJob(jobId: string): Observable<ImportJob> {
    return this.http.get<ImportJob>(`${this.baseUrl}/import/${jobId}`);
  }

  abortJob(jobId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/import/${jobId}/abort`, {});
  }

  deleteSight(sightId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/sights/${sightId}`);
  }

  deleteAllJobs(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/import`);
  }

  clearAllSights(): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/sights/all`);
  }
}
