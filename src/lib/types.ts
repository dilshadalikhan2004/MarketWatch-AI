
export type Stock = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: string;
  previousClose?: number;
  open?: number;
  dayHigh?: number;
  dayLow?: number;
  yearHigh?: number;
  yearLow?: number;
  logoUrl?: string;
};

export type NewsArticle = {
  id: string;
  headline: string;
  source: string;
  date: string; // ISO string or formatted date string
  summary?: string;
  url?: string;
  imageUrl?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  sentimentScore?: number;
  sentimentReason?: string;
};

export type Alert = {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  createdAt: string; // ISO string
  triggered?: boolean;
  lastNotifiedPrice?: number; 
};

export type WatchlistItem = string; // Stock symbol
