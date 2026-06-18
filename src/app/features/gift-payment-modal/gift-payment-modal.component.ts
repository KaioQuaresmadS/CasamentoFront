import { CurrencyPipe, NgClass } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  CreateMercadoPagoPaymentResponse,
  GiftContributionApiService,
  MercadoPagoPaymentMethod
} from '../../application/api/gift-contribution-api.service';
import { calculateGiftPayment, calculateQuotaValue } from '../../application/use-cases/calculate-gift-payment';
import { Gift } from '../../domain/models/gift.model';
import { GiftPurchaseMode } from '../../domain/models/payment.model';

type PaymentResponse = CreateMercadoPagoPaymentResponse;
type CheckoutPaymentMethod = Exclude<MercadoPagoPaymentMethod, 'mercado_pago'>;

@Component({
  selector: 'app-gift-payment-modal',
  imports: [CurrencyPipe, FormsModule, NgClass],
  templateUrl: './gift-payment-modal.component.html',
  styleUrl: './gift-payment-modal.component.scss'
})
export class GiftPaymentModalComponent {
  @Input({ required: true }) gift!: Gift;
  @Output() closed = new EventEmitter<void>();

  readonly selectedMode = signal<GiftPurchaseMode>('full');
  readonly quotaQuantity = signal(1);
  readonly selectedPaymentMethod = signal<CheckoutPaymentMethod>('pix');
  readonly isCreatingPayment = signal(false);
  readonly paymentError = signal('');
  readonly paymentValidationMessage = signal('');
  readonly payment = signal<CreateMercadoPagoPaymentResponse | null>(null);
  readonly contributor = {
    name: '',
    email: '',
    phone: ''
  };

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

  setPaymentMethod(method: CheckoutPaymentMethod): void {
    this.selectedPaymentMethod.set(method);
    this.resetPayment();
  }

  startPayment(): void {
    if (!this.contributor.name.trim() || !this.contributor.email.trim() || !this.contributor.phone.trim()) {
      this.paymentError.set('Informe seu nome, email e celular para iniciar o pagamento.');
      return;
    }

    this.isCreatingPayment.set(true);
    this.paymentError.set('');
    this.paymentValidationMessage.set('Preparando seu pagamento...');

    const paymentMethod = this.selectedPaymentMethod();
    const paymentRequest =
      paymentMethod === 'pix'
        ? this.contributionApiService.createPixPayment(
            this.gift.id,
            this.contributor.name,
            this.contributor.email,
            this.contributor.phone,
            this.paymentAmount,
            this.selectedMode(),
            this.quotaQuantity()
          )
        : this.contributionApiService.createMercadoPagoPayment(
            this.gift.id,
            this.contributor.name,
            this.contributor.email,
            this.contributor.phone,
            this.paymentAmount,
            paymentMethod,
            this.selectedMode(),
            this.quotaQuantity()
          );

    paymentRequest
      .pipe(finalize(() => this.isCreatingPayment.set(false)))
      .subscribe({
        next: (response) => {
          this.payment.set(response);
          this.persistPaymentReference(response);
          this.persistPendingGiftPayment(response);

          if (paymentMethod !== 'pix') {
            this.openCheckoutPayment(response);
            return;
          }

          const hasPixPaymentData = this.pixQrCodeImage(response) || this.pixCopyPasteCode(response) || this.pixTicketUrl(response);
          if (!hasPixPaymentData) {
            this.paymentValidationMessage.set('');
            this.paymentError.set('O pagamento foi preparado, mas nao recebemos os dados do Pix.');
            return;
          }

          this.paymentValidationMessage.set('Pix gerado pelo Mercado Pago. Use o QR Code, copie o codigo ou abra o link de pagamento.');
        },
        error: (error) => {
          this.paymentValidationMessage.set('');
          this.paymentError.set(this.getPaymentErrorMessage(error));
        }
      });
  }

  close(): void {
    this.closed.emit();
  }

  private resetPayment(): void {
    this.paymentValidationMessage.set('');
    this.payment.set(null);
    this.paymentError.set('');
  }

  pixQrCodeImage(response: PaymentResponse | null = this.payment()): string {
    if (!response) {
      return '';
    }

    const qrCodeBase64 = this.pickString(response, ['qrCodeBase64', 'qr_code_base64']);
    if (!qrCodeBase64) {
      return '';
    }

    return qrCodeBase64.startsWith('data:image') ? qrCodeBase64 : `data:image/png;base64,${qrCodeBase64}`;
  }

  pixCopyPasteCode(response: PaymentResponse | null = this.payment()): string {
    if (!response) {
      return '';
    }

    return this.pickString(response, ['qrCode', 'qr_code', 'pixCopyPaste', 'pix_copy_paste']);
  }

  pixTicketUrl(response: PaymentResponse | null = this.payment()): string {
    if (!response) {
      return '';
    }

    return this.pickString(response, ['ticketUrl', 'ticket_url', 'paymentUrl', 'checkoutUrl']);
  }

  selectedPaymentLabel(): string {
    switch (this.selectedPaymentMethod()) {
      case 'credit_card':
        return 'cartao de credito';
      case 'boleto':
        return 'boleto';
      default:
        return 'Pix';
    }
  }

  copyPixCode(): void {
    const pixCode = this.pixCopyPasteCode();
    if (!pixCode || !navigator.clipboard) {
      return;
    }

    void navigator.clipboard.writeText(pixCode);
  }

  private persistPaymentReference(response: PaymentResponse): void {
    const paymentId = this.pickString(response, ['id', 'payment_id']);
    if (paymentId) {
      localStorage.setItem('paymentId', paymentId);
    }

    const externalReference = this.pickString(response, ['externalReference', 'external_reference']);
    if (externalReference) {
      localStorage.setItem('externalReference', externalReference);
    }
  }

  private persistPendingGiftPayment(response: PaymentResponse): void {
    const paymentId = this.pickString(response, ['id', 'payment_id']);
    localStorage.setItem(
      'pendingGiftPayment',
      JSON.stringify({
        paymentId,
        giftId: this.gift.id,
        mode: this.selectedMode(),
        amount: this.paymentAmount
      })
    );
  }

  private openCheckoutPayment(response: PaymentResponse): void {
    const checkoutUrl = this.pickString(response, [
      'initPoint',
      'init_point',
      'paymentUrl',
      'payment_url',
      'checkoutUrl',
      'ticketUrl',
      'ticket_url',
      'boletoUrl',
      'boleto_url',
      'sandboxInitPoint',
      'sandbox_init_point'
    ]);

    if (!checkoutUrl) {
      this.paymentValidationMessage.set('');
      this.paymentError.set(`O pagamento por ${this.selectedPaymentLabel()} foi preparado, mas nao recebemos o link do Mercado Pago.`);
      return;
    }

    this.paymentValidationMessage.set(`Abrindo pagamento por ${this.selectedPaymentLabel()} no Mercado Pago...`);
    window.location.href = checkoutUrl;
  }

  private pickString(response: object, keys: string[]): string {
    const record = response as Record<string, unknown>;
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }

    return '';
  }

  private getPaymentErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 400) {
      return 'Confira os dados informados e tente novamente.';
    }

    return `Nao foi possivel gerar o pagamento por ${this.selectedPaymentLabel()} agora. Tente novamente em instantes.`;
  }
}
