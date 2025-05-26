
import type { Stock, NewsArticle, MarketMover, SentimentDataPoint } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

const generateRandomChartData = (): { month: string; price: number }[] => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let lastPrice = Math.random() * 200 + 50;
  return months.map(month => {
    lastPrice += (Math.random() - 0.45) * 20; // Price can go up or down
    if (lastPrice < 10) lastPrice = 10; // Floor price
    return { month, price: parseFloat(lastPrice.toFixed(2)) };
  });
};

export const mockStocks: Stock[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 170.34,
    change: 1.25,
    changePercent: 0.0074,
    marketCap: formatLargeNumber(2700000000000),
    volume: formatLargeNumber(75000000),
    logoUrl: 'https://placehold.co/40x40.png',
    dataAiHint: 'apple logo',
    chartData: generateRandomChartData(),
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    price: 420.72,
    change: -0.50,
    changePercent: -0.0012,
    marketCap: formatLargeNumber(3100000000000),
    volume: formatLargeNumber(22000000),
    logoUrl: 'https://placehold.co/40x40.png',
    dataAiHint: 'microsoft logo',
    chartData: generateRandomChartData(),
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc. (C)',
    price: 152.20,
    change: 2.10,
    changePercent: 0.0140,
    marketCap: formatLargeNumber(1900000000000),
    volume: formatLargeNumber(30000000),
    logoUrl: 'https://placehold.co/40x40.png',
    dataAiHint: 'google logo',
    chartData: generateRandomChartData(),
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    price: 180.00,
    change: -1.80,
    changePercent: -0.0099,
    marketCap: formatLargeNumber(1850000000000),
    volume: formatLargeNumber(45000000),
    logoUrl: 'https://placehold.co/40x40.png',
    dataAiHint: 'amazon logo',
    chartData: generateRandomChartData(),
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    price: 175.79,
    change: 5.60,
    changePercent: 0.0329,
    marketCap: formatLargeNumber(560000000000),
    volume: formatLargeNumber(110000000),
    logoUrl: 'https://placehold.co/40x40.png',
    dataAiHint: 'tesla logo',
    chartData: generateRandomChartData(),
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    price: 900.50,
    change: -10.20,
    changePercent: -0.0112,
    marketCap: formatLargeNumber(2250000000000),
    volume: formatLargeNumber(50000000),
    logoUrl: 'https://placehold.co/40x40.png',
    dataAiHint: 'nvidia logo',
    chartData: generateRandomChartData(),
  },
];

export const getStockBySymbol = (symbol: string): Stock | undefined => {
  return mockStocks.find(stock => stock.symbol === symbol);
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

// Function to simulate stock price updates
export const getUpdatedMockStocks = (): Stock[] => {
  return mockStocks.map(stock => {
    const changeFactor = (Math.random() - 0.5) * 0.05; // Max 5% change up or down
    const newPrice = stock.price * (1 + changeFactor);
    const newChange = newPrice - stock.price;
    const newChangePercent = newChange / stock.price;
    return {
      ...stock,
      price: parseFloat(newPrice.toFixed(2)),
      change: parseFloat(newChange.toFixed(2)),
      changePercent: parseFloat(newChangePercent.toFixed(4)),
      chartData: stock.chartData ? stock.chartData.map(d => ({...d, price: d.price * (1 + (Math.random() - 0.5) * 0.01)})) : generateRandomChartData(), // Slightly adjust chart data too
    };
  });
};

export const mockMarketMovers: { gainers: MarketMover[], losers: MarketMover[], active: MarketMover[] } = {
  gainers: mockStocks.slice(0,3).map(s => ({...s, type: 'gainer', change: Math.abs(s.change), changePercent: Math.abs(s.changePercent) })).sort((a,b) => b.changePercent - a.changePercent),
  losers: mockStocks.slice(3,5).map(s => ({...s, type: 'loser', change: -Math.abs(s.change), changePercent: -Math.abs(s.changePercent) })).sort((a,b) => a.changePercent - b.changePercent),
  active: [...mockStocks].sort((a,b) => parseFloat(b.volume?.replace(/[^0-9.]/g, '') || '0') - parseFloat(a.volume?.replace(/[^0-9.]/g, '') || '0')).slice(0,3).map(s => ({...s, type: 'active'}))
};

export const mockSentimentData: SentimentDataPoint[] = [
  { name: 'Positive', value: 45, fill: 'hsl(var(--chart-4))' }, // Greenish
  { name: 'Negative', value: 25, fill: 'hsl(var(--chart-5))' }, // Reddish
  { name: 'Neutral', value: 30, fill: 'hsl(var(--chart-3))' },  // Yellowish/Orange
];

// Helper function from mock-data.ts
function formatLargeNumber(num: number): string {
  if (num === null || num === undefined || isNaN(num)) return 'N/A';
  if (Math.abs(num) < 1_000_000) {
    return num.toLocaleString();
  }
  if (Math.abs(num) < 1_000_000_000) {
    return (num / 1_000_000).toFixed(2) + 'M';
  }
  if (Math.abs(num) < 1_000_000_000_000) {
    return (num / 1_000_000_000).toFixed(2) + 'B';
  }
  return (num / 1_000_000_000_000).toFixed(2) + 'T';
}
