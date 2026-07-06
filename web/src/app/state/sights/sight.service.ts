import { inject, Injectable } from '@angular/core';
import { Sight } from './sight.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs/internal/Observable';
import { PagedResult } from '../users/user.model';



@Injectable({ providedIn: 'root' })

export class SightService {
    private http: HttpClient = inject(HttpClient);

    getSights(page = 1, pageSize = 20): Observable<PagedResult<Sight>> {
        return this.http.get<PagedResult<Sight>>(`${environment.apiUrl}/sights`, {
            params: { page, pageSize }
        });
    }
}