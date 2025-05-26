
import type { Stock, NewsArticle, MarketMover, SentimentDataPoint, PortfolioPosition } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

const generateDeterministicChartData = (basePrice: number): { month: string; price: number }[] => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  // Use a simple, predictable pattern for variety or a completely fixed one
  const prices = [
    basePrice * 0.95, basePrice * 0.92, basePrice * 0.90, basePrice * 0.93,
    basePrice * 0.97, basePrice * 1.00, basePrice * 1.02, basePrice * 1.05,
    basePrice * 1.03, basePrice * 1.07, basePrice * 1.10, basePrice * 1.08
  ].map(p => parseFloat(p.toFixed(2)));

  // Ensure we have 12 data points, repeat last if necessary (though above ensures it)
  const finalPrices = Array(12).fill(0).map((_, i) => prices[i] || prices[prices.length -1] || basePrice);

  return months.map((month, index) => ({ month, price: finalPrices[index] }));
};


const initialStockDetails = (
  symbol: string,
  name: string,
  basePrice: number,
  dataAiHint: string,
  fixedChange: number // Add a parameter for a fixed change
) => {
  const previousClose = parseFloat((basePrice - fixedChange).toFixed(2));
  const changePercent = previousClose !== 0 ? parseFloat((fixedChange / previousClose).toFixed(4)) : 0;

  return {
    symbol,
    name,
    price: basePrice,
    change: fixedChange,
    changePercent: changePercent,
    marketCap: formatLargeNumber(basePrice * (50000000 + (symbol.charCodeAt(0) - 65) * 1000000)), // Deterministic based on symbol
    volume: formatLargeNumber(1000000 + (symbol.charCodeAt(0) - 65) * 100000), // Deterministic
    avgVolume: formatLargeNumber(2000000 + (symbol.charCodeAt(0) - 65) * 150000), // Deterministic
    peRatio: parseFloat((20 + (symbol.charCodeAt(0) - 65) * 0.5).toFixed(2)), // Deterministic
    high52Week: parseFloat((basePrice * 1.25).toFixed(2)), // Deterministic factor
    low52Week: parseFloat((basePrice * 0.85).toFixed(2)),  // Deterministic factor
    logoUrl: `https://placehold.co/40x40.png`,
    dataAiHint,
    chartData: generateDeterministicChartData(basePrice),
    previousClose: previousClose
  };
};


export const mockStocks: Stock[] = [
  initialStockDetails('AAPL', 'Apple Inc.', 170.34, 'apple logo', 3.00), // Example: +$3.00 change
  initialStockDetails('MSFT', 'Microsoft Corp.', 420.72, 'microsoft logo', -1.50), // Example: -$1.50 change
  initialStockDetails('GOOGL', 'Alphabet Inc. (C)', 152.20, 'google logo', 0.75),
  initialStockDetails('AMZN', 'Amazon.com Inc.', 180.00, 'amazon logo', 2.10),
  initialStockDetails('TSLA', 'Tesla, Inc.', 175.79, 'tesla logo', -5.20),
  initialStockDetails('NVDA', 'NVIDIA Corporation', 900.50, 'nvidia logo', 10.55),
];

export const getStockBySymbol = (symbol: string): Stock | undefined => {
  const stock = mockStocks.find(stock => stock.symbol === symbol);
  return stock ? { ...stock } : undefined; // Return a copy to avoid direct state mutation if this object is used elsewhere
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
  date.setDate(date.getDate() - i); // Deterministic date sequence
  const sentimentOptions: Array<'positive' | 'negative' | 'neutral'> = ['positive', 'negative', 'neutral'];
  // Make sentiment deterministic based on index for consistency
  const randomSentiment = sentimentOptions[i % sentimentOptions.length];
  
  let score;
  switch (randomSentiment) {
    case 'positive': score = 0.65 + (i % 3) * 0.1; break; // e.g. 0.65, 0.75, 0.85
    case 'negative': score = -0.65 - (i % 3) * 0.1; break; // e.g. -0.65, -0.75, -0.85
    case 'neutral': score = 0.0 + ((i % 3) - 1) * 0.05; break; // e.g. -0.05, 0.0, 0.05
    default: score = 0;
  }

  return {
    id: uuidv4(),
    headline: `Breaking News Story Title ${i + 1} about Market Trends`,
    source: newsSources[i % newsSources.length],
    date: date.toISOString(),
    summary: newsSummaries[i % newsSummaries.length] + ` More details to follow for article ${i + 1}.`,
    url: '#', // Keep as placeholder or use actual URLs
    imageUrl: `https://placehold.co/600x400.png`, // Consistent placeholder
    dataAiHint: newsDataAiHints[i % newsDataAiHints.length],
    sentiment: randomSentiment,
    sentimentScore: parseFloat(score.toFixed(2)),
    sentimentReason: `AI analysis suggests this sentiment based on keyword usage and market context for article ${i + 1}.`
  };
});


export const mockMarketMovers: { gainers: MarketMover[], losers: MarketMover[], active: MarketMover[] } = {
  gainers: mockStocks.filter(s => s.change > 0).slice(0,3).map(s => ({...s, type: 'gainer' as const })).sort((a,b) => b.changePercent - a.changePercent),
  losers: mockStocks.filter(s => s.change < 0).slice(0,3).map(s => ({...s, type: 'loser' as const })).sort((a,b) => a.changePercent - b.changePercent),
  active: [...mockStocks].sort((a,b) => parseFloat(b.volume?.replace(/[^0-9.]/g, '') || '0') - parseFloat(a.volume?.replace(/[^0-9.]/g, '') || '0')).slice(0,3).map(s => ({...s, type: 'active' as const}))
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
