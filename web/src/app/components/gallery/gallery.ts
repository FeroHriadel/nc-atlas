import { Component, HostListener, OnInit, ViewChild, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';
import { Card } from '../../ncss/cards/card/card.component';
import { Button } from '../../ncss/buttons/button/button.component';
import { SquareButton } from '../../ncss/buttons/square-button/square-button.component';
import { ArrowRightIcon } from '../../ncss/icons';
import { FileUpload } from '../../ncss/inputs/file-upload/file-upload.component';
import { Modal } from '../../ncss/popups/modal/modal.component';
import { ToastService } from '../../ncss/services/toast.service';
import { GalleryImageService } from '../../state/sights/gallery-image.service';
import { GalleryImage } from '../../state/sights/gallery-image.model';
import { GalleryCard } from '../gallery-card/gallery-card';



const MAX_IMAGES = 10;

const extractError = (err: HttpErrorResponse): string =>
  err.error?.error ?? err.message ?? String(err);

@Component({
  selector: 'app-gallery',
  imports: [Card, Button, SquareButton, ArrowRightIcon, FileUpload, Modal, GalleryCard, FormsModule],
  templateUrl: './gallery.html',
  styleUrl: './gallery.css',
})



export class Gallery implements OnInit {
  sightId = input.required<string>();

  @ViewChild('fileUpload') fileUploadRef?: FileUpload;
  @ViewChild('lightboxModal') lightboxModalRef?: Modal;

  private galleryImageService = inject(GalleryImageService);
  private toastService = inject(ToastService);
  authService = inject(AuthService);

  images = signal<GalleryImage[]>([]);
  loading = signal(true);
  uploading = signal(false);
  selectedFile = signal<File | null>(null);
  comment = '';

  lightboxIndex = signal<number | null>(null);
  lightboxImage = signal<GalleryImage | null>(null);

  ngOnInit(): void {
    this.galleryImageService.getGalleryImages(this.sightId()).subscribe({
      next: (images) => {
        this.images.set(images);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toastService.error({ text: `Failed to load gallery: ${extractError(err)}`, duration: 5000 });
      },
    });
  }

  onFileChange = (value: File | File[] | null): void => {
    this.selectedFile.set(Array.isArray(value) ? value[0] ?? null : value);
  };

  onUpload = (): void => {
    const file = this.selectedFile();
    if (!file) {
      this.toastService.error({ text: 'Please choose an image first', duration: 3000 });
      return;
    }
    if (!this.comment.trim()) {
      this.toastService.error({ text: 'Please add a short comment', duration: 3000 });
      return;
    }
    if (this.images().length >= MAX_IMAGES) {
      this.toastService.error({ text: 'Max number of images reached. Please remove some images first.', duration: 5000 });
      return;
    }

    this.uploading.set(true);
    this.galleryImageService.uploadImage(this.sightId(), file, this.comment.trim()).subscribe({
      next: (image) => {
        this.images.update(images => [image, ...images]);
        this.uploading.set(false);
        this.resetUploadForm();
        this.toastService.toast({ text: 'Image uploaded' });
      },
      error: (err) => {
        this.uploading.set(false);
        this.toastService.error({ text: extractError(err), duration: 5000 });
      },
    });
  };

  onDeleteClick = (image: GalleryImage): void => {
    if (!confirm('Delete this image?')) return;

    this.galleryImageService.deleteImage(this.sightId(), image.id).subscribe({
      next: () => {
        this.images.update(images => images.filter(i => i.id !== image.id));
        this.toastService.toast({ text: 'Image deleted' });
      },
      error: (err) => {
        this.toastService.error({ text: extractError(err), duration: 5000 });
      },
    });
  };

  onImageClick = (image: GalleryImage): void => {
    const index = this.images().findIndex(i => i.id === image.id);
    if (index === -1) return;
    this.lightboxIndex.set(index);
    this.lightboxImage.set(image);
    this.lightboxModalRef?.openModal();
  };

  onLightboxClose = (): void => {
    this.lightboxIndex.set(null);
    this.lightboxImage.set(null);
  };

  // Only browse via arrow keys while the lightbox is actually open, so keystrokes elsewhere
  // on the page (e.g. typing a comment) aren't hijacked.
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this.lightboxIndex() === null) return;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.onPrevImage();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.onNextImage();
    }
  }

  onPrevImage = (): void => {
    this.stepLightbox(-1);
  };

  onNextImage = (): void => {
    this.stepLightbox(1);
  };

  private stepLightbox(step: number): void {
    const images = this.images();
    const index = this.lightboxIndex();
    if (index === null || images.length === 0) return;

    const nextIndex = (index + step + images.length) % images.length;
    this.lightboxIndex.set(nextIndex);
    this.lightboxImage.set(images[nextIndex]);
  }

  private resetUploadForm(): void {
    this.selectedFile.set(null);
    this.comment = '';
    const upload = this.fileUploadRef;
    if (upload) {
      upload.selectedFiles = null;
      upload.fileInputRef.nativeElement.value = '';
    }
  }
}
