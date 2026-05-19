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
  pixKey: string;
  qrCodePayload: string;
  qrCodeUrl: string;
  createdAt: string;
  paidAt: string | null;
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

  simulatePayment(contributionId: string, success: boolean): Observable<{ paymentStatus: string }> {
    const action = success ? 'simulate-success' : 'simulate-failure';
    return this.http.post<{ paymentStatus: string }>(`${API_BASE_URL}/payments/${contributionId}/${action}`, {});
  }
}
