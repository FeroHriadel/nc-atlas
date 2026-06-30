import { Component, signal } from '@angular/core';
import { FileUpload } from '../../ncss/inputs/file-upload/file-upload.component';
import { Card } from '../../ncss/cards/card/card.component';
import { Button } from '../../ncss/buttons/button/button.component';
import { SightJson } from '../../types/SightJson';



@Component({
  selector: 'app-admin-sights',
  templateUrl: './admin-sights.page.html',
  styleUrl: './admin-sights.page.css',
  imports: [FileUpload, Card, Button]
})



export class AdminSightsPage {
  sights = signal<SightJson[]>([]);

  onJsonUpload = (value: File | File[] | null) => {
    const file = Array.isArray(value) ? value[0] : value;
    if (!file) {
      this.sights.set([]);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        this.sights.set(Array.isArray(parsed) ? parsed : [parsed]);
      } catch (e) {
        console.error('Invalid JSON file', e);
        this.sights.set([]);
      }
    };
    reader.readAsText(file);
  }
}