import { Component, ViewChild, inject, input } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { take } from 'rxjs';
import { Button } from '../../ncss/buttons/button/button.component';
import { SquareButton } from '../../ncss/buttons/square-button/square-button.component';
import { CarIcon } from '../../ncss/icons/car.icon';
import { PlusIcon } from '../../ncss/icons/plus.icon';
import { Popover } from '../../ncss/popups/popover/popover.component';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from '../../ncss/services/toast.service';
import { TripActions } from '../../state/trips/trip.actions';
import { tripFeature } from '../../state/trips/trip.reducer';



@Component({
  selector: 'app-add-to-trip-button',
  imports: [Button, SquareButton, CarIcon, PlusIcon, Popover, AsyncPipe, FormsModule],
  templateUrl: './add-to-trip-button.html',
  styleUrl: './add-to-trip-button.css',
})



export class AddToTripButton {
    private store = inject(Store);
    private actions$ = inject(Actions);
    private toastService = inject(ToastService);
    authService = inject(AuthService);

    sightId = input.required<string>();
    size = input<'small' | 'medium' | 'large'>('small');

    @ViewChild('addToTripPopover') addToTripPopover!: Popover;

    newTripTitle = '';
    private tripsRequested = false;

    trips$ = this.store.select(tripFeature.selectTrips);

    onAddToTripTriggerClick = (): void => {
        if (!this.tripsRequested && this.authService.currentUser()) {
            this.tripsRequested = true;
            this.store.dispatch(TripActions.load());
        }
    };

    onLogin = (): void => {
        this.authService.login();
    };

    onAddToTrip = (tripId: string): void => {
        const sightId = this.sightId();

        this.store.dispatch(TripActions.addSight({ tripId, sightId }));
        this.actions$.pipe(
            ofType(TripActions.addSightSuccess, TripActions.addSightFailure),
            take(1),
        ).subscribe((action) => {
            if (action.type === TripActions.addSightSuccess.type) {
                this.toastService.toast({ text: 'Added to trip' });
            } else {
                this.toastService.error({ text: `Error: ${action.error}`, duration: 5000 });
            }
        });

        this.addToTripPopover?.close();
    };

    onCreateTrip = (): void => {
        const title = this.newTripTitle.trim();
        if (!title) return;

        this.store.dispatch(TripActions.create({ title }));
        this.newTripTitle = '';
    };
}
