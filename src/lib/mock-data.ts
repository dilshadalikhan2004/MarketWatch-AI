
import type { Stock, NewsArticle, MarketMover, SentimentDataPoint, PortfolioPosition } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
// The fetchRealTimeStockData (polling version) is no longer the primary update mechanism.
// We keep fetchInitialStockDetails if needed for static data.
// import { fetchInitialStockDetails } from '@/services/stock-api-service'; 

const generateRandomChartData = (): { month: string; price: number }[] => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let lastPrice = Math.random() * 200 + 50; // Start with a random base price
  // Simulate a more realistic historical trend (e.g., general upward trend with volatility)
  const trendFactor = (Math.random() - 0.3) * 5; // Allow for overall positive or slight negative long-term trend
  
  return months.map((month, index) => {
    // Add some volatility and trend influence
    lastPrice += (Math.random() - 0.48) * (lastPrice * 0.1) + (trendFactor * (index / months.length));
    if (lastPrice < 10) lastPrice = 10; // Floor price
    return { month, price: parseFloat(lastPrice.toFixed(2)) };
  });
};


const initialStockDetails = (symbol: string, name: string, basePrice: number, dataAiHint: string) => ({
  symbol,
  name,
  price: basePrice, // Initial price, will be updated by WebSocket
  change: parseFloat(((Math.random() - 0.5) * (basePrice * 0.05)).toFixed(2)), // Initial small random change
  changePercent: parseFloat((((Math.random() - 0.5) * 0.05)).toFixed(4)), // Initial small random change percent
  marketCap: formatLargeNumber(basePrice * (Math.random() * 50000000 + 10000000)), // Example market cap
  volume: formatLargeNumber(Math.floor(Math.random() * 10000000 + 1000000)), // Example volume
  avgVolume: formatLargeNumber(Math.floor(Math.random() * 15000000 + 2000000)),
  peRatio: parseFloat((Math.random() * 30 + 10).toFixed(2)), // Example P/E
  high52Week: parseFloat((basePrice * (1 + Math.random() * 0.3 + 0.1)).toFixed(2)), // ~10-40% above base
  low52Week: parseFloat((basePrice * (1 - Math.random() * 0.3 - 0.05)).toFixed(2)),  // ~5-35% below base
  logoUrl: `https://placehold.co/40x40.png`,
  dataAiHint,
  chartData: generateRandomChartData(),
  previousClose: parseFloat((basePrice - ((Math.random() - 0.5) * (basePrice * 0.02))).toFixed(2)) // Store a plausible previous close
});


export const mockStocks: Stock[] = [
  initialStockDetails('AAPL', 'Apple Inc.', 170.34, 'apple logo'),
  initialStockDetails('MSFT', 'Microsoft Corp.', 420.72, 'microsoft logo'),
  initialStockDetails('GOOGL', 'Alphabet Inc. (C)', 152.20, 'google logo'),
  initialStockDetails('AMZN', 'Amazon.com Inc.', 180.00, 'amazon logo'),
  initialStockDetails('TSLA', 'Tesla, Inc.', 175.79, 'tesla logo'),
  initialStockDetails('NVDA', 'NVIDIA Corporation', 900.50, 'nvidia logo'),
];

export const getStockBySymbol = (symbol: string): Stock | undefined => {
  const stock = mockStocks.find(stock => stock.symbol === symbol);
  return stock ? { ...stock } : undefined;
};

const newsSummaries = [
  "Analysts are bullish on the tech sector following recent innovations.",
  "New government regulations could impact energy stock prices next quarter.",
  "Consumer spending habits show a shift towards sustainable products.",
  "Global supply chain disruptions continue to pose challenges for manufacturers.",
  "A major tech company just announced a breakthrough in AI research."
];

const newsSources = ["Tech Chronicle", "Global Financial Times", "Eco Trends Magazine", "Industry Watch", "AI Today"];
const newsDataAiHints = ["technology", "finance chart", "eco friendly", "factory", "artificial intelligence"];

export const mockNews: NewsArticle[] = Array.from({ length: 10 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - i);
  const sentimentOptions: Array<'positive' | 'negative' | 'neutral'> = ['positive', 'negative', 'neutral'];
  const randomSentiment = sentimentOptions[Math.floor(Math.random() * sentimentOptions.length)];
  
  return {
    id: uuidv4(),
    headline: `Breaking News Story Title ${i + 1} about Market Trends`,
    source: newsSources[i % newsSources.length],
    date: date.toISOString(),
    summary: newsSummaries[i % newsSummaries.length] + ` More details to follow for article ${i + 1}.`,
    url: '#',
    imageUrl: `https://placehold.co/600x400.png`,
    dataAiHint: newsDataAiHints[i % newsDataAiHints.length],
    sentiment: randomSentiment,
    sentimentScore: Math.random() * (randomSentiment === 'positive' ? 1 : (randomSentiment === 'negative' ? -1 : 0.2) - (randomSentiment === 'negative' ? 0 : (randomSentiment === 'positive' ? 0 : -0.2))),
    sentimentReason: `AI analysis suggests this sentiment based on keyword usage and market context for article ${i + 1}.`
  };
});

// getUpdatedMockStocks is no longer the primary source of updates for WebSocket architecture.
// It could be repurposed to fetch *initial static data* for all mock stocks if needed,
// but dynamic updates will come from the WebSocket context.
// For now, its usage is removed from pages.
/*
export async function getUpdatedMockStocks(): Promise<Stock[]> {
  console.warn("getUpdatedMockStocks (polling) is deprecated in WebSocket mode. Static data is used initially.");
  // This function would ideally fetch the *initial* state if WebSockets don't provide it,
  // or be removed if initial state is part of mockStocks directly and WebSockets take over.
  // For now, it just returns the base mockStocks array.
  return Promise.resolve(mockStocks.map(stock => ({...stock}))); 
}
*/


export const mockMarketMovers: { gainers: MarketMover[], losers: MarketMover[], active: MarketMover[] } = {
  gainers: mockStocks.slice(0,3).map(s => ({...s, type: 'gainer', change: Math.abs(s.change), changePercent: Math.abs(s.changePercent) })).sort((a,b) => b.changePercent - a.changePercent),
  losers: mockStocks.slice(3,5).map(s => ({...s, type: 'loser', change: -Math.abs(s.change), changePercent: -Math.abs(s.changePercent) })).sort((a,b) => a.changePercent - b.changePercent),
  active: [...mockStocks].sort((a,b) => parseFloat(b.volume?.replace(/[^0-9.]/g, '') || '0') - parseFloat(a.volume?.replace(/[^0-9.]/g, '') || '0')).slice(0,3).map(s => ({...s, type: 'active'}))
};

export const mockSentimentData: SentimentDataPoint[] = [
  { name: 'Positive', value: 45, fill: 'hsl(var(--chart-4))' }, 
  { name: 'Negative', value: 25, fill: 'hsl(var(--chart-5))' }, 
  { name: 'Neutral', value: 30, fill: 'hsl(var(--chart-3))' },  
];

export const mockPortfolio: Omit<PortfolioPosition, 'currentPrice' | 'name' | 'logoUrl' | 'dataAiHint'>[] = [
  { symbol: 'AAPL', shares: 10, avgPurchasePrice: 150.00 },
  { symbol: 'MSFT', shares: 5, avgPurchasePrice: 400.00 },
  { symbol: 'TSLA', shares: 20, avgPurchasePrice: 160.00 },
  { symbol: 'GOOGL', shares: 15, avgPurchasePrice: 140.00 },
];

function formatLargeNumber(num: number): string {
  if (num === null || num === undefined || isNaN(num)) return 'N/A';
  if (Math.abs(num) < 1_000_000) {
    return num.toLocaleString(undefined, {maximumFractionDigits: 0});
  }
  if (Math.abs(num) < 1_000_000_000) {
    return (num / 1_000_000).toFixed(2) + 'M';
  }
  if (Math.abs(num) < 1_000_000_000_000) {
    return (num / 1_000_000_000).toFixed(2) + 'B';
  }
  return (num / 1_000_000_000_000).toFixed(2) + 'T';
}
