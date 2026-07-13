import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, ViewChild, effect, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, tap } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { Button } from '../../ncss/buttons/button/button.component';
import { CardList, CardListItem } from '../../ncss/lists/card-list/card-list.component';
import { Modal } from '../../ncss/popups/modal/modal.component';
import { ToastService } from '../../ncss/services/toast.service';
import { TripActions } from '../../state/trips/trip.actions';
import { Trip } from '../../state/trips/trip.model';
import { tripFeature } from '../../state/trips/trip.reducer';



@Component({
  selector: 'app-trip-planner',
  templateUrl: './trip-planner.page.html',
  styleUrl: './trip-planner.page.css',
  imports: [AsyncPipe, CardList, Modal, FormsModule, Button],
})



export class TripPlannerPage implements OnInit {
  @ViewChild('createTripModal') createTripModal!: Modal;
  @ViewChild('editTripModal') editTripModal!: Modal;
  private store = inject(Store);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  authService = inject(AuthService);

  newTripTitle = '';
  newTripNote = '';
  editedTripTitle = '';
  editedTripNote = '';
  private editedTripId: string | null = null;

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

  trips$ = this.store.select(tripFeature.selectTrips)
    .pipe(map(trips => trips?.map(trip => ({ title: trip.title, text: trip.note ?? '', data: trip }) as CardListItem)));

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

  onLogin = (): void => {
    this.authService.login();
  }

  clearNewTrip = (): void => {
    this.newTripTitle = '';
    this.newTripNote = '';
  }

  onCreateTrip = (): void => {
    if (!this.newTripTitle.trim()) {
      this.toastService.error({ text: 'Trip title cannot be empty', duration: 3000 });
      return;
    }
    this.store.dispatch(TripActions.create({ title: this.newTripTitle, note: this.newTripNote || undefined }));
    this.clearNewTrip();
    this.createTripModal.closeModal();
  }

  openTripDetails = (item: CardListItem): void => {
    const trip = item.data as Trip;
    this.router.navigate(['/trip-details', trip.id]);
  }

  openEditTripModal = (item: CardListItem): void => {
    const trip = item.data as Trip;
    this.editedTripId = trip.id;
    this.editedTripTitle = trip.title;
    this.editedTripNote = trip.note ?? '';
    this.editTripModal.openModal();
  }

  clearEditedTrip = (): void => {
    this.editedTripTitle = '';
    this.editedTripNote = '';
    this.editedTripId = null;
  }

  onEditTrip = (): void => {
    if (!this.editedTripTitle.trim()) {
      this.toastService.error({ text: 'Trip title cannot be empty', duration: 3000 });
      return;
    }
    if (this.editedTripId) {
      this.store.dispatch(TripActions.update({ id: this.editedTripId, title: this.editedTripTitle, note: this.editedTripNote || undefined }));
      this.clearEditedTrip();
      this.editTripModal.closeModal();
    }
  }

  confirmDeleteTrip = (item: CardListItem): void => {
    const trip = item.data as Trip;
    if (confirm(`Are you sure you want to delete the trip "${trip.title}"?`)) {
      this.store.dispatch(TripActions.delete({ id: trip.id }));
    }
  }

  openCreateTripModal = (): void => {
    this.createTripModal.openModal();
  }
}
