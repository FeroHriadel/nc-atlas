import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, ViewChild, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { HttpErrorResponse } from '@angular/common/http';
import { combineLatest, map, take, tap } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { Button } from '../../ncss/buttons/button/button.component';
import { CardList, CardListItem } from '../../ncss/lists/card-list/card-list.component';
import { Modal } from '../../ncss/popups/modal/modal.component';
import { ToastService } from '../../ncss/services/toast.service';
import { TripActions } from '../../state/trips/trip.actions';
import { tripFeature } from '../../state/trips/trip.reducer';
import { TripService } from '../../state/trips/trip.service';
import { downloadItineraryPdf } from '../../state/trips/trip-itinerary-pdf';



const extractError = (err: HttpErrorResponse): string =>
  err.error?.error ?? err.message ?? String(err);

@Component({
  selector: 'app-trip-details',
  templateUrl: './trip-details.page.html',
  styleUrl: './trip-details.page.css',
  imports: [AsyncPipe, CardList, Modal, FormsModule, Button],
})



export class TripDetailsPage implements OnInit {
  @ViewChild('editTripModal') editTripModal!: Modal;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private store = inject(Store);
  private actions$ = inject(Actions);
  private toastService = inject(ToastService);
  private tripService = inject(TripService);
  private destroyRef = inject(DestroyRef);
  authService = inject(AuthService);

  downloading = signal(false);

  tripId = this.route.snapshot.paramMap.get('tripId')!;

  editedTripTitle = '';
  editedTripNote = '';

  tripsLoading$ = this.store.select(tripFeature.selectLoading)
    .pipe(tap(loading => {
      if (loading) {
        this.toastService.toast({ text: 'Loading...' });
      }
    }));

  tripsError$ = this.store.select(tripFeature.selectError)
    .pipe(tap(error => {
      if (error) {
        this.toastService.error({ text: `Error: ${error}`, duration: 5000 });
      }
    }));

  trip$ = this.store.select(tripFeature.selectTrips)
    .pipe(map(trips => trips.find(t => t.id === this.tripId)));

  viewState$ = combineLatest([this.trip$, this.tripsLoading$])
    .pipe(map(([trip, loading]) => ({ trip, loading })));

  sightItems$ = this.trip$.pipe(
    map(trip => trip?.sights.map(sight => ({
      title: sight.title,
      text: [sight.categoryName, [sight.county, sight.state, sight.country].filter(Boolean).join(', ')]
        .filter(Boolean).join(' · '),
      data: sight,
    }) as CardListItem) ?? []),
  );

  constructor() {
    // authService.currentUser() resolves asynchronously (MSAL init + /users/me) on a cold
    // page load, so it's often still null when ngOnInit runs — react to it instead of
    // checking it once. effect() also runs an initial pass immediately, so this covers the
    // already-logged-in case too.
    effect(() => {
      if (this.authService.currentUser()) {
        this.store.dispatch(TripActions.load());
      }
    });
  }

  ngOnInit(): void {
    this.tripsError$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.tripsLoading$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  openSightDetails = (item: CardListItem): void => {
    this.router.navigate(['/sights', item.data.id]);
  }

  goToSights = (): void => {
    this.router.navigate(['/sights']);
  }

  confirmRemoveSight = (item: CardListItem): void => {
    if (confirm(`Remove "${item.data.title}" from this trip?`)) {
      this.store.dispatch(TripActions.removeSight({ tripId: this.tripId, sightId: item.data.id }));
    }
  }

  openEditTripModal = (): void => {
    const trip = this.trip$;
    trip.pipe(take(1)).subscribe(t => {
      if (!t) return;
      this.editedTripTitle = t.title;
      this.editedTripNote = t.note ?? '';
      this.editTripModal.openModal();
    });
  }

  clearEditedTrip = (): void => {
    this.editedTripTitle = '';
    this.editedTripNote = '';
  }

  onEditTrip = (): void => {
    if (!this.editedTripTitle.trim()) {
      this.toastService.error({ text: 'Trip title cannot be empty', duration: 3000 });
      return;
    }
    this.store.dispatch(TripActions.update({ id: this.tripId, title: this.editedTripTitle, note: this.editedTripNote || undefined }));
    this.clearEditedTrip();
    this.editTripModal.closeModal();
  }

  onDeleteTrip = (): void => {
    if (!confirm('Are you sure you want to delete this trip?')) return;

    this.store.dispatch(TripActions.delete({ id: this.tripId }));
    this.actions$.pipe(
      ofType(TripActions.deleteSuccess, TripActions.deleteFailure),
      take(1),
    ).subscribe((action) => {
      if (action.type === TripActions.deleteSuccess.type) {
        this.router.navigate(['/trip-planner']);
      } else {
        this.toastService.error({ text: `Error: ${action.error}`, duration: 5000 });
      }
    });
  }

  onDownload = (): void => {
    if (this.downloading()) return;
    this.downloading.set(true);
    this.toastService.toast({ text: 'Downloading trip itinerary...', duration: 8000 });

    this.tripService.getItinerary(this.tripId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async (itinerary) => {
          try {
            await downloadItineraryPdf(itinerary);
          } catch {
            this.toastService.error({ text: 'Failed to generate PDF', duration: 5000 });
          } finally {
            this.downloading.set(false);
          }
        },
        error: (err) => {
          this.downloading.set(false);
          this.toastService.error({ text: `Failed to prepare download: ${extractError(err)}`, duration: 5000 });
        },
      });
  }
}
