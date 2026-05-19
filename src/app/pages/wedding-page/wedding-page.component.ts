import { Component, OnInit, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { GiftApiService } from '../../application/api/gift-api.service';
import { GIFTS, WEDDING_INFO } from '../../application/data/wedding-content.data';
import { Gift } from '../../domain/models/gift.model';
import { EventInfoComponent } from '../../features/event-info/event-info.component';
import { GiftListComponent } from '../../features/gift-list/gift-list.component';
import { GiftPaymentModalComponent } from '../../features/gift-payment-modal/gift-payment-modal.component';
import { HeroComponent } from '../../features/hero/hero.component';
import { RsvpFormComponent } from '../../features/rsvp-form/rsvp-form.component';

@Component({
  selector: 'app-wedding-page',
  imports: [
    EventInfoComponent,
    GiftListComponent,
    GiftPaymentModalComponent,
    HeroComponent,
    RsvpFormComponent
  ],
  templateUrl: './wedding-page.component.html',
  styleUrl: './wedding-page.component.scss'
})
export class WeddingPageComponent implements OnInit {
  protected readonly gifts = signal<Gift[]>(GIFTS);
  protected readonly weddingInfo = WEDDING_INFO;
  protected readonly selectedGift = signal<Gift | null>(null);
  protected readonly giftsFromFallback = signal(false);

  constructor(private readonly giftApiService: GiftApiService) {}

  ngOnInit(): void {
    this.giftApiService
      .listActive()
      .pipe(
        catchError(() => {
          this.giftsFromFallback.set(true);
          return of(GIFTS);
        })
      )
      .subscribe((gifts) => this.gifts.set(gifts));
  }

  protected chooseGift(gift: Gift): void {
    this.selectedGift.set(gift);
  }

  protected closeGift(): void {
    this.selectedGift.set(null);
  }
}
