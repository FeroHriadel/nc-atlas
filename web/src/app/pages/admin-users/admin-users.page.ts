import { Component, DestroyRef, inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { UserActions } from '../../state/users/user.actions';
import { userFeature } from '../../state/users/user.reducer';
import { AsyncPipe } from '@angular/common';
import { Column, Table } from '../../ncss/tables/table/table';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, tap } from 'rxjs';
import { User } from '../../state/users/user.model';
import { ToastService } from '../../ncss/services/toast.service';
import { Modal } from '../../ncss/popups/modal/modal.component';
import { Button } from '../../ncss/buttons/button/button.component';
import { FormsModule } from '@angular/forms';



@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.page.html',
  styleUrls: ['./admin-users.page.css'],
  imports: [Table, AsyncPipe, Modal, Button, FormsModule],
})



export class AdminUsersPage implements OnInit {
  @ViewChild('createUserModal') createUserModal!: Modal;
  @ViewChild('editUserModal') editUserModal!: Modal;

  @ViewChild('actionsTemplate') set actionsTemplate(t: TemplateRef<any>) {
    if (t) {
      this.columnsConfig = [
        ...this.baseColumns,
        { column: 'actions', displayValue: 'Actions', width: '160px', template: t },
      ];
    }
  }

  private store = inject(Store);
  private destroyRef = inject(DestroyRef);
  private toastService = inject(ToastService);

  newDisplayName = '';
  newEmail = '';
  newTemporaryPassword = '';
  newRole = 'User';

  editedRole = '';
  private editedUserId: string | null = null;

  readonly baseColumns: Column[] = [
    { column: 'username', displayValue: 'Username' },
    { column: 'email', displayValue: 'Email' },
    { column: 'role', displayValue: 'Role', width: '100px' },
    { column: 'createdAt', displayValue: 'Created At' },
  ];

  columnsConfig: Column[] = this.baseColumns;

  users$ = this.store.select(userFeature.selectUsers)
      .pipe(map(result => result?.items ?? []));

  usersLoading$ = this.store.select(userFeature.selectLoading)
      .pipe(tap(loading => {
        if (loading) {
          this.toastService.toast({ text: 'Loading...' });
        }
      }));

  usersError$ = this.store.select(userFeature.selectError)
    .pipe(tap(error => {
      if (error) {
        this.toastService.error({ text: `Error: ${error}`, duration: 5000 });
      }
    }));

  ngOnInit() {
    this.store.dispatch(UserActions.load({ page: 1, pageSize: 20 }));
    this.usersError$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.usersLoading$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  clearNewUser = (): void => {
    this.newDisplayName = '';
    this.newEmail = '';
    this.newTemporaryPassword = '';
    this.newRole = 'User';
  }

  onCreateUser = (): void => {
    if (!this.newDisplayName.trim() || !this.newEmail.trim() || !this.newTemporaryPassword.trim()) {
      this.toastService.error({ text: 'All fields are required', duration: 3000 });
      return;
    }
    this.store.dispatch(UserActions.create({
      request: {
        displayName: this.newDisplayName,
        email: this.newEmail,
        temporaryPassword: this.newTemporaryPassword,
        role: this.newRole,
      }
    }));
    this.clearNewUser();
    this.createUserModal.closeModal();
  }

  openCreateUserModal = (): void => {
    this.createUserModal.openModal();
  }

  openEditUserModal = (user: User): void => {
    if (user.role === 'Owner') {
      this.toastService.error({ text: 'Owner accounts cannot be modified', duration: 3000 });
      return;
    }
    this.editedUserId = user.id;
    this.editedRole = user.role;
    this.editUserModal.openModal();
  }

  clearEditedUser = (): void => {
    this.editedRole = '';
    this.editedUserId = null;
  }

  onEditUser = (): void => {
    if (this.editedUserId) {
      this.store.dispatch(UserActions.updateRole({ id: this.editedUserId, role: this.editedRole }));
      this.clearEditedUser();
      this.editUserModal.closeModal();
    }
  }

  confirmDeleteUser = (user: User): void => {
    if (user.role === 'Owner') {
      this.toastService.error({ text: 'Owner accounts cannot be deleted', duration: 3000 });
      return;
    }
    if (confirm(`Are you sure you want to delete the user "${user.username}"?`)) {
      this.store.dispatch(UserActions.delete({ id: user.id }));
    }
  }
}
