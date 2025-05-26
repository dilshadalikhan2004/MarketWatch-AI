
export type Stock = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap?: string;
  volume?: string;
  avgVolume?: string;
  peRatio?: number | string;
  high52Week?: number;
  low52Week?: number;
  logoUrl?: string;
  dataAiHint?: string; // For placeholder images
  chartData?: { month: string; price: number }[];
};

export type NewsArticle = {
  id: string;
  headline: string;
  source: string;
  date: string; // ISO string or formatted date string
  summary: string;
  url: string;
  imageUrl?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  sentimentScore?: number;
  sentimentReason?: string;
  dataAiHint?: string; // For placeholder images
};

export type Alert = {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below' | 'percent_change_up' | 'percent_change_down';
  value?: number; // For percentage change alerts
  notes?: string;
  createdAt: string; // ISO string
  triggered?: boolean;
  lastNotifiedPrice?: number;
};

export type WatchlistItem = {
  symbol: string;
  addedAt: string; // ISO string
  notes?: string;
};

// For the sample portfolio snapshot on the dashboard
export type PortfolioPosition = {
  symbol: string;
  shares: number;
  avgPurchasePrice: number;
  currentPrice?: number; // To be fetched
};

// For the user-configurable simulated portfolio
export type UserPortfolioPosition = {
  id: string; // Unique ID for each position
  symbol: string;
  shares: number;
  avgPurchasePrice: number;
  addedAt: string; // ISO string
};


export type MarketMover = Stock & {
  type: 'gainer' | 'loser' | 'active';
};

export type SentimentDataPoint = {
  name: string; // e.g., 'Positive', 'Negative', 'Neutral'
  value: number; // e.g., count or percentage
  fill: string; // color for the chart
};
