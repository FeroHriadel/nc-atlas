import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SightFactContent, SightFactJob } from './sight-fact.model';



@Injectable({ providedIn: 'root' })
export class SightFactService {
    private http = inject(HttpClient);

    getFacts(sightId: string): Observable<SightFactContent | null> {
        return this.http.get<SightFactContent>(`${environment.apiUrl}/sights/${sightId}/facts`).pipe(
            catchError((err) => this.recoverFrom404<SightFactContent>(err))
        );
    }

    getLatestJob(sightId: string): Observable<SightFactJob | null> {
        return this.http.get<SightFactJob>(`${environment.apiUrl}/sights/${sightId}/fact-jobs/latest`).pipe(
            catchError((err) => this.recoverFrom404<SightFactJob>(err))
        );
    }

    getJob(sightId: string, jobId: string): Observable<SightFactJob> {
        return this.http.get<SightFactJob>(`${environment.apiUrl}/sights/${sightId}/fact-jobs/${jobId}`);
    }

    createJob(sightId: string, feedback?: string, previousJobId?: string): Observable<SightFactJob> {
        return this.http.post<SightFactJob>(`${environment.apiUrl}/sights/${sightId}/fact-jobs`, { feedback, previousJobId });
    }

    saveFromJob(sightId: string, jobId: string): Observable<SightFactContent> {
        return this.http.post<SightFactContent>(`${environment.apiUrl}/sights/${sightId}/facts/from-job/${jobId}`, {});
    }

    discardJob(sightId: string, jobId: string): Observable<void> {
        return this.http.delete<void>(`${environment.apiUrl}/sights/${sightId}/fact-jobs/${jobId}`);
    }

    deleteFacts(sightId: string): Observable<void> {
        return this.http.delete<void>(`${environment.apiUrl}/sights/${sightId}/facts`);
    }

    // 404 means "nothing yet" here, not an error — anything else should still surface to the caller
    private recoverFrom404<T>(err: unknown): Observable<T | null> {
        if (err instanceof HttpErrorResponse && err.status === 404) return of(null);
        return throwError(() => err);
    }
}
