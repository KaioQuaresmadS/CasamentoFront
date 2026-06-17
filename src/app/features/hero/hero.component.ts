import { Component, Input, signal } from '@angular/core';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss'
})
export class HeroComponent {
  @Input({ required: true }) coupleName = '';
  @Input({ required: true }) weddingDate = '';

  protected readonly heroImageLoaded = signal(false);

  protected showHero(): void {
    this.heroImageLoaded.set(true);
  }
}
