import type { Stock, NewsArticle } from '@/lib/types';

export const mockStocks: Stock[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 170.34, change: 2.17, changePercent: 1.29, volume: 90_000_000, marketCap: '2.8T', previousClose: 168.17, open: 169.00, dayHigh: 171.50, dayLow: 168.00, yearHigh: 190.00, yearLow: 120.00, logoUrl: 'https://placehold.co/40x40.png?text=AAPL' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 420.55, change: -1.10, changePercent: -0.26, volume: 75_000_000, marketCap: '3.1T', previousClose: 421.65, open: 421.00, dayHigh: 423.00, dayLow: 419.50, yearHigh: 450.00, yearLow: 280.00, logoUrl: 'https://placehold.co/40x40.png?text=MSFT' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 175.60, change: 0.95, changePercent: 0.54, volume: 60_000_000, marketCap: '2.2T', previousClose: 174.65, open: 175.00, dayHigh: 176.00, dayLow: 174.00, yearHigh: 180.00, yearLow: 120.00, logoUrl: 'https://placehold.co/40x40.png?text=GOOGL' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 185.20, change: -2.50, changePercent: -1.33, volume: 110_000_000, marketCap: '1.9T', previousClose: 187.70, open: 186.50, dayHigh: 188.00, dayLow: 184.00, yearHigh: 200.00, yearLow: 100.00, logoUrl: 'https://placehold.co/40x40.png?text=AMZN' },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 180.01, change: 5.60, changePercent: 3.21, volume: 150_000_000, marketCap: '580B', previousClose: 174.41, open: 176.00, dayHigh: 182.00, dayLow: 175.50, yearHigh: 300.00, yearLow: 100.00, logoUrl: 'https://placehold.co/40x40.png?text=TSLA' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 120.70, change: 3.10, changePercent: 2.63, volume: 200_000_000, marketCap: '3.0T', previousClose: 117.60, open: 118.00, dayHigh: 121.00, dayLow: 117.00, yearHigh: 140.00, yearLow: 30.00, logoUrl: 'https://placehold.co/40x40.png?text=NVDA' },
  { symbol: 'META', name: 'Meta Platforms Inc.', price: 490.80, change: -4.20, changePercent: -0.85, volume: 45_000_000, marketCap: '1.2T', previousClose: 495.00, open: 494.00, dayHigh: 498.00, dayLow: 489.00, yearHigh: 530.00, yearLow: 290.00, logoUrl: 'https://placehold.co/40x40.png?text=META' },
  { symbol: 'BRK.A', name: 'Berkshire Hathaway', price: 620000.00, change: 1500.00, changePercent: 0.24, volume: 100, marketCap: '900B', previousClose: 618500.00, open: 619000.00, dayHigh: 621000.00, dayLow: 618000.00, yearHigh: 650000.00, yearLow: 500000.00, logoUrl: 'https://placehold.co/40x40.png?text=BRK' },
];

export const getStockBySymbol = (symbol: string): Stock | undefined => {
  return mockStocks.find(stock => stock.symbol.toLowerCase() === symbol.toLowerCase());
};


export const mockNews: NewsArticle[] = [
  { id: '1', headline: 'Tech Stocks Rally on AI Optimism', source: 'Market News Today', date: '2024-07-28', summary: 'Major technology stocks saw significant gains as investor confidence in artificial intelligence continues to grow.', url: '#', imageUrl: 'https://placehold.co/600x400.png', dataAiHint: 'technology abstract' },
  { id: '2', headline: 'Federal Reserve Hints at Stable Interest Rates', source: 'Economic Times', date: '2024-07-27', summary: 'The Federal Reserve indicated that interest rates are likely to remain stable for the near future, easing market concerns.', url: '#', imageUrl: 'https://placehold.co/600x400.png', dataAiHint: 'finance chart' },
  { id: '3', headline: 'NVDA Unveils Next-Gen GPUs, Stock Soars', source: 'Tech Chronicle', date: '2024-07-26', summary: 'NVIDIA\'s announcement of new graphics processing units has led to a surge in its stock price and positive market sentiment.', url: '#', imageUrl: 'https://placehold.co/600x400.png', dataAiHint: 'computer hardware' },
  { id: '4', headline: 'Oil Prices Fluctuate Amid Geopolitical Tensions', source: 'Global Energy Report', date: '2024-07-25', summary: 'Crude oil prices are experiencing volatility due to ongoing geopolitical events impacting supply chains.', url: '#', imageUrl: 'https://placehold.co/600x400.png', dataAiHint: 'oil industry' },
];

// Function to simulate price updates
export const getUpdatedMockStocks = (): Stock[] => {
  return mockStocks.map(stock => {
    const changePercent = (Math.random() - 0.5) * 0.05; // Max 2.5% change up or down
    const newPrice = stock.price * (1 + changePercent);
    const change = newPrice - stock.price;
    return {
      ...stock,
      price: parseFloat(newPrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat((changePercent * 100).toFixed(2)),
    };
  });
};
