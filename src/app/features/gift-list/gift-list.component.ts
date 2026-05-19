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
}
