import { DecimalPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, computed, inject, isDevMode, signal } from '@angular/core';
import { Subscription, interval, switchMap } from 'rxjs';
import { Card } from '../../ncss/cards/card/card.component';
import { Button } from '../../ncss/buttons/button/button.component';
import { FileUpload } from '../../ncss/inputs/file-upload/file-upload.component';
import { Pill } from '../../ncss/pills/pill/pill.component';
import { ToastService } from '../../ncss/services/toast.service';
import { UploadService } from '../../services/upload.service';
import { ImportJob } from '../../types/ImportJob';



@Component({
  selector: 'app-admin-sights',
  templateUrl: './admin-sights.page.html',
  styleUrl: './admin-sights.page.css',
  imports: [Card, Button, FileUpload, Pill, DecimalPipe]
})
export class AdminSightsPage implements OnInit, OnDestroy {
  @ViewChild('zipUploadRef') private zipUploadRef?: FileUpload;

  private uploadService = inject(UploadService);
  private toast = inject(ToastService);

  readonly isDev = isDevMode();

  job = signal<ImportJob | null>(null);
  selectedFile = signal<File | null>(null);
  isUploading = signal(false);
  deletedSightIds = signal(new Set<string>());

  isActive = computed(() => {
    const s = this.job()?.status;
    return s === 'Pending' || s === 'Processing';
  });

  canUpload = computed(() => !!this.selectedFile() && !this.isActive() && !this.isUploading());

  succeededItems = computed(() =>
    this.job()?.items.filter(
      i => i.status === 'Succeeded' && !this.deletedSightIds().has(i.sightId!)
    ) ?? []
  );

  remainingCount = computed(() =>
    Math.max(0, (this.job()?.totalCount ?? 0) - (this.job()?.processedCount ?? 0))
  );

  showAcknowledge = computed(() => {
    const s = this.job()?.status;
    return s === 'Completed' || s === 'Aborted';
  });

  private pollingSubscription: Subscription | null = null;

  ngOnInit(): void {
    this.uploadService.getLatestJob().subscribe({
      next: job => {
        this.job.set(job);
        if (job && this.isActive()) this.startPolling(job.id);
      }
    });
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  onFileChange = (value: File | File[] | null) => {
    const file = Array.isArray(value) ? value[0] : value;
    this.selectedFile.set(file ?? null);
  };

  onUpload = () => {
    const file = this.selectedFile();
    if (!file || !this.canUpload()) return;

    this.isUploading.set(true);
    this.uploadService.startImport(file).subscribe({
      next: res => {
        this.isUploading.set(false);
        if (res.skipped.length > 0) {
          this.toast.toast({
            text: `Skipped (already in DB): ${res.skipped.join(', ')}`,
            duration: 6000
          });
        }
        // Kick off a fresh poll immediately so the job appears without waiting 3s
        this.uploadService.getJob(res.jobId).subscribe(job => this.job.set(job));
        this.startPolling(res.jobId);
      },
      error: err => {
        this.isUploading.set(false);
        console.error('Upload error raw:', err, 'err.error:', err.error, 'typeof:', typeof err.error);
        this.toast.error({ text: this.extractErrorMessage(err), duration: 6000 });
      }
    });
  };

  onAbort = () => {
    const jobId = this.job()?.id;
    if (!jobId) return;
    this.uploadService.abortJob(jobId).subscribe({
      error: () => this.toast.error({ text: 'Failed to send abort signal' })
    });
  };

  onDelete = (sightId: string) => {
    if (!confirm('Delete this sight permanently?')) return;
    this.uploadService.deleteSight(sightId).subscribe({
      next: () => this.deletedSightIds.update(ids => new Set([...ids, sightId])),
      error: () => this.toast.error({ text: 'Failed to delete sight' })
    });
  };

  private startPolling(jobId: string): void {
    this.stopPolling();
    this.pollingSubscription = interval(3000)
      .pipe(switchMap(() => this.uploadService.getJob(jobId)))
      .subscribe({
        next: job => {
          this.job.set(job);
          if (job.status === 'Completed' || job.status === 'Aborted') {
            this.stopPolling();
            this.clearFileUpload();
          }
        },
        error: () => this.stopPolling()
      });
  }

  onAcknowledge = () => {
    this.uploadService.deleteAllJobs().subscribe({
      next: () => {
        this.job.set(null);
        this.deletedSightIds.set(new Set());
        this.clearFileUpload();
      },
      error: () => this.toast.error({ text: 'Failed to acknowledge' })
    });
  };

  onClearAllSights = () => {
    if (!confirm('This will permanently delete ALL sights and their images from BlobStorage. Continue?')) return;
    this.uploadService.clearAllSights().subscribe({
      next: () => this.toast.toast({ text: 'All sights cleared' }),
      error: () => this.toast.error({ text: 'Failed to clear sights' })
    });
  };

  private extractErrorMessage(err: { error: unknown; status?: number; statusText?: string }): string {
    if (err.error != null) {
      const body = typeof err.error === 'string'
        ? (() => { try { return JSON.parse(err.error as string); } catch { return null; } })()
        : err.error;
      const msg = (body as { error?: string })?.error;
      if (msg) return msg;
    }
    if (err.status) return `${err.status} ${err.statusText ?? 'Error'}`;
    return 'Upload failed';
  }

  private clearFileUpload(): void {
    this.selectedFile.set(null);
    this.zipUploadRef?.clearFileInput(new Event('clear'));
  }

  private stopPolling(): void {
    this.pollingSubscription?.unsubscribe();
    this.pollingSubscription = null;
  }
}
