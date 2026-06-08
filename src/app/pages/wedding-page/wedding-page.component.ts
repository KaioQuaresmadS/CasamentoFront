import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { GiftApiService } from '../../application/api/gift-api.service';
import { WEDDING_INFO } from '../../application/data/wedding-content.data';
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
    RouterLink,
    RsvpFormComponent
  ],
  templateUrl: './wedding-page.component.html',
  styleUrl: './wedding-page.component.scss'
})
export class WeddingPageComponent implements OnInit {
  private readonly giftCacheKey = 'weddingGiftListCache';
  protected readonly gifts = signal<Gift[]>([]);
  protected readonly isLoadingGifts = signal(true);
  protected readonly weddingInfo = WEDDING_INFO;
  protected readonly selectedGift = signal<Gift | null>(null);

  constructor(private readonly giftApiService: GiftApiService) {}

  ngOnInit(): void {
    this.gifts.set(this.applyConfirmedPayment(this.readCachedGifts()));

    this.giftApiService
      .listActive()
      .pipe(
        catchError(() => {
          return of(this.gifts());
        })
      )
      .subscribe((gifts) => {
        const updatedGifts = this.applyConfirmedPayment(gifts);
        this.gifts.set(updatedGifts);
        this.cacheGifts(updatedGifts);
        this.isLoadingGifts.set(false);
      });
  }

  protected chooseGift(gift: Gift): void {
    this.selectedGift.set(gift);
  }

  protected closeGift(): void {
    this.selectedGift.set(null);
  }

  private applyConfirmedPayment(gifts: Gift[]): Gift[] {
    const confirmedPayment = localStorage.getItem('confirmedGiftPayment');
    if (!confirmedPayment) {
      return gifts;
    }

    try {
      const parsed = JSON.parse(confirmedPayment) as {
        giftId?: string;
        mode?: string;
        amount?: number;
      };

      if (!parsed.giftId) {
        return gifts;
      }

      return gifts.map((gift) => {
        if (gift.id !== parsed.giftId) {
          return gift;
        }

        const confirmedAmount = Math.min(
          gift.price,
          Math.max(gift.confirmedAmount ?? 0, parsed.amount ?? 0)
        );

        return {
          ...gift,
          confirmedAmount,
          reservedPercent: gift.price > 0 ? (confirmedAmount / gift.price) * 100 : gift.reservedPercent,
          isPurchased: gift.isPurchased || parsed.mode === 'full' || confirmedAmount >= gift.price,
          paymentStatus: 'confirmed'
        };
      });
    } catch {
      localStorage.removeItem('confirmedGiftPayment');
      return gifts;
    }
  }

  private readCachedGifts(): Gift[] {
    const cachedGifts = localStorage.getItem(this.giftCacheKey);
    if (!cachedGifts) {
      return [];
    }

    try {
      const parsed = JSON.parse(cachedGifts);
      return Array.isArray(parsed) ? (parsed as Gift[]) : [];
    } catch {
      localStorage.removeItem(this.giftCacheKey);
      return [];
    }
  }

  private cacheGifts(gifts: Gift[]): void {
    if (gifts.length === 0) {
      return;
    }

    localStorage.setItem(this.giftCacheKey, JSON.stringify(gifts));
  }
}
