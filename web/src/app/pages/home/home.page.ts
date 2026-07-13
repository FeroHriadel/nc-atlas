import { AsyncPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { CategoryActions } from '../../state/categories/category.actions';
import { categoryFeature } from '../../state/categories/category.reducer';
import { TagActions } from '../../state/tags/tag.actions';
import { tagFeature } from '../../state/tags/tag.reducer';
import { SightActions } from '../../state/sights/sight.actions';
import { sightFeature } from '../../state/sights/sight.reducer';
import { Hero } from '../../components/hero/hero.component';
import { About } from '../../components/about/about.component';
import { SightCard } from '../../components/sight-card/sight-card';



@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.css'],
  imports: [AsyncPipe, Hero, About, SightCard],
})



export class HomePage implements OnInit {
  private store = inject(Store);
  categories$ = this.store.select(categoryFeature.selectCategories);
  categoriesLoading$ = this.store.select(categoryFeature.selectLoading);
  tags$ = this.store.select(tagFeature.selectTags);
  tagsLoading$ = this.store.select(tagFeature.selectLoading);
  latestSights$ = this.store.select(sightFeature.selectLatest);

  ngOnInit(): void {
    this.store.dispatch(CategoryActions.load());
    this.store.dispatch(TagActions.load());
    this.store.dispatch(SightActions.loadLatest());
  }
}
