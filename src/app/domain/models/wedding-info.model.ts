export interface EventInfoCard {
  label: string;
  title: string;
  description: string;
}

export interface WeddingInfo {
  coupleName: string;
  date: string;
  eventCards: EventInfoCard[];
}
