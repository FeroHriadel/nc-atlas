import { Component, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { firstValueFrom, filter, take } from 'rxjs';
import { UserActions } from '../../state/users/user.actions';
import { userFeature } from '../../state/users/user.reducer';
import { UserService } from '../../state/users/user.service';
import { Card } from '../../ncss/cards/card/card.component';
import { UserIcon } from '../../ncss/icons/user.icon';
import { TimesIcon } from '../../ncss/icons/times.icon';
import { Button } from '../../ncss/buttons/button/button.component';
import { FormService } from '../../ncss/services/form.service';
import { ToastService } from '../../ncss/services/toast.service';



@Component({
  selector: 'app-my-account',
  templateUrl: './my-account.page.html',
  styleUrls: ['./my-account.page.css'],
  imports: [AsyncPipe, Card, UserIcon, TimesIcon, Button],
})



export class MyAccountPage implements OnInit {
  private store = inject(Store);
  private formService = inject(FormService);
  private userService = inject(UserService);
  private toastService = inject(ToastService);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  formId = 'my-account-form';
  displayImageUrl = signal('');
  isSubmitting = signal(false);

  currentUser$ = this.store.select(userFeature.selectCurrentUser);

  ngOnInit() {
    this.store.dispatch(UserActions.loadMe());
    this.store.select(userFeature.selectCurrentUser).pipe(
      filter(user => user !== null),
      take(1),
    ).subscribe(user => {
      this.formService.setFormValues(this.formId, {
        username: user.username || '',
        bio: user.bio || '',
      });
      this.displayImageUrl.set(user.profileImageUrl || '');
    });
  }

  async onSubmit(event: Event) {
    event.preventDefault();
    this.isSubmitting.set(true);

    const values = this.formService.getFormValues(this.formId);
    const files = values['profileImageUrl'] as File[];
    let profileImageUrl: string | undefined = this.displayImageUrl() || undefined;

    if (files?.length > 0) {
      try {
        const resized = await this.resizeImage(files[0], 350);
        const { uploadUrl, blobUrl } = await firstValueFrom(
          this.userService.getUploadUrl(files[0].name)
        );
        await firstValueFrom(this.userService.uploadToBlob(uploadUrl, resized));
        profileImageUrl = blobUrl;
        this.displayImageUrl.set(blobUrl);
      } catch {
        this.toastService.error({ text: 'Image upload failed — saving other changes without it.', duration: 4000 });
      }
    }

    this.store.dispatch(UserActions.updateMe({
      username: values['username'] as string,
      bio: values['bio'] as string | undefined,
      profileImageUrl,
    }));

    this.isSubmitting.set(false);
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.displayImageUrl.set(URL.createObjectURL(file));
    }
  }

  removeProfileImage() {
    this.displayImageUrl.set('');
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  private resizeImage(file: File, targetWidth: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const height = Math.round(img.height * (targetWidth / img.width));
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, targetWidth, height);
        canvas.toBlob(
          blob => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
          file.type || 'image/jpeg',
          0.9,
        );
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Image load failed')); };
      img.src = objectUrl;
    });
  }
}
