import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { GiftApiService } from './gift-api.service';

describe('GiftApiService', () => {
  it('uses a manual reservation when the API reports a zero confirmed amount', async () => {
    const http = {
      get: () =>
        of([
          {
            id: 'gift-1',
            name: 'Batedeira',
            description: 'Descricao',
            imageUrl: 'https://example.com/batedeira.jpg',
            price: 79,
            reservedPercent: 100,
            confirmedAmount: 0,
            isPurchased: false,
            paymentStatus: 'pending'
          }
        ])
    } as unknown as HttpClient;
    const service = new GiftApiService(http);

    const [gift] = await firstValueFrom(service.listActive());

    expect(gift.confirmedAmount).toBe(79);
    expect(gift.reservedPercent).toBe(100);
    expect(gift.isPurchased).toBe(true);
  });

  it('keeps the greatest progress reported by payment or reservation data', async () => {
    const http = {
      get: () =>
        of([
          {
            id: 'gift-2',
            name: 'Liquidificador',
            description: 'Descricao',
            imageUrl: 'https://example.com/liquidificador.jpg',
            price: 200,
            reservedPercent: 25,
            confirmedAmount: 120,
            isPurchased: false,
            paymentStatus: 'pending'
          }
        ])
    } as unknown as HttpClient;
    const service = new GiftApiService(http);

    const [gift] = await firstValueFrom(service.listActive());

    expect(gift.confirmedAmount).toBe(120);
    expect(gift.reservedPercent).toBe(60);
    expect(gift.isPurchased).toBe(false);
  });
});
