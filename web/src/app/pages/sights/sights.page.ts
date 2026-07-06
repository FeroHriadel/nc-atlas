import { AsyncPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { SightActions } from '../../state/sights/sight.actions';
import { selectSightItems } from '../../state/sights/sight.reducer';
import { SightCard } from '../../components/sight-card/sight-card';



@Component({
  selector: 'app-sights',
  templateUrl: './sights.page.html',
  styleUrls: ['./sights.page.css'],
  imports: [AsyncPipe, SightCard],
})



export class SightsPage implements OnInit {
    private store = inject(Store);
    sights$ = this.store.select(selectSightItems);

    ngOnInit(): void {
        this.store.dispatch(SightActions.load({page: 1, pageSize: 12}));
    }
}