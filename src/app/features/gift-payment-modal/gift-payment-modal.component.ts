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

type PaymentMethod = 'pix' | 'credit-card' | 'boleto';
type PaymentResponse = CreateMercadoPagoPaymentResponse;

@Component({
  selector: 'app-gift-payment-modal',
  imports: [CurrencyPipe, FormsModule, NgClass],
  templateUrl: './gift-payment-modal.component.html',
  styleUrl: './gift-payment-modal.component.scss'
})
export class GiftPaymentModalComponent {
  @Input({ required: true }) gift!: Gift;
  @Input() pixKey = '';
  @Output() closed = new EventEmitter<void>();

  readonly selectedMode = signal<GiftPurchaseMode>('full');
  readonly quotaQuantity = signal(1);
  readonly isCreatingPayment = signal(false);
  readonly paymentError = signal('');
  readonly paymentValidationMessage = signal('');
  readonly selectedPaymentMethod = signal<PaymentMethod | null>(null);
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

    if (!this.contributor.name.trim() || !this.contributor.email.trim() || !this.contributor.phone.trim()) {
      this.paymentError.set('Informe seu nome, email e celular para iniciar o pagamento.');
      return;
    }

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
          const checkoutUrl = this.extractCheckoutUrl(response);
          if (!checkoutUrl) {
            this.paymentValidationMessage.set('');
            this.paymentError.set('Pagamento criado, mas o backend nao retornou o link do Checkout Pro.');
            return;
          }

          this.persistPaymentReference(response);
          this.paymentValidationMessage.set('Finalize o pagamento no Mercado Pago. Depois voltaremos a verificar automaticamente.');
          window.location.href = checkoutUrl;
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
    this.selectedPaymentMethod.set(null);
    this.paymentError.set('');
  }

  private extractCheckoutUrl(response: PaymentResponse): string {
    return this.pickString(response, [
      'sandboxInitPoint',
      'sandbox_init_point',
      'initPoint',
      'init_point',
      'checkoutUrl'
    ]);
  }

  private persistPaymentReference(response: PaymentResponse): void {
    localStorage.setItem('paymentId', response.id);
    const externalReference = this.pickString(response, ['externalReference', 'external_reference']);
    if (externalReference) {
      localStorage.setItem('externalReference', externalReference);
    }
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
    if (error instanceof HttpErrorResponse) {
      const backendMessage = error.error?.detail || error.error?.message || error.error?.title;
      if (backendMessage) {
        return backendMessage;
      }
    }

    return 'Nao foi possivel abrir o pagamento agora. Tente novamente em instantes.';
  }

  private toApiPaymentMethod(method: PaymentMethod): MercadoPagoPaymentMethod {
    return method === 'credit-card' ? 'credit_card' : method;
  }
}
