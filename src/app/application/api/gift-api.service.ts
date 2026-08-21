import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Gift, GiftUpsertRequest } from '../../domain/models/gift.model';
import { API_BASE_URL } from './api.config';

interface GiftResponse {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  reservedPercent: number;
  confirmedAmount?: number;
  paidAmount?: number;
  receivedAmount?: number;
  contributedAmount?: number;
  totalPaid?: number;
  totalContributed?: number;
  isPurchased?: boolean;
  purchased?: boolean;
  paymentStatus?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class GiftApiService {
  constructor(private readonly http: HttpClient) {}

  listActive(): Observable<Gift[]> {
    return this.http.get<GiftResponse[]>(`${API_BASE_URL}/gifts`, {
      params: { _: Date.now().toString() }
    }).pipe(
      map((gifts) => gifts.map((gift) => this.mapGift(gift)))
    );
  }

  getById(id: string): Observable<Gift> {
    return this.http.get<GiftResponse>(`${API_BASE_URL}/gifts/${id}`).pipe(map((gift) => this.mapGift(gift)));
  }

  create(request: GiftUpsertRequest): Observable<Gift> {
    return this.http.post<GiftResponse>(`${API_BASE_URL}/gifts`, request).pipe(map((gift) => this.mapGift(gift)));
  }

  update(id: string, request: GiftUpsertRequest): Observable<Gift> {
    return this.http.put<GiftResponse>(`${API_BASE_URL}/gifts/${id}`, request).pipe(map((gift) => this.mapGift(gift)));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/gifts/${id}`);
  }

  toRequest(gift: Gift): GiftUpsertRequest {
    return {
      name: gift.name,
      description: gift.description,
      imageUrl: gift.image,
      price: gift.price,
      reservedPercent: gift.reservedPercent
    };
  }

  private mapGift(gift: GiftResponse): Gift {
    const confirmedAmount = this.getConfirmedAmount(gift);
    const reservedPercent = this.getReservedPercent(gift, confirmedAmount);

    return {
      id: gift.id,
      name: gift.name,
      description: gift.description,
      image: gift.imageUrl,
      price: gift.price,
      confirmedAmount,
      reservedPercent,
      isPurchased: this.isGiftPurchased(gift, confirmedAmount, reservedPercent),
      paymentStatus: gift.paymentStatus ?? gift.status
    };
  }

  private getConfirmedAmount(gift: GiftResponse): number | undefined {
    const reportedAmount =
      gift.confirmedAmount ??
      gift.paidAmount ??
      gift.receivedAmount ??
      gift.contributedAmount ??
      gift.totalPaid ??
      gift.totalContributed;

    const validReportedAmount = this.toNonNegativeNumber(reportedAmount);
    const reservedAmount = this.getReservedAmount(gift);

    if (validReportedAmount === undefined && reservedAmount === undefined) {
      return undefined;
    }

    const amount = Math.max(validReportedAmount ?? 0, reservedAmount ?? 0);
    return gift.price > 0 ? Math.min(gift.price, amount) : amount;
  }

  private getReservedPercent(gift: GiftResponse, confirmedAmount: number | undefined): number {
    const reservedPercent = this.toNonNegativeNumber(gift.reservedPercent) ?? 0;
    const confirmedPercent =
      gift.price > 0 && typeof confirmedAmount === 'number' ? (confirmedAmount / gift.price) * 100 : 0;

    return Math.min(100, Math.max(reservedPercent, confirmedPercent));
  }

  private getReservedAmount(gift: GiftResponse): number | undefined {
    if (gift.price <= 0) {
      return undefined;
    }

    const reservedPercent = this.toNonNegativeNumber(gift.reservedPercent);
    if (reservedPercent === undefined) {
      return undefined;
    }

    return gift.price * Math.min(100, reservedPercent) / 100;
  }

  private toNonNegativeNumber(value: unknown): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
  }

  private isGiftPurchased(gift: GiftResponse, confirmedAmount: number | undefined, reservedPercent: number): boolean {
    if (gift.isPurchased ?? gift.purchased) {
      return true;
    }

    if (gift.price > 0 && typeof confirmedAmount === 'number' && confirmedAmount >= gift.price) {
      return true;
    }

    if (reservedPercent >= 100) {
      return true;
    }

    const status = String(gift.paymentStatus ?? gift.status ?? '').toLowerCase();
    return ['approved', 'paid', 'confirmed', 'completed', 'purchased'].includes(status);
  }
}
