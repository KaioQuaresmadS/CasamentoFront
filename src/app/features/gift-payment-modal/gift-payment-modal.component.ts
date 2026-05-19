import { CurrencyPipe, NgClass } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, Subscription, switchMap, timer } from 'rxjs';
import {
  GiftContributionApiService,
  GiftContributionResponse
} from '../../application/api/gift-contribution-api.service';
import { buildPixQrCodeUrl } from '../../application/use-cases/build-pix-qr-code';
import { calculateGiftPayment, calculateQuotaValue } from '../../application/use-cases/calculate-gift-payment';
import { Gift } from '../../domain/models/gift.model';
import { GiftPurchaseMode, PaymentStatus } from '../../domain/models/payment.model';

type PaymentMethod = 'pix' | 'credit-card' | 'boleto';

@Component({
  selector: 'app-gift-payment-modal',
  imports: [CurrencyPipe, FormsModule, NgClass],
  templateUrl: './gift-payment-modal.component.html',
  styleUrl: './gift-payment-modal.component.scss'
})
export class GiftPaymentModalComponent implements OnDestroy {
  @Input({ required: true }) gift!: Gift;
  @Input({ required: true }) pixKey = '';
  @Output() closed = new EventEmitter<void>();

  readonly selectedMode = signal<GiftPurchaseMode>('full');
  readonly quotaQuantity = signal(1);
  readonly copiedPix = signal(false);
  readonly paymentStatus = signal<PaymentStatus>('idle');
  readonly isCreatingPayment = signal(false);
  readonly isConfirmingPayment = signal(false);
  readonly paymentError = signal('');
  readonly paymentValidationMessage = signal('');
  readonly selectedPaymentMethod = signal<PaymentMethod | null>(null);
  readonly contribution = signal<GiftContributionResponse | null>(null);
  private paymentStatusSubscription?: Subscription;
  readonly contributor = {
    name: '',
    phone: ''
  };

  constructor(private readonly contributionApiService: GiftContributionApiService) {}

  get quotaValue(): number {
    return calculateQuotaValue(this.gift);
  }

  get paymentAmount(): number {
    return calculateGiftPayment(this.gift, this.selectedMode(), this.quotaQuantity());
  }

  get qrCodeUrl(): string {
    return this.contribution()?.qrCodeUrl ?? buildPixQrCodeUrl(this.gift, this.paymentAmount);
  }

  get currentPixCopyPaste(): string {
    return this.contribution()?.qrCodePayload ?? this.pixKey;
  }

  setMode(mode: GiftPurchaseMode): void {
    this.selectedMode.set(mode);
    this.resetPayment();
  }

  updateQuotaQuantity(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.quotaQuantity.set(Number(input.value));
  }

  async copyPixKey(): Promise<void> {
    await navigator.clipboard.writeText(this.currentPixCopyPaste);
    this.copiedPix.set(true);
  }

  choosePaymentMethod(method: PaymentMethod): void {
    this.selectedPaymentMethod.set(method);
    this.paymentError.set('');

    if (method !== 'pix') {
      this.stopPaymentStatusPolling();
      this.contribution.set(null);
      this.paymentStatus.set('idle');
      this.paymentValidationMessage.set(
        'Esta forma de pagamento precisa ser conectada ao Checkout/API do Mercado Pago antes de liberar para convidados.'
      );
    }
  }

  startPayment(): void {
    if (this.selectedPaymentMethod() !== 'pix') {
      this.paymentError.set('Selecione PIX para gerar o pagamento agora.');
      return;
    }

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
          this.paymentValidationMessage.set('Aguardando confirmacao do Mercado Pago...');
          this.startPaymentStatusPolling(response.id);
        },
        error: () => {
          this.paymentError.set('Nao foi possivel gerar o Pix. Confira se o backend e o banco estao rodando.');
        }
      });
  }

  verifyPaymentNow(): void {
    const contributionId = this.contribution()?.id;
    if (!contributionId) {
      return;
    }

    this.isConfirmingPayment.set(true);
    this.paymentError.set('');

    this.contributionApiService
      .getStatus(contributionId)
      .pipe(finalize(() => this.isConfirmingPayment.set(false)))
      .subscribe({
        next: (response) => {
          this.applyPaymentStatus(response.paymentStatus);
        },
        error: () => {
          this.paymentError.set('Nao foi possivel consultar a confirmacao do pagamento.');
        }
      });
  }

  ngOnDestroy(): void {
    this.stopPaymentStatusPolling();
  }

  private startPaymentStatusPolling(contributionId: string): void {
    this.stopPaymentStatusPolling();
    this.paymentStatusSubscription = timer(0, 5000)
      .pipe(switchMap(() => this.contributionApiService.getStatus(contributionId)))
      .subscribe({
        next: (response) => this.applyPaymentStatus(response.paymentStatus),
        error: () => {
          this.paymentValidationMessage.set('Ainda nao foi possivel validar. Tentaremos novamente em alguns segundos.');
        }
      });
  }

  private applyPaymentStatus(status: string): void {
    if (status === 'Paid') {
      this.paymentStatus.set('confirmed');
      this.paymentValidationMessage.set('Pagamento confirmado!');
      this.stopPaymentStatusPolling();
      return;
    }

    if (status === 'Failed') {
      this.paymentStatus.set('failed');
      this.paymentValidationMessage.set('Pagamento recusado ou expirado.');
      this.stopPaymentStatusPolling();
      return;
    }

    this.paymentStatus.set('waiting');
    this.paymentValidationMessage.set('Aguardando confirmacao do Mercado Pago...');
  }

  private resetPayment(): void {
    this.stopPaymentStatusPolling();
    this.paymentStatus.set('idle');
    this.paymentValidationMessage.set('');
    this.contribution.set(null);
    this.selectedPaymentMethod.set(null);
    this.copiedPix.set(false);
  }

  private stopPaymentStatusPolling(): void {
    this.paymentStatusSubscription?.unsubscribe();
    this.paymentStatusSubscription = undefined;
  }
}
