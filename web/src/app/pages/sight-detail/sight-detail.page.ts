import { Component, OnInit, DestroyRef, signal, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Sight } from '../../state/sights/sight.model';
import { SightService } from '../../state/sights/sight.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Pill } from '../../ncss/pills/pill/pill.component';
import { Button } from '../../ncss/buttons/button/button.component';
import { GpsIcon, FlagIcon, AreaIcon, InfoIcon, WarningIcon } from '../../ncss/icons';
import { FormsModule } from '@angular/forms';
import { forkJoin, interval, switchMap, takeWhile } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { SightFactService } from '../../state/sights/sight-fact.service';
import { SightFactContent, SightFactJob } from '../../state/sights/sight-fact.model';
import { SightFactContentComponent } from '../../components/sight-fact-content/sight-fact-content';
import { ToastService } from '../../ncss/services/toast.service';
import { Card } from '../../ncss/cards/card/card.component';
import { AddToTripButton } from '../../components/add-to-trip-button/add-to-trip-button';



const POLL_INTERVAL_MS = 2000;

const extractError = (err: HttpErrorResponse): string =>
  err.error?.error ?? err.message ?? String(err);

@Component({
  selector: 'app-sight-detail',
  templateUrl: './sight-detail.page.html',
  styleUrl: './sight-detail.page.css',
  imports: [Pill, Button, GpsIcon, FlagIcon, AreaIcon, InfoIcon, WarningIcon, FormsModule, SightFactContentComponent, Card, AddToTripButton]
})



export class SightDetailPage implements OnInit {
  sight = signal<Sight | undefined>(undefined);
  loading = signal(true);
  error = signal('');

  facts = signal<SightFactContent | null>(null);
  factsJob = signal<SightFactJob | null>(null);
  factsLoading = signal(true);
  factsActionLoading = signal(false);
  isEditingFacts = signal(false);
  feedbackText = signal('');

  private route = inject(ActivatedRoute);
  private sightService = inject(SightService);
  private sightFactService = inject(SightFactService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  isAdmin = this.authService.isAdmin;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('sightId');
    if (!id) return;

    this.sightService.getSightById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (sight) => {
          this.sight.set(sight);
          this.loading.set(false);
          this.error.set('');
        },
        error: () => {
          this.error.set('Failed to load sight details');
          this.loading.set(false);
          this.sight.set(undefined);
        }
      });

    this.loadFactsState(id);
  }

  onGetFacts = (): void => {
    const sightId = this.sight()?.id;
    if (!sightId || this.factsActionLoading()) return;

    this.factsActionLoading.set(true);
    this.sightFactService.createJob(sightId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (job) => {
          this.factsActionLoading.set(false);
          this.factsJob.set(job);
          this.pollJob(sightId, job.id);
        },
        error: (err) => {
          this.factsActionLoading.set(false);
          this.toastService.error({ text: `Failed to start fact generation: ${extractError(err)}`, duration: 5000 });
        }
      });
  };

  onStartEdit = (): void => {
    this.feedbackText.set('');
    this.isEditingFacts.set(true);
  };

  onCancelEdit = (): void => {
    this.isEditingFacts.set(false);
  };

  // With no active job (editing already-saved facts), previousJobId is omitted — the
  // server chains off the job that produced the saved facts instead.
  onSubmitEdit = (): void => {
    const sightId = this.sight()?.id;
    const feedback = this.feedbackText().trim();
    if (!sightId || !feedback || this.factsActionLoading()) return;

    const previousJobId = this.factsJob()?.id;

    this.factsActionLoading.set(true);
    this.sightFactService.createJob(sightId, feedback, previousJobId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (newJob) => {
          this.factsActionLoading.set(false);
          this.isEditingFacts.set(false);
          this.factsJob.set(newJob);
          this.pollJob(sightId, newJob.id);
        },
        error: (err) => {
          this.factsActionLoading.set(false);
          this.toastService.error({ text: `Failed to submit edit: ${extractError(err)}`, duration: 5000 });
        }
      });
  };

  onSaveFacts = (): void => {
    const sightId = this.sight()?.id;
    const job = this.factsJob();
    if (!sightId || !job || this.factsActionLoading()) return;

    this.factsActionLoading.set(true);
    this.sightFactService.saveFromJob(sightId, job.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (content) => {
          this.factsActionLoading.set(false);
          this.facts.set(content);
          this.factsJob.set(null);
        },
        error: (err) => {
          this.factsActionLoading.set(false);
          this.toastService.error({ text: `Failed to save facts: ${extractError(err)}`, duration: 5000 });
        }
      });
  };

  // Discards an unsaved draft job (Succeeded or Failed) and falls back to whatever was
  // last actually saved — or the empty state if nothing was ever saved.
  onDiscardDraft = (): void => {
    const sightId = this.sight()?.id;
    const job = this.factsJob();
    if (!sightId || !job || this.factsActionLoading()) return;

    this.factsActionLoading.set(true);
    this.sightFactService.discardJob(sightId, job.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.factsActionLoading.set(false);
          this.isEditingFacts.set(false);
          this.factsJob.set(null);
          this.loadFactsState(sightId);
        },
        error: (err) => {
          this.factsActionLoading.set(false);
          this.toastService.error({ text: `Failed to discard draft: ${extractError(err)}`, duration: 5000 });
        }
      });
  };

  onDeleteFacts = (): void => {
    const sightId = this.sight()?.id;
    if (!sightId || this.factsActionLoading()) return;
    if (!confirm('Delete all Sight Facts for this sight? This cannot be undone.')) return;

    this.factsActionLoading.set(true);
    this.sightFactService.deleteFacts(sightId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.factsActionLoading.set(false);
          this.facts.set(null);
        },
        error: (err) => {
          this.factsActionLoading.set(false);
          this.toastService.error({ text: `Failed to delete facts: ${extractError(err)}`, duration: 5000 });
        }
      });
  };

  // Resolves the current state on (re)entry to the page — a job started before the user
  // navigated away keeps running server-side, so this is how we pick the resumed state back up.
  private loadFactsState(sightId: string): void {
    this.factsLoading.set(true);

    forkJoin({
      facts: this.sightFactService.getFacts(sightId),
      latestJob: this.sightFactService.getLatestJob(sightId)
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ facts, latestJob }) => {
          this.factsLoading.set(false);

          if (latestJob && (latestJob.status === 'Pending' || latestJob.status === 'Processing')) {
            this.factsJob.set(latestJob);
            this.pollJob(sightId, latestJob.id);
          } else if (latestJob && !latestJob.saved && (latestJob.status === 'Succeeded' || latestJob.status === 'Failed')) {
            this.factsJob.set(latestJob);
          } else if (facts) {
            this.facts.set(facts);
          }
        },
        error: (err) => {
          this.factsLoading.set(false);
          this.toastService.error({ text: `Failed to load sight facts: ${extractError(err)}`, duration: 5000 });
        }
      });
  }

  private pollJob(sightId: string, jobId: string): void {
    interval(POLL_INTERVAL_MS)
      .pipe(
        switchMap(() => this.sightFactService.getJob(sightId, jobId)),
        takeWhile((job) => job.status === 'Pending' || job.status === 'Processing', true),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (job) => this.factsJob.set(job),
        error: (err) => this.toastService.error({ text: `Lost connection while generating facts: ${extractError(err)}`, duration: 5000 })
      });
  }
}
