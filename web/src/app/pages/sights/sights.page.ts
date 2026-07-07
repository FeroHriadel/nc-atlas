import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject, debounceTime, distinctUntilChanged, map } from 'rxjs';
import { SightActions } from '../../state/sights/sight.actions';
import { sightFeature, selectHasMore } from '../../state/sights/sight.reducer';
import { SightCard } from '../../components/sight-card/sight-card';
import { InfiniteScrollDirective } from '../../directives/infinite-scroll.directive';
import { CategoryActions } from '../../state/categories/category.actions';
import { categoryFeature } from '../../state/categories/category.reducer';
import { TagActions } from '../../state/tags/tag.actions';
import { tagFeature } from '../../state/tags/tag.reducer';
import { Select, SelectOption } from '../../ncss/inputs/select/select.component';

const PAGE_SIZE = 12;

const SORT_OPTIONS: SelectOption[] = [
  { value: 'desc', label: 'Newest first' },
  { value: 'asc', label: 'Oldest first' },
];

@Component({
  selector: 'app-sights',
  templateUrl: './sights.page.html',
  styleUrls: ['./sights.page.css'],
  imports: [AsyncPipe, SightCard, InfiniteScrollDirective, Select],
})



export class SightsPage implements OnInit {
    private store = inject(Store);
    private destroyRef = inject(DestroyRef);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    sights$ = this.store.select(sightFeature.selectSights);
    loading = toSignal(this.store.select(sightFeature.selectLoading), { initialValue: false });
    hasMore = toSignal(this.store.select(selectHasMore), { initialValue: true });

    categoryOptions = toSignal(
        this.store.select(categoryFeature.selectCategories).pipe(
            map((categories) => [
                { value: '', label: 'All categories' },
                ...categories.map((c) => ({ value: String(c.id), label: c.name })),
            ]),
        ),
        { initialValue: [{ value: '', label: 'All categories' }] },
    );

    tagOptions = toSignal(
        this.store.select(tagFeature.selectTags).pipe(
            map((tags) => [
                { value: '', label: 'All tags' },
                ...tags.map((t) => ({ value: t.id, label: t.name })),
            ]),
        ),
        { initialValue: [{ value: '', label: 'All tags' }] },
    );

    sortOptions = SORT_OPTIONS;

    // seed all filter state from the URL so a shared link reproduces the same results
    private readonly initialQueryParams = this.route.snapshot.queryParamMap;

    searchTerm = this.initialQueryParams.get('search') ?? '';
    private categoryId = this.parseCategoryId(this.initialQueryParams.get('categoryId'));
    private tagId = this.initialQueryParams.get('tagId') ?? undefined;
    private sortDirection: 'asc' | 'desc' = this.initialQueryParams.get('sortDirection') === 'asc' ? 'asc' : 'desc';

    initialCategoryValue = this.categoryId != null ? String(this.categoryId) : '';
    initialTagValue = this.tagId ?? '';
    initialSortDirection = this.sortDirection;

    private searchTerm$ = new Subject<string>();
    private nextPage = 1;

    ngOnInit(): void {
        this.store.dispatch(CategoryActions.load());
        this.store.dispatch(TagActions.load());

        this.searchTerm$.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntilDestroyed(this.destroyRef),
        ).subscribe(() => this.applyFilters());

        // unconditional: the store is a long-lived singleton, so hasMore()/loading() may
        // still reflect a stale result from a previous visit to this page this session
        this.loadFirstPage();
    }

    onSearchTermChange(value: string): void {
        this.searchTerm = value;
        this.searchTerm$.next(value);
    }

    onCategoryChange = (value: string | string[]): void => {
        this.categoryId = value ? Number(value) : undefined;
        this.applyFilters();
    };

    onTagChange = (value: string | string[]): void => {
        this.tagId = (value as string) || undefined;
        this.applyFilters();
    };

    onSortDirectionChange = (value: string | string[]): void => {
        this.sortDirection = value === 'asc' ? 'asc' : 'desc';
        this.applyFilters();
    };

    loadNextPage(): void {
        if (this.loading() || !this.hasMore()) return;
        this.dispatchLoad(this.nextPage);
        this.nextPage++;
    }

    private applyFilters(): void {
        this.loadFirstPage();
        this.syncQueryParams();
    }

    private loadFirstPage(): void {
        this.nextPage = 1;
        this.dispatchLoad(1);
        this.nextPage++;
    }

    private dispatchLoad(page: number): void {
        this.store.dispatch(SightActions.load({
            page,
            pageSize: PAGE_SIZE,
            search: this.searchTerm || undefined,
            categoryId: this.categoryId,
            tagId: this.tagId,
            sortDirection: this.sortDirection,
        }));
    }

    private syncQueryParams(): void {
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                search: this.searchTerm || null,
                categoryId: this.categoryId ?? null,
                tagId: this.tagId ?? null,
                sortDirection: this.sortDirection === 'desc' ? null : this.sortDirection,
            },
            queryParamsHandling: 'merge',
            replaceUrl: true,
        });
    }

    private parseCategoryId(raw: string | null): number | undefined {
        const parsed = Number(raw);
        return raw && Number.isInteger(parsed) ? parsed : undefined;
    }
}
