import { AsyncPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { SightActions } from '../../state/sights/sight.actions';
import { sightFeature, selectHasMore } from '../../state/sights/sight.reducer';
import { SightCard } from '../../components/sight-card/sight-card';
import { InfiniteScrollDirective } from '../../directives/infinite-scroll.directive';

const PAGE_SIZE = 12;

@Component({
  selector: 'app-sights',
  templateUrl: './sights.page.html',
  styleUrls: ['./sights.page.css'],
  imports: [AsyncPipe, SightCard, InfiniteScrollDirective],
})



export class SightsPage implements OnInit {
    private store = inject(Store);
    sights$ = this.store.select(sightFeature.selectSights);
    loading = toSignal(this.store.select(sightFeature.selectLoading), { initialValue: false });
    hasMore = toSignal(this.store.select(selectHasMore), { initialValue: true });

    private nextPage = 1;

    ngOnInit(): void {
        this.loadNextPage();
    }

    loadNextPage(): void {
        if (this.loading() || !this.hasMore()) return;
        this.store.dispatch(SightActions.load({ page: this.nextPage, pageSize: PAGE_SIZE }));
        this.nextPage++;
    }
}