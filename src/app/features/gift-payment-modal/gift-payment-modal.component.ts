import { CurrencyPipe, NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  GiftContributionApiService,
  GiftContributionResponse
} from '../../application/api/gift-contribution-api.service';
import { buildPixQrCodeUrl } from '../../application/use-cases/build-pix-qr-code';
import { calculateGiftPayment, calculateQuotaValue } from '../../application/use-cases/calculate-gift-payment';
import { Gift } from '../../domain/models/gift.model';
import { GiftPurchaseMode, PaymentStatus } from '../../domain/models/payment.model';

@Component({
  selector: 'app-gift-payment-modal',
  imports: [CurrencyPipe, FormsModule, NgClass],
  templateUrl: './gift-payment-modal.component.html',
  styleUrl: './gift-payment-modal.component.scss'
})
export class GiftPaymentModalComponent {
  @Input({ required: true }) gift!: Gift;
  @Input({ required: true }) pixKey = '';
  @Output() closed = new EventEmitter<void>();

  protected readonly selectedMode = signal<GiftPurchaseMode>('full');
  protected readonly quotaQuantity = signal(1);
  protected readonly copiedPix = signal(false);
  protected readonly paymentStatus = signal<PaymentStatus>('idle');
  protected readonly isCreatingPayment = signal(false);
  protected readonly isConfirmingPayment = signal(false);
  protected readonly paymentError = signal('');
  protected readonly contribution = signal<GiftContributionResponse | null>(null);
  protected readonly contributor = {
    name: '',
    phone: ''
  };

  constructor(private readonly contributionApiService: GiftContributionApiService) {}

  protected get quotaValue(): number {
    return calculateQuotaValue(this.gift);
  }

  protected get paymentAmount(): number {
    return calculateGiftPayment(this.gift, this.selectedMode(), this.quotaQuantity());
  }

  protected get qrCodeUrl(): string {
    return this.contribution()?.qrCodeUrl ?? buildPixQrCodeUrl(this.gift, this.paymentAmount);
  }

  protected get currentPixKey(): string {
    return this.contribution()?.pixKey ?? this.pixKey;
  }

  protected setMode(mode: GiftPurchaseMode): void {
    this.selectedMode.set(mode);
    this.paymentStatus.set('idle');
    this.contribution.set(null);
  }

  protected updateQuotaQuantity(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.quotaQuantity.set(Number(input.value));
  }

  protected async copyPixKey(): Promise<void> {
    await navigator.clipboard.writeText(this.currentPixKey);
    this.copiedPix.set(true);
  }

  protected startPayment(): void {
    if (!this.contributor.name.trim() || !this.contributor.phone.trim()) {
      this.paymentError.set('Informe seu nome e celular para gerar o Pix.');
      return;
    }

    this.isCreatingPayment.set(true);
    this.paymentError.set('');

    this.contributionApiService
      .create(
        this.gift.id,
        this.contributor.name,
        this.contributor.phone,
        this.selectedMode(),
        this.quotaQuantity()
      )
      .pipe(finalize(() => this.isCreatingPayment.set(false)))
      .subscribe({
        next: (response) => {
          this.contribution.set(response);
          this.paymentStatus.set('waiting');
        },
        error: () => {
          this.paymentError.set('Nao foi possivel gerar o Pix. Confira se o backend e o banco estao rodando.');
        }
      });
  }

  protected confirmPayment(success: boolean): void {
    const contributionId = this.contribution()?.id;
    if (!contributionId) {
      return;
    }

    this.isConfirmingPayment.set(true);
    this.paymentError.set('');

    this.contributionApiService
      .simulatePayment(contributionId, success)
      .pipe(finalize(() => this.isConfirmingPayment.set(false)))
      .subscribe({
        next: (response) => {
          this.paymentStatus.set(response.paymentStatus === 'Paid' ? 'confirmed' : 'failed');
        },
        error: () => {
          this.paymentError.set('Nao foi possivel consultar a confirmacao do pagamento.');
        }
      });
  }
}
