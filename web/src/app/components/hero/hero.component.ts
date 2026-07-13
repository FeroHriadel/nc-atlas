import { Component } from '@angular/core';
import { Button } from '../../ncss/buttons/button/button.component';
import { ArrowRightIcon } from '../../ncss/icons/arrow-right.icon';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css'],
  imports: [Button, ArrowRightIcon]
})
export class Hero {
    heroImageUrl: string = 'hero.png';
}