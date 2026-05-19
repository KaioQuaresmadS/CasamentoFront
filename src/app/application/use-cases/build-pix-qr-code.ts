import { Gift } from '../../domain/models/gift.model';

export function buildPixQrCodeUrl(gift: Gift, amount: number): string {
  const message = `PIX Casamento Ana e Kaio - ${gift.name} - R$ ${amount.toFixed(2)}`;

  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(message)}`;
}
