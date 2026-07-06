import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { CategoryActions } from '../../state/categories/category.actions';
import { categoryFeature } from '../../state/categories/category.reducer';
import { CrudList, CrudListItem } from '../../ncss/lists/crud-list/crud-list.component';
import { Card } from '../../ncss/cards/card/card.component';
import { map, tap } from 'rxjs';
import { ToastService } from '../../ncss/services/toast.service';
import { Modal } from '../../ncss/popups/modal/modal.component';
import { Button } from '../../ncss/buttons/button/button.component';
import { FormsModule } from '@angular/forms';



@Component({
  selector: 'app-admin-categories',
  templateUrl: './admin-categories.page.html',
  styleUrl: './admin-categories.page.css',
  imports: [AsyncPipe, CrudList, Modal, FormsModule],
})



export class AdminCategoriesPage implements OnInit {
  @ViewChild('createCategoryModal') createCategoryModal!: Modal;
  @ViewChild('editCategoryModal') editCategoryModal!: Modal;
  private store = inject(Store);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  newCategoryName: string = '';
  editedCategoryName: string = '';
  private editedCategoryId: number | null = null;

  categoriesLoading$ = this.store.select(categoryFeature.selectLoading)
    .pipe(tap(loading => {
      if (loading) {
        this.toastService.toast({text: 'Loading...'})
      }
    }));

  categoriesError$ = this.store.select(categoryFeature.selectError)
    .pipe(tap(error => {
      if (error) {
        this.toastService.error({text: `Error: ${error}`, duration: 5000})
      }
    }));

  categories$ = this.store.select(categoryFeature.selectCategories)
    .pipe(map(categories => categories?.map(category => ({text: category.name, data: category}) as CrudListItem)));  


  ngOnInit(): void {
    this.store.dispatch(CategoryActions.load());
    this.categoriesError$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.categoriesLoading$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  clearNewCategoryName = (): void => {
    this.newCategoryName = '';
  }

  onCreateCategory = (): void => {
    if (!this.newCategoryName.trim()) {
      this.toastService.error({text: 'Category name cannot be empty', duration: 3000});
      return;
    }
    this.store.dispatch(CategoryActions.create({ name: this.newCategoryName }));
    this.clearNewCategoryName();
    this.closeCreateCategoryModal();
  }

  openEditCategoryModal = (item: CrudListItem): void => {
    this.editedCategoryId = item.data?.id ?? null;
    this.editedCategoryName = item.data?.name ?? '';
    this.editCategoryModal.openModal();
  }

  clearEditedCategoryName = (): void => {
    this.editedCategoryName = '';
    this.editedCategoryId = null;
  }

  onEditCategory = (): void => {
    if (!this.editedCategoryName.trim()) {
      this.toastService.error({text: 'Category name cannot be empty', duration: 3000});
      return;
    }
    if (this.editedCategoryId) {
      this.store.dispatch(CategoryActions.update({ id: this.editedCategoryId, name: this.editedCategoryName }));
      this.clearEditedCategoryName();
      this.editCategoryModal.closeModal();
    }
  }

  onDeleteCategory = (item: CrudListItem): void => {
    if (item.data) {
        this.store.dispatch(CategoryActions.delete({ id: item.data.id }));
    }
  }

  confirmDeleteCategory = (item: CrudListItem): void => {
    if (item.data && confirm(`Are you sure you want to delete the category "${item.data.name}"?`)) {
      this.onDeleteCategory(item);
    }
  }

  openCreateCategoryModal = (): void => {
    this.createCategoryModal.openModal();
  }

  closeCreateCategoryModal = (): void => {
    this.createCategoryModal.closeModal();
  }

}