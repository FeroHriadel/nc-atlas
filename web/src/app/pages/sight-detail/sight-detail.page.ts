import { Component, OnInit, DestroyRef, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Sight } from '../../state/sights/sight.model';
import { SightService } from '../../state/sights/sight.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Pill } from '../../ncss/pills/pill/pill.component';
import { Card } from '../../ncss/cards/card/card.component';
import { GpsIcon, FlagIcon, AreaIcon } from '../../ncss/icons';



@Component({
  selector: 'app-sight-detail',
  templateUrl: './sight-detail.page.html',
  styleUrl: './sight-detail.page.css',
  imports: [Pill, Card, GpsIcon, FlagIcon, AreaIcon]
})



export class SightDetailPage implements OnInit {
  sight = signal<Sight | undefined>(undefined);
  loading = signal(true);
  error = signal('');
  private destroyRef: DestroyRef;

  constructor(
    private route: ActivatedRoute,
    private sightService: SightService,
    destroyRef: DestroyRef
  ) {
    this.destroyRef = destroyRef;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('sightId');
    if (id) {
      this.sightService.getSightById(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
            next: (sight) => {
                this.sight.set(sight);
                this.loading.set(false);
                this.error.set('');
            },
            error: (err) => {
                this.error.set('Failed to load sight details');
                this.loading.set(false);
                this.sight.set(undefined);
            }
      });
    }
  }
}
