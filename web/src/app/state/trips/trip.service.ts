import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Trip } from './trip.model';
import { TripItinerary } from './trip-itinerary.model';

@Injectable({ providedIn: 'root' })
export class TripService {
  private http = inject(HttpClient);

  getTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${environment.apiUrl}/trips`);
  }

  createTrip(title: string, note?: string): Observable<Trip> {
    return this.http.post<Trip>(`${environment.apiUrl}/trips`, { title, note });
  }

  updateTrip(id: string, title: string, note?: string): Observable<Trip> {
    return this.http.put<Trip>(`${environment.apiUrl}/trips/${id}`, { title, note });
  }

  deleteTrip(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/trips/${id}`);
  }

  addSight(tripId: string, sightId: string): Observable<Trip> {
    return this.http.post<Trip>(`${environment.apiUrl}/trips/${tripId}/sights/${sightId}`, {});
  }

  removeSight(tripId: string, sightId: string): Observable<Trip> {
    return this.http.delete<Trip>(`${environment.apiUrl}/trips/${tripId}/sights/${sightId}`);
  }

  getItinerary(tripId: string): Observable<TripItinerary> {
    return this.http.get<TripItinerary>(`${environment.apiUrl}/trips/${tripId}/itinerary`);
  }
}
