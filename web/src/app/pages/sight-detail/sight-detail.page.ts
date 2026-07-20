import { Component, OnInit, DestroyRef, signal, inject, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Sight } from '../../state/sights/sight.model';
import { SightService } from '../../state/sights/sight.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Pill } from '../../ncss/pills/pill/pill.component';
import { Button } from '../../ncss/buttons/button/button.component';
import { SquareButton } from '../../ncss/buttons/square-button/square-button.component';
import { GpsIcon, FlagIcon, AreaIcon, InfoIcon, WarningIcon, EditIcon, DeleteIcon } from '../../ncss/icons';
import { FormsModule } from '@angular/forms';
import { forkJoin, interval, map, switchMap, takeWhile } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { SightFactService } from '../../state/sights/sight-fact.service';
import { SightFactContent, SightFactJob } from '../../state/sights/sight-fact.model';
import { SightFactContentComponent } from '../../components/sight-fact-content/sight-fact-content';
import { ToastService } from '../../ncss/services/toast.service';
import { Card } from '../../ncss/cards/card/card.component';
import { AddToTripButton } from '../../components/add-to-trip-button/add-to-trip-button';
import { Gallery } from '../../components/gallery/gallery';
import { Comments } from '../../components/comments/comments';
import { Modal } from '../../ncss/popups/modal/modal.component';
import { Select } from '../../ncss/inputs/select/select.component';
import { Store } from '@ngrx/store';
import { CategoryActions } from '../../state/categories/category.actions';
import { categoryFeature } from '../../state/categories/category.reducer';
import { TagActions } from '../../state/tags/tag.actions';
import { tagFeature } from '../../state/tags/tag.reducer';



const POLL_INTERVAL_MS = 2000;

const extractError = (err: HttpErrorResponse): string =>
  err.error?.error ?? err.message ?? String(err);

@Component({
  selector: 'app-sight-detail',
  templateUrl: './sight-detail.page.html',
  styleUrl: './sight-detail.page.css',
  imports: [Pill, Button, SquareButton, GpsIcon, FlagIcon, AreaIcon, InfoIcon, WarningIcon, EditIcon, DeleteIcon, FormsModule, SightFactContentComponent, Card, AddToTripButton, Gallery, Comments, Modal, Select]
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

  isSavingSight = signal(false);
  editTitle = '';
  editDescription = '';
  editCategoryId = '';
  editCountry = '';
  editState = '';
  editCounty = '';
  editLatitude = '';
  editLongitude = '';
  editTagIds: string[] = [];

  @ViewChild('editSightModal') editSightModal!: Modal;
  @ViewChild('categorySelect') categorySelect!: Select;
  @ViewChild('tagsSelect') tagsSelect!: Select;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sightService = inject(SightService);
  private sightFactService = inject(SightFactService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  private store = inject(Store);

  isAdmin = this.authService.isAdmin;

  categoryOptions = toSignal(
    this.store.select(categoryFeature.selectCategories).pipe(
      map((categories) => categories.map((c) => ({ value: String(c.id), label: c.name })))
    ),
    { initialValue: [] }
  );

  tagOptions = toSignal(
    this.store.select(tagFeature.selectTags).pipe(
      map((tags) => tags.map((t) => ({ value: t.id, label: t.name })))
    ),
    { initialValue: [] }
  );

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

    if (this.isAdmin()) {
      this.store.dispatch(CategoryActions.load());
      this.store.dispatch(TagActions.load());
    }
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

  onOpenEditModal = (): void => {
    const s = this.sight();
    if (!s) return;

    this.editTitle = s.title;
    this.editDescription = s.description;
    this.editCategoryId = String(s.categoryId);
    this.editCountry = s.country ?? '';
    this.editState = s.state ?? '';
    this.editCounty = s.county ?? '';
    this.editLatitude = String(s.latitude);
    this.editLongitude = String(s.longitude);
    this.editTagIds = s.tags.map((t) => t.id);

    // nc-select only reads [defaultValue] once on init, so re-syncing on every
    // reopen has to go through its imperative setValue instead.
    this.categorySelect.setValue(this.editCategoryId);
    this.tagsSelect.setValue(this.editTagIds);

    this.editSightModal.openModal();
  };

  onCategorySelectChange = (value: string | string[]): void => {
    this.editCategoryId = value as string;
  };

  onTagsSelectChange = (value: string | string[]): void => {
    this.editTagIds = value as string[];
  };

  onSaveSight = (): void => {
    const s = this.sight();
    if (!s || this.isSavingSight()) return;

    const title = this.editTitle.trim();
    const description = this.editDescription.trim();
    const latitude = Number(this.editLatitude);
    const longitude = Number(this.editLongitude);

    if (!title || !description || !this.editCategoryId || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      this.toastService.error({ text: 'Please fill in title, description, category and a valid latitude/longitude.', duration: 4000 });
      return;
    }

    this.isSavingSight.set(true);
    this.sightService.updateSight(s.id, {
      title,
      description,
      categoryId: Number(this.editCategoryId),
      latitude,
      longitude,
      country: this.editCountry.trim() || undefined,
      state: this.editState.trim() || undefined,
      county: this.editCounty.trim() || undefined,
      source: s.source,
      tagIds: this.editTagIds,
      imageUrls: s.images.map((i) => i.imageUrl),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.isSavingSight.set(false);
          this.sight.set(updated);
          this.toastService.toast({ text: 'Sight updated' });
        },
        error: (err) => {
          this.isSavingSight.set(false);
          this.toastService.error({ text: `Failed to update sight: ${extractError(err)}`, duration: 5000 });
        }
      });
  };

  onDeleteSight = (): void => {
    const s = this.sight();
    if (!s) return;
    if (!confirm(`Delete "${s.title}" permanently? This also deletes its Sight Facts.`)) return;

    this.sightService.deleteSight(s.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.toast({ text: 'Sight deleted' });
          this.router.navigate(['/sights']);
        },
        error: (err) => this.toastService.error({ text: `Failed to delete sight: ${extractError(err)}`, duration: 5000 })
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
