import { Component, OnInit, DestroyRef, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, map } from 'rxjs';
import { Card } from '../../ncss/cards/card/card.component';
import { Button } from '../../ncss/buttons/button/button.component';
import { Select } from '../../ncss/inputs/select/select.component';
import { FileUpload } from '../../ncss/inputs/file-upload/file-upload.component';
import { ToastService } from '../../ncss/services/toast.service';
import { CategoryActions } from '../../state/categories/category.actions';
import { categoryFeature } from '../../state/categories/category.reducer';
import { TagActions } from '../../state/tags/tag.actions';
import { tagFeature } from '../../state/tags/tag.reducer';
import { SightService } from '../../state/sights/sight.service';
import { UserService } from '../../state/users/user.service';



const extractError = (err: HttpErrorResponse): string =>
  err.error?.error ?? err.message ?? String(err);

@Component({
  selector: 'app-admin-sight-create',
  templateUrl: './admin-sight-create.page.html',
  styleUrl: './admin-sight-create.page.css',
  imports: [Card, Button, Select, FileUpload, FormsModule],
})



export class AdminSightCreatePage implements OnInit {
  private store = inject(Store);
  private router = inject(Router);
  private sightService = inject(SightService);
  private userService = inject(UserService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  title = '';
  description = '';
  categoryId = '';
  tagIds: string[] = [];
  country = '';
  state = '';
  county = '';
  latitude = '';
  longitude = '';
  source = 'Manual Entry';

  image350File = signal<File | null>(null);
  image1024File = signal<File | null>(null);
  isSubmitting = signal(false);

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
    this.store.dispatch(CategoryActions.load());
    this.store.dispatch(TagActions.load());
  }

  onCategoryChange = (value: string | string[]): void => {
    this.categoryId = value as string;
  };

  onTagsChange = (value: string | string[]): void => {
    this.tagIds = value as string[];
  };

  onImage350Change = (value: File | File[] | null): void => {
    this.image350File.set(Array.isArray(value) ? value[0] ?? null : value);
  };

  onImage1024Change = (value: File | File[] | null): void => {
    this.image1024File.set(Array.isArray(value) ? value[0] ?? null : value);
  };

  onSubmit = async (event: Event): Promise<void> => {
    event.preventDefault();
    if (this.isSubmitting()) return;

    const title = this.title.trim();
    const description = this.description.trim();
    const source = this.source.trim();
    const latitude = Number(this.latitude);
    const longitude = Number(this.longitude);
    const image350 = this.image350File();
    const image1024 = this.image1024File();

    if (!title || !description || !this.categoryId || !source || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      this.toastService.error({ text: 'Please fill in title, description, category, source and a valid latitude/longitude.', duration: 4000 });
      return;
    }
    if (title.length > 200 || source.length > 200) {
      this.toastService.error({ text: 'Title and Source must be 200 characters or fewer.', duration: 4000 });
      return;
    }
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      this.toastService.error({ text: 'Latitude must be between -90 and 90, longitude between -180 and 180.', duration: 4000 });
      return;
    }
    if (!image350 || !image1024) {
      this.toastService.error({ text: 'Both the 350px and 1024px images are required.', duration: 4000 });
      return;
    }

    this.isSubmitting.set(true);

    try {
      const [image350Url, image1024Url] = await Promise.all([
        this.uploadImage(image350),
        this.uploadImage(image1024),
      ]);

      this.sightService.createSight({
        title,
        description,
        categoryId: Number(this.categoryId),
        latitude,
        longitude,
        country: this.country.trim() || undefined,
        state: this.state.trim() || undefined,
        county: this.county.trim() || undefined,
        source,
        tagIds: this.tagIds,
        imageUrls: [image350Url, image1024Url],
      })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (sight) => {
            this.isSubmitting.set(false);
            this.toastService.toast({ text: 'Sight created' });
            this.router.navigate(['/sights', sight.id]);
          },
          error: (err) => {
            this.isSubmitting.set(false);
            this.toastService.error({ text: `Failed to create sight: ${extractError(err)}`, duration: 5000 });
          }
        });
    } catch {
      this.isSubmitting.set(false);
      this.toastService.error({ text: 'Image upload failed', duration: 4000 });
    }
  };

  // Images must be pre-sized by the admin — 350px thumbnail and 1024px full — same
  // convention the bulk zip importer requires (see ImportService.StartImportAsync).
  private async uploadImage(file: File): Promise<string> {
    const { uploadUrl, blobUrl } = await firstValueFrom(this.userService.getUploadUrl(file.name));
    await firstValueFrom(this.userService.uploadToBlob(uploadUrl, file));
    return blobUrl;
  }
}
