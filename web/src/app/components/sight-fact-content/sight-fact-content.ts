import { Component, input } from '@angular/core';
import { SightFactContent } from '../../state/sights/sight-fact.model';
import { ItalicizePipe } from './italicize.pipe';



@Component({
  selector: 'app-sight-fact-content',
  imports: [ItalicizePipe],
  templateUrl: './sight-fact-content.html',
  styleUrl: './sight-fact-content.css',
})



export class SightFactContentComponent {
    content = input.required<SightFactContent>();
}
