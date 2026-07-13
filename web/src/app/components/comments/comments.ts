import { Component, OnInit, ViewChild, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';
import { Card } from '../../ncss/cards/card/card.component';
import { Button } from '../../ncss/buttons/button/button.component';
import { SquareButton } from '../../ncss/buttons/square-button/square-button.component';
import { DeleteIcon } from '../../ncss/icons';
import { FileUpload } from '../../ncss/inputs/file-upload/file-upload.component';
import { ToastService } from '../../ncss/services/toast.service';
import { SightCommentService } from '../../state/sights/sight-comment.service';
import { SightComment } from '../../state/sights/sight-comment.model';



const MAX_TEXT_LENGTH = 2000;

const extractError = (err: HttpErrorResponse): string =>
  err.error?.error ?? err.message ?? String(err);

@Component({
  selector: 'app-comments',
  imports: [Card, Button, SquareButton, DeleteIcon, FileUpload, FormsModule, DatePipe],
  templateUrl: './comments.html',
  styleUrl: './comments.css',
})



export class Comments implements OnInit {
  sightId = input.required<string>();

  @ViewChild('fileUpload') fileUploadRef?: FileUpload;

  private sightCommentService = inject(SightCommentService);
  private toastService = inject(ToastService);
  authService = inject(AuthService);

  maxTextLength = MAX_TEXT_LENGTH;

  comments = signal<SightComment[]>([]);
  loading = signal(true);
  submitting = signal(false);
  selectedImage = signal<File | null>(null);
  text = '';

  ngOnInit(): void {
    this.sightCommentService.getComments(this.sightId()).subscribe({
      next: (comments) => {
        this.comments.set(comments);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toastService.error({ text: `Failed to load comments: ${extractError(err)}`, duration: 5000 });
      },
    });
  }

  onImageChange = (value: File | File[] | null): void => {
    this.selectedImage.set(Array.isArray(value) ? value[0] ?? null : value);
  };

  onLogin = (): void => {
    this.authService.login();
  };

  onSubmit = (): void => {
    const text = this.text.trim();
    if (!text) {
      this.toastService.error({ text: 'Please write a comment first', duration: 3000 });
      return;
    }
    if (text.length > MAX_TEXT_LENGTH) {
      this.toastService.error({ text: `Comment is too long (max ${MAX_TEXT_LENGTH} characters)`, duration: 3000 });
      return;
    }

    this.submitting.set(true);
    this.sightCommentService.createComment(this.sightId(), text, this.selectedImage() ?? undefined).subscribe({
      next: (comment) => {
        this.comments.update(comments => [comment, ...comments]);
        this.submitting.set(false);
        this.resetForm();
        this.toastService.toast({ text: 'Comment posted' });
      },
      error: (err) => {
        this.submitting.set(false);
        this.toastService.error({ text: extractError(err), duration: 5000 });
      },
    });
  };

  onDelete = (comment: SightComment): void => {
    if (!confirm('Delete this comment?')) return;

    this.sightCommentService.deleteComment(this.sightId(), comment.id).subscribe({
      next: () => {
        this.comments.update(comments => comments.filter(c => c.id !== comment.id));
        this.toastService.toast({ text: 'Comment deleted' });
      },
      error: (err) => {
        this.toastService.error({ text: extractError(err), duration: 5000 });
      },
    });
  };

  private resetForm(): void {
    this.text = '';
    this.selectedImage.set(null);
    const upload = this.fileUploadRef;
    if (upload) {
      upload.selectedFiles = null;
      upload.fileInputRef.nativeElement.value = '';
    }
  }
}
