export interface Gift {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  confirmedAmount?: number;
  reservedPercent: number;
  isPurchased?: boolean;
  paymentStatus?: string;
}

export interface GiftUpsertRequest {
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  reservedPercent: number;
}
