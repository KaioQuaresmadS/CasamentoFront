import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Gift } from '../../domain/models/gift.model';
import { API_BASE_URL } from './api.config';

interface GiftResponse {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  reservedPercent: number;
}

@Injectable({ providedIn: 'root' })
export class GiftApiService {
  constructor(private readonly http: HttpClient) {}

  listActive(): Observable<Gift[]> {
    return this.http.get<GiftResponse[]>(`${API_BASE_URL}/gifts`).pipe(
      map((gifts) =>
        gifts.map((gift) => ({
          id: gift.id,
          name: gift.name,
          description: gift.description,
          image: gift.imageUrl,
          price: gift.price,
          reservedPercent: gift.reservedPercent
        }))
      )
    );
  }
}
