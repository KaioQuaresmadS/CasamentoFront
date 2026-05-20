import { CurrencyPipe, NgClass } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, Subscription, switchMap, takeWhile, timer } from 'rxjs';
import {
  CreateMercadoPagoPaymentResponse,
  GiftContributionApiService,
  MercadoPagoPaymentMethod,
  MercadoPagoPaymentStatusResponse
} from '../../application/api/gift-contribution-api.service';
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
  @Input() pixKey = '';
  @Output() closed = new EventEmitter<void>();

  readonly selectedMode = signal<GiftPurchaseMode>('full');
  readonly quotaQuantity = signal(1);
  readonly paymentStatus = signal<PaymentStatus>('idle');
  readonly isCreatingPayment = signal(false);
  readonly isConfirmingPayment = signal(false);
  readonly paymentError = signal('');
  readonly paymentValidationMessage = signal('');
  readonly selectedPaymentMethod = signal<PaymentMethod | null>(null);
  readonly payment = signal<CreateMercadoPagoPaymentResponse | null>(null);
  readonly contributor = {
    name: '',
    email: '',
    phone: ''
  };

  private paymentStatusSubscription?: Subscription;

  constructor(private readonly contributionApiService: GiftContributionApiService) {}

  get quotaValue(): number {
    return calculateQuotaValue(this.gift);
  }

  get paymentAmount(): number {
    return calculateGiftPayment(this.gift, this.selectedMode(), this.quotaQuantity());
  }

  setMode(mode: GiftPurchaseMode): void {
    this.selectedMode.set(mode);
    this.resetPayment();
  }

  updateQuotaQuantity(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.quotaQuantity.set(Number(input.value));
  }

  choosePaymentMethod(method: PaymentMethod): void {
    this.selectedPaymentMethod.set(method);
    this.paymentError.set('');
    this.paymentValidationMessage.set('O pagamento sera finalizado no ambiente seguro do Mercado Pago.');
  }

  startPayment(): void {
    const method = this.selectedPaymentMethod();
    if (!method) {
      this.paymentError.set('Escolha Pix, cartao de credito ou boleto.');
      return;
    }

    if (!this.contributor.name.trim() || !this.contributor.email.trim()) {
      this.paymentError.set('Informe seu nome e email para iniciar o pagamento.');
      return;
    }

    this.stopPaymentStatusPolling();
    this.isCreatingPayment.set(true);
    this.paymentError.set('');
    this.paymentValidationMessage.set('Criando checkout Mercado Pago...');

    this.contributionApiService
      .createMercadoPagoPayment(
        this.gift.id,
        this.contributor.name,
        this.contributor.email,
        this.contributor.phone,
        this.toApiPaymentMethod(method),
        this.selectedMode(),
        this.quotaQuantity()
      )
      .pipe(finalize(() => this.isCreatingPayment.set(false)))
      .subscribe({
        next: (response) => {
          this.payment.set(response);
          this.paymentStatus.set('waiting');
          this.paymentValidationMessage.set('Aguardando confirmacao do pagamento pelo Mercado Pago.');
          this.openCheckout(response);
          this.startPaymentStatusPolling(response.id);
        },
        error: () => {
          this.paymentStatus.set('idle');
          this.paymentValidationMessage.set('');
          this.paymentError.set('Nao foi possivel abrir o pagamento agora. Tente novamente em instantes.');
        }
      });
  }

  verifyPaymentNow(): void {
    const paymentId = this.payment()?.id;
    if (!paymentId) {
      return;
    }

    this.isConfirmingPayment.set(true);
    this.paymentError.set('');

    this.contributionApiService
      .getMercadoPagoPaymentStatus(paymentId)
      .pipe(finalize(() => this.isConfirmingPayment.set(false)))
      .subscribe({
        next: (response) => this.applyPaymentStatus(response),
        error: () => {
          this.paymentError.set('Nao foi possivel consultar a confirmacao do pagamento.');
        }
      });
  }

  close(): void {
    this.stopPaymentStatusPolling();
    this.closed.emit();
  }

  ngOnDestroy(): void {
    this.stopPaymentStatusPolling();
  }

  private openCheckout(response: CreateMercadoPagoPaymentResponse): void {
    const checkoutUrl = response.sandboxInitPoint || response.initPoint;
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
    }
  }

  private startPaymentStatusPolling(paymentId: string): void {
    this.stopPaymentStatusPolling();
    const startedAt = Date.now();
    const maxPollingTimeMs = 10 * 60 * 1000;

    this.paymentStatusSubscription = timer(0, 5000)
      .pipe(
        takeWhile(() => Date.now() - startedAt <= maxPollingTimeMs),
        switchMap(() => this.contributionApiService.getMercadoPagoPaymentStatus(paymentId))
      )
      .subscribe({
        next: (response) => this.applyPaymentStatus(response),
        error: () => {
          this.paymentValidationMessage.set('Ainda nao foi possivel validar. Tentaremos novamente em alguns segundos.');
        },
        complete: () => {
          if (this.paymentStatus() === 'waiting' || this.paymentStatus() === 'processing') {
            this.paymentValidationMessage.set('A confirmacao ainda nao chegou. Voce pode verificar novamente em alguns minutos.');
          }
        }
      });
  }

  private applyPaymentStatus(response: MercadoPagoPaymentStatusResponse | { status?: string; paymentStatus?: string; data?: { status?: string } } | null | undefined): void {
    console.log('Mercado Pago payment status response:', response);

    const rawStatus =
      response?.status ??
      response?.paymentStatus ??
      response?.data?.status ??
      'pending';
    const normalizedStatus = String(rawStatus).toLowerCase();

    if (normalizedStatus === 'approved' || normalizedStatus === 'paid' || normalizedStatus === 'confirmed') {
      this.paymentStatus.set('confirmed');
      this.paymentValidationMessage.set('Pagamento aprovado. Obrigado pelo presente!');
      this.stopPaymentStatusPolling();
      return;
    }

    if (normalizedStatus === 'processing' || normalizedStatus === 'pending' || normalizedStatus === 'in_process') {
      this.paymentStatus.set(normalizedStatus === 'processing' ? 'processing' : 'waiting');
      this.paymentValidationMessage.set('Aguardando confirmacao do pagamento pelo Mercado Pago.');
      return;
    }

    if (normalizedStatus === 'cancelled' || normalizedStatus === 'canceled') {
      this.paymentStatus.set('cancelled');
      this.paymentValidationMessage.set('Pagamento cancelado.');
      this.stopPaymentStatusPolling();
      return;
    }

    if (normalizedStatus === 'expired') {
      this.paymentStatus.set('expired');
      this.paymentValidationMessage.set('Pagamento expirado.');
      this.stopPaymentStatusPolling();
      return;
    }

    if (normalizedStatus === 'refunded' || normalizedStatus === 'charged_back' || normalizedStatus === 'chargedback') {
      this.paymentStatus.set('refunded');
      this.paymentValidationMessage.set('Pagamento estornado ou contestado.');
      this.stopPaymentStatusPolling();
      return;
    }

    if (normalizedStatus === 'failed' || normalizedStatus === 'rejected') {
      this.paymentStatus.set('failed');
      this.paymentValidationMessage.set('Pagamento recusado.');
      this.stopPaymentStatusPolling();
      return;
    }

    this.paymentStatus.set('waiting');
    this.paymentValidationMessage.set('Aguardando confirmacao do pagamento pelo Mercado Pago.');
  }

  private resetPayment(): void {
    this.stopPaymentStatusPolling();
    this.paymentStatus.set('idle');
    this.paymentValidationMessage.set('');
    this.payment.set(null);
    this.selectedPaymentMethod.set(null);
    this.paymentError.set('');
  }

  private stopPaymentStatusPolling(): void {
    this.paymentStatusSubscription?.unsubscribe();
    this.paymentStatusSubscription = undefined;
  }

  private toApiPaymentMethod(method: PaymentMethod): MercadoPagoPaymentMethod {
    return method === 'credit-card' ? 'credit_card' : method;
  }
}
