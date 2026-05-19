export interface EventInfoCard {
  label: string;
  title: string;
  description: string;
}

export interface WeddingInfo {
  coupleName: string;
  date: string;
  pixKey: string;
  eventCards: EventInfoCard[];
}
