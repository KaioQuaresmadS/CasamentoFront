import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GiftPurchaseMode } from '../../domain/models/payment.model';
import { API_BASE_URL } from './api.config';

export interface CreateGiftContributionRequest {
  giftId: string;
  contributorName: string;
  contributorPhone: string;
  mode: 'FullGift' | 'Quota';
  quotaQuantity: number;
}

export interface GiftContributionResponse {
  id: string;
  giftId: string;
  giftName: string;
  contributorName: string;
  contributorPhone: string;
  mode: string;
  quotaQuantity: number;
  amount: number;
  paymentStatus: string;
  qrCodePayload: string;
  qrCodeUrl: string;
  createdAt: string;
  paidAt: string | null;
}

export interface PaymentStatusResponse {
  id: string;
  paymentStatus: string;
  paidAt: string | null;
}

export type MercadoPagoPaymentMethod = 'pix' | 'credit_card' | 'boleto' | 'mercado_pago';

export interface CreateMercadoPagoPaymentRequest {
  giftId: string;
  payerName: string;
  payerEmail: string;
  payerPhone: string;
  paymentMethod?: MercadoPagoPaymentMethod | null;
  mode: 'FullGift' | 'Quota';
  quotaQuantity: number;
}

export interface CreateMercadoPagoPaymentResponse {
  id: string;
  giftContributionId: string;
  externalReference?: string;
  external_reference?: string;
  status?: string;
  paymentStatus?: string;
  paymentMethod: MercadoPagoPaymentMethod;
  amount: number;
  preferenceId: string;
  checkoutUrl?: string;
  paymentUrl?: string;
  ticketUrl?: string;
  ticket_url?: string;
  boletoUrl?: string;
  boleto_url?: string;
  initPoint?: string;
  init_point?: string;
  sandboxInitPoint?: string;
  sandbox_init_point?: string;
  qrCode?: string;
  qr_code?: string;
  qrCodeBase64?: string;
  qr_code_base64?: string;
  pixCopyPaste?: string;
  pix_copy_paste?: string;
  barcode?: string;
  line?: string;
  linhaDigitavel?: string;
  linha_digitavel?: string;
  createdAt?: string;
}

export interface MercadoPagoPaymentStatusResponse {
  id: string;
  giftContributionId?: string;
  status?: string;
  paymentStatus?: string;
  mercadoPagoStatus?: string;
  data?: {
    status?: string;
  };
  paidAt?: string | null;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class GiftContributionApiService {
  constructor(private readonly http: HttpClient) {}

  create(
    giftId: string,
    contributorName: string,
    contributorPhone: string,
    mode: GiftPurchaseMode,
    quotaQuantity: number
  ): Observable<GiftContributionResponse> {
    const request: CreateGiftContributionRequest = {
      giftId,
      contributorName,
      contributorPhone,
      mode: mode === 'full' ? 'FullGift' : 'Quota',
      quotaQuantity: mode === 'full' ? 0 : quotaQuantity
    };

    return this.http.post<GiftContributionResponse>(`${API_BASE_URL}/gift-contributions`, request);
  }

  getStatus(contributionId: string): Observable<PaymentStatusResponse> {
    return this.http.get<PaymentStatusResponse>(`${API_BASE_URL}/gift-contributions/${contributionId}/status`);
  }

  createMercadoPagoPayment(
    giftId: string,
    payerName: string,
    payerEmail: string,
    payerPhone: string,
    paymentMethod: MercadoPagoPaymentMethod,
    mode: GiftPurchaseMode,
    quotaQuantity: number
  ): Observable<CreateMercadoPagoPaymentResponse> {
    const request: CreateMercadoPagoPaymentRequest = {
      giftId,
      payerName,
      payerEmail,
      payerPhone,
      paymentMethod,
      mode: mode === 'full' ? 'FullGift' : 'Quota',
      quotaQuantity: mode === 'full' ? 0 : quotaQuantity
    };

    return this.http.post<CreateMercadoPagoPaymentResponse>(`${API_BASE_URL}/payments/create`, request);
  }

  getMercadoPagoPaymentStatus(paymentId: string): Observable<MercadoPagoPaymentStatusResponse> {
    return this.http.get<MercadoPagoPaymentStatusResponse>(`${API_BASE_URL}/payments/${paymentId}/status`);
  }
}
