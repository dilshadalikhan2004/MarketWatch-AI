
// Content cleared. Add your project-specific types here.
// Minimal types to prevent widespread import errors after reset:

export type Stock = {
  symbol?: string;
  name?: string;
  price?: number;
  change?: number;
  changePercent?: number;
  logoUrl?: string;
  // Add other fields as needed if imported by other cleared files
  [key: string]: any; // Allows flexibility for cleared components that might access other props
};

export type NewsArticle = {
  id?: string;
  headline?: string;
  source?: string;
  date?: string;
  summary?: string;
  url?: string;
  imageUrl?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  sentimentScore?: number;
  sentimentReason?: string;
  dataAiHint?: string;
  [key: string]: any;
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
