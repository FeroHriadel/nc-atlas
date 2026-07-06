import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { TagActions } from '../../state/tags/tag.actions';
import { tagFeature } from '../../state/tags/tag.reducer';
import { CrudList, CrudListItem } from '../../ncss/lists/crud-list/crud-list.component';
import { Card } from '../../ncss/cards/card/card.component';
import { map, tap } from 'rxjs';
import { ToastService } from '../../ncss/services/toast.service';
import { Modal } from '../../ncss/popups/modal/modal.component';
import { Button } from '../../ncss/buttons/button/button.component';
import { FormsModule } from '@angular/forms';



@Component({
  selector: 'app-admin-tags',
  templateUrl: './admin-tags.page.html',
  styleUrl: './admin-tags.page.css',
  imports: [AsyncPipe, CrudList, Modal, FormsModule],
})



export class AdminTagsPage implements OnInit {
  @ViewChild('createTagModal') createTagModal!: Modal;
  @ViewChild('editTagModal') editTagModal!: Modal;
  private store = inject(Store);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  newTagName: string = '';
  editedTagName: string = '';
  private editedTagId: string | null = null;

  tagsLoading$ = this.store.select(tagFeature.selectLoading)
    .pipe(tap(loading => {
      if (loading) {
        this.toastService.toast({ text: 'Loading...' });
      }
    }));

  tagsError$ = this.store.select(tagFeature.selectError)
    .pipe(tap(error => {
      if (error) {
        this.toastService.error({ text: `Error: ${error}`, duration: 5000 });
      }
    }));

  tags$ = this.store.select(tagFeature.selectTags)
    .pipe(map(tags => tags?.map(tag => ({ text: tag.name, data: tag }) as CrudListItem)));


  ngOnInit(): void {
    this.store.dispatch(TagActions.load());
    this.tagsError$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.tagsLoading$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  clearNewTagName = (): void => {
    this.newTagName = '';
  }

  onCreateTag = (): void => {
    if (!this.newTagName.trim()) {
      this.toastService.error({ text: 'Tag name cannot be empty', duration: 3000 });
      return;
    }
    this.store.dispatch(TagActions.create({ name: this.newTagName }));
    this.clearNewTagName();
    this.createTagModal.closeModal();
  }

  openEditTagModal = (item: CrudListItem): void => {
    this.editedTagId = item.data?.id ?? null;
    this.editedTagName = item.data?.name ?? '';
    this.editTagModal.openModal();
  }

  clearEditedTagName = (): void => {
    this.editedTagName = '';
    this.editedTagId = null;
  }

  onEditTag = (): void => {
    if (!this.editedTagName.trim()) {
      this.toastService.error({ text: 'Tag name cannot be empty', duration: 3000 });
      return;
    }
    if (this.editedTagId) {
      this.store.dispatch(TagActions.update({ id: this.editedTagId, name: this.editedTagName }));
      this.clearEditedTagName();
      this.editTagModal.closeModal();
    }
  }

  confirmDeleteTag = (item: CrudListItem): void => {
    if (item.data && confirm(`Are you sure you want to delete the tag "${item.data.name}"?`)) {
      this.store.dispatch(TagActions.delete({ id: item.data.id }));
    }
  }

  openCreateTagModal = (): void => {
    this.createTagModal.openModal();
  }
}
