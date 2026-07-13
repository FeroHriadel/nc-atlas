import { Component, input, output } from '@angular/core';
import { Card } from '../../ncss/cards/card/card.component';
import { SquareButton } from '../../ncss/buttons/square-button/square-button.component';
import { DeleteIcon } from '../../ncss/icons';
import { GalleryImage } from '../../state/sights/gallery-image.model';



@Component({
  selector: 'app-gallery-card',
  imports: [Card, SquareButton, DeleteIcon],
  templateUrl: './gallery-card.html',
  styleUrl: './gallery-card.css',
})



export class GalleryCard {
  image = input.required<GalleryImage>();
  showDelete = input(false);

  imageClick = output<GalleryImage>();
  deleteClick = output<GalleryImage>();

  onImageClick = (): void => {
    this.imageClick.emit(this.image());
  };

  onDeleteClick = (): void => {
    this.deleteClick.emit(this.image());
  };
}
