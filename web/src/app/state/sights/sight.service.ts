import { inject, Injectable } from '@angular/core';
import { Sight, SightFilters } from './sight.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs/internal/Observable';
import { PagedResult } from '../users/user.model';



@Injectable({ providedIn: 'root' })

export class SightService {
    private http: HttpClient = inject(HttpClient);

    getSights(page = 1, pageSize = 20, filters: SightFilters = {}): Observable<PagedResult<Sight>> {
        const params: Record<string, string | number> = { page, pageSize };
        if (filters.search) params['search'] = filters.search;
        if (filters.categoryId != null) params['categoryId'] = filters.categoryId;
        if (filters.tagId) params['tagId'] = filters.tagId;
        if (filters.sortDirection) params['sortDirection'] = filters.sortDirection;

        return this.http.get<PagedResult<Sight>>(`${environment.apiUrl}/sights`, { params });
    }

    getSightById(id: string): Observable<Sight> {
        return this.http.get<Sight>(`${environment.apiUrl}/sights/${id}`);
    }
}