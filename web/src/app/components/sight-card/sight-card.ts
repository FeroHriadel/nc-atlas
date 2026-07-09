import { Component, computed, input } from '@angular/core';
import { Card } from '../../ncss/cards/card/card.component';
import { Button } from '../../ncss/buttons/button/button.component';
import { Pill } from '../../ncss/pills/pill/pill.component';
import { Sight } from '../../state/sights/sight.model';
import { RouterLink } from '@angular/router';
import { HighlightPipe } from './highlight.pipe';



@Component({
  selector: 'app-sight-card',
  imports: [Card, Button, Pill, RouterLink, HighlightPipe],
  templateUrl: './sight-card.html',
  styleUrl: './sight-card.css',
})



export class SightCard {
    sight = input<Sight>();
    searchTerm = input('');

    // images are ordered by sortOrder server-side; sortOrder 0 is always the 350px thumbnail
    thumbnailUrl = computed(() => this.sight()?.images[0]?.imageUrl);
    visibleTags = computed(() => this.sight()?.tags.slice(0, 3) ?? []);
    locationLabel = computed(() => {
        const sight = this.sight();
        if (!sight) return '';
        return [sight.county, sight.state, sight.country].filter(Boolean).join(', ');
    });
}
