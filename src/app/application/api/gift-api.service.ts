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
    return this.http.get<GiftResponse[]>(`${API_BASE_URL}/gifts`).pipe(
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
    return {
      id: gift.id,
      name: gift.name,
      description: gift.description,
      image: gift.imageUrl,
      price: gift.price,
      confirmedAmount: this.getConfirmedAmount(gift),
      reservedPercent: gift.reservedPercent,
      isPurchased: this.isGiftPurchased(gift),
      paymentStatus: gift.paymentStatus ?? gift.status
    };
  }

  private getConfirmedAmount(gift: GiftResponse): number | undefined {
    return (
      gift.confirmedAmount ??
      gift.paidAmount ??
      gift.receivedAmount ??
      gift.contributedAmount ??
      gift.totalPaid ??
      gift.totalContributed
    );
  }

  private isGiftPurchased(gift: GiftResponse): boolean {
    if (gift.isPurchased ?? gift.purchased) {
      return true;
    }

    const status = String(gift.paymentStatus ?? gift.status ?? '').toLowerCase();
    return ['approved', 'paid', 'confirmed', 'completed', 'purchased'].includes(status);
  }
}
