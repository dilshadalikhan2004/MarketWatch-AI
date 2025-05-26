
export type Stock = {
  symbol: string;
  name: string;
  price: number; // Last known price
  change: number; // Change from previous close or open
  changePercent: number; // Percentage change
  marketCap?: string;
  volume?: string; // Current day's volume
  avgVolume?: string;
  peRatio?: number | string;
  high52Week?: number;
  low52Week?: number;
  logoUrl?: string;
  dataAiHint?: string; // For placeholder images
  chartData?: { month: string; price: number }[]; // Historical chart data
  previousClose?: number;
};

export type NewsArticle = {
  id: string; // Or use source.id + publishedAt if API provides
  source?: { id?: string | null; name: string };
  author?: string | null;
  title: string;
  description?: string | null;
  url: string; // URL to the original article
  urlToImage?: string | null; // URL of an image for the article
  publishedAt: string; // ISO string
  content?: string | null; // Full content or snippet
  sentiment?: 'positive' | 'negative' | 'neutral'; // Optional, if we analyze it
  sentimentScore?: number;
  sentimentReason?: string;
  dataAiHint?: string; // For placeholder images for urlToImage
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
export interface PortfolioPosition {
  symbol: string;
  shares: number;
  avgPurchasePrice: number;
  name?: string; // Added from mockStocks or context
  logoUrl?: string; // Added from mockStocks or context
  dataAiHint?: string; // Added from mockStocks or context
  // Calculated fields
  currentPrice: number;
  marketValue: number;
  initialCost: number;
  gainLoss: number;
  gainLossPercent: number;
}


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

// Represents the structure of data you might store per stock
export interface RealtimeStockData extends Partial<Stock> {
  dailyVolume?: number;
  timestamp?: number;
}
