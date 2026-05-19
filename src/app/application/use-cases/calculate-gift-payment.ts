import { Gift } from '../../domain/models/gift.model';
import { GiftPurchaseMode } from '../../domain/models/payment.model';

const QUOTA_PERCENTAGE = 0.05;

export function calculateQuotaValue(gift: Gift): number {
  return gift.price * QUOTA_PERCENTAGE;
}

export function calculateGiftPayment(gift: Gift, mode: GiftPurchaseMode, quotaQuantity: number): number {
  return mode === 'full' ? gift.price : calculateQuotaValue(gift) * quotaQuantity;
}
