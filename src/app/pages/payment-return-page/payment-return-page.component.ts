import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  GiftContributionApiService,
  MercadoPagoPaymentStatusResponse
} from '../../application/api/gift-contribution-api.service';

type PaymentReturnState = 'success' | 'pending' | 'failure';

interface PaymentReturnContent {
  eyebrow: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-payment-return-page',
  imports: [RouterLink],
  templateUrl: './payment-return-page.component.html',
  styleUrl: './payment-return-page.component.scss'
})
export class PaymentReturnPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly contributionApiService = inject(GiftContributionApiService);

  readonly state = signal<PaymentReturnState>('pending');
  readonly isLoading = signal(false);
  readonly paymentId = signal('');
  readonly externalReference = signal('');
  readonly statusMessage = signal('');
  readonly statusError = signal('');
  readonly content = computed<PaymentReturnContent>(() => {
    switch (this.state()) {
      case 'success':
        return {
          eyebrow: 'Pagamento enviado',
          title: 'Recebemos seu retorno do Mercado Pago',
          description: 'Vamos conferir o status do pagamento e atualizar a confirmacao assim que o Mercado Pago finalizar o processamento.'
        };
      case 'failure':
        return {
          eyebrow: 'Pagamento nao concluido',
          title: 'Nao foi possivel confirmar o pagamento',
          description: 'O Mercado Pago retornou uma falha ou cancelamento. Voce pode voltar para a lista e tentar novamente quando quiser.'
        };
      default:
        return {
          eyebrow: 'Pagamento pendente',
          title: 'Seu pagamento ainda esta em processamento',
          description: 'Alguns meios de pagamento levam mais tempo para confirmar. Continuaremos dependendo da confirmacao final do Mercado Pago.'
        };
    }
  });

  ngOnInit(): void {
    this.state.set((this.route.snapshot.data['result'] as PaymentReturnState | undefined) ?? 'pending');

    const queryParams = this.route.snapshot.queryParamMap;
    const paymentId = queryParams.get('paymentId') ?? queryParams.get('payment_id') ?? localStorage.getItem('paymentId') ?? '';
    const externalReference =
      queryParams.get('externalReference') ??
      queryParams.get('external_reference') ??
      localStorage.getItem('externalReference') ??
      '';

    this.paymentId.set(paymentId);
    this.externalReference.set(externalReference);

    if (!paymentId) {
      this.statusMessage.set('Nao localizamos o identificador do pagamento neste navegador. A confirmacao final ainda sera recebida pelo webhook do Mercado Pago.');
      return;
    }

    this.loadPaymentStatus(paymentId);
  }

  private loadPaymentStatus(paymentId: string): void {
    this.isLoading.set(true);
    this.statusMessage.set('');
    this.statusError.set('');

    this.contributionApiService
      .getMercadoPagoPaymentStatus(paymentId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.persistConfirmedGiftPayment(response);
          this.statusMessage.set(this.buildStatusMessage(response));
        },
        error: () => {
          this.statusError.set('Nao conseguimos consultar o status agora. A confirmacao final ainda vem pelo webhook do Mercado Pago.');
        }
      });
  }

  private buildStatusMessage(response: MercadoPagoPaymentStatusResponse): string {
    const status = this.normalizeStatus(response);

    if (this.isConfirmedStatus(status)) {
      return 'Pagamento confirmado. Obrigado pelo presente!';
    }

    if (status === 'pending' || status === 'processing' || status === 'in_process') {
      return 'Pagamento em processamento. A confirmacao final vem do Mercado Pago e pode levar alguns minutos.';
    }

    if (status === 'rejected' || status === 'failed' || status === 'cancelled' || status === 'canceled' || status === 'expired') {
      return 'Pagamento ainda nao confirmado pelo Mercado Pago. Voce pode voltar para a lista e tentar novamente.';
    }

    return 'Recebemos o retorno do Mercado Pago, mas a confirmacao final ainda esta em processamento.';
  }

  private normalizeStatus(response: MercadoPagoPaymentStatusResponse): string {
    const rawStatus = response.status ?? response.paymentStatus ?? response.mercadoPagoStatus ?? response.data?.status ?? '';
    return String(rawStatus).toLowerCase();
  }

  private persistConfirmedGiftPayment(response: MercadoPagoPaymentStatusResponse): void {
    const status = this.normalizeStatus(response);
    if (!this.isConfirmedStatus(status)) {
      return;
    }

    const pendingPayment = localStorage.getItem('pendingGiftPayment');
    if (!pendingPayment) {
      return;
    }

    try {
      const parsed = JSON.parse(pendingPayment) as {
        paymentId?: string;
        giftId?: string;
        mode?: string;
        amount?: number;
      };

      if (!parsed.giftId || parsed.paymentId !== this.paymentId()) {
        return;
      }

      localStorage.setItem(
        'confirmedGiftPayment',
        JSON.stringify({
          paymentId: parsed.paymentId,
          giftId: parsed.giftId,
          mode: parsed.mode,
          amount: parsed.amount ?? 0,
          confirmedAt: response.paidAt ?? new Date().toISOString()
        })
      );
      localStorage.removeItem('pendingGiftPayment');
    } catch {
      localStorage.removeItem('pendingGiftPayment');
    }
  }

  private isConfirmedStatus(status: string): boolean {
    return ['approved', 'paid', 'confirmed', 'completed'].includes(status);
  }
}
