import { CurrencyPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Gift } from '../../domain/models/gift.model';

@Component({
  selector: 'app-gift-list',
  imports: [CurrencyPipe],
  templateUrl: './gift-list.component.html',
  styleUrl: './gift-list.component.scss'
})
export class GiftListComponent {
  @Input({ required: true }) gifts: Gift[] = [];
  @Output() giftSelected = new EventEmitter<Gift>();

  protected giftProgress(gift: Gift): number {
    if (gift.isPurchased) {
      return 100;
    }

    if (typeof gift.confirmedAmount === 'number' && gift.price > 0) {
      return Math.min(100, Math.max(0, (gift.confirmedAmount / gift.price) * 100));
    }

    return Math.min(100, Math.max(0, gift.reservedPercent));
  }

  protected confirmedAmount(gift: Gift): number {
    if (typeof gift.confirmedAmount === 'number') {
      return Math.min(gift.price, Math.max(0, gift.confirmedAmount));
    }

    return (gift.price * this.giftProgress(gift)) / 100;
  }

  protected selectGift(gift: Gift): void {
    if (gift.isPurchased) {
      return;
    }

    this.giftSelected.emit(gift);
  }
}
