import { Component, OnInit, DestroyRef, signal, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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



const POLL_INTERVAL_MS = 2000;

@Component({
  selector: 'app-sight-detail',
  templateUrl: './sight-detail.page.html',
  styleUrl: './sight-detail.page.css',
  imports: [Pill, Button, GpsIcon, FlagIcon, AreaIcon, InfoIcon, WarningIcon, FormsModule, SightFactContentComponent]
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
        error: () => this.factsActionLoading.set(false)
      });
  };

  onStartEdit = (): void => {
    this.feedbackText.set('');
    this.isEditingFacts.set(true);
  };

  onCancelEdit = (): void => {
    this.isEditingFacts.set(false);
  };

  onSubmitEdit = (): void => {
    const sightId = this.sight()?.id;
    const job = this.factsJob();
    const feedback = this.feedbackText().trim();
    if (!sightId || !job || !feedback || this.factsActionLoading()) return;

    this.factsActionLoading.set(true);
    this.sightFactService.createJob(sightId, feedback, job.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (newJob) => {
          this.factsActionLoading.set(false);
          this.isEditingFacts.set(false);
          this.factsJob.set(newJob);
          this.pollJob(sightId, newJob.id);
        },
        error: () => this.factsActionLoading.set(false)
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
        error: () => this.factsActionLoading.set(false)
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
        error: () => this.factsLoading.set(false)
      });
  }

  private pollJob(sightId: string, jobId: string): void {
    interval(POLL_INTERVAL_MS)
      .pipe(
        switchMap(() => this.sightFactService.getJob(sightId, jobId)),
        takeWhile((job) => job.status === 'Pending' || job.status === 'Processing', true),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((job) => this.factsJob.set(job));
  }
}
