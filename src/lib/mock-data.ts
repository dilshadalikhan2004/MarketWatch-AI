
import type { Stock, NewsArticle, MarketMover, SentimentDataPoint, PortfolioPosition, UserPortfolioPosition } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

const generateDeterministicChartData = (basePrice: number): { month: string; price: number }[] => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const prices = [
    basePrice * 0.95, basePrice * 0.92, basePrice * 0.90, basePrice * 0.93,
    basePrice * 0.97, basePrice * 1.00, basePrice * 1.02, basePrice * 1.05,
    basePrice * 1.03, basePrice * 1.07, basePrice * 1.10, basePrice * 1.08
  ].map(p => parseFloat(p.toFixed(2)));
  const finalPrices = Array(12).fill(0).map((_, i) => prices[i] || prices[prices.length -1] || basePrice);
  return months.map((month, index) => ({ month, price: finalPrices[index] }));
};

const initialStockDetails = (
  symbol: string,
  name: string,
  basePrice: number,
  dataAiHint: string,
  fixedChange: number 
) => {
  const previousClose = parseFloat((basePrice - fixedChange).toFixed(2));
  const changePercent = previousClose !== 0 ? parseFloat((fixedChange / previousClose).toFixed(4)) : 0;

  return {
    symbol,
    name,
    price: basePrice,
    change: fixedChange,
    changePercent: changePercent,
    marketCap: formatLargeNumber(basePrice * (50000000 + (symbol.charCodeAt(0) - 65) * 1000000)),
    volume: formatLargeNumber(1000000 + (symbol.charCodeAt(0) - 65) * 100000),
    avgVolume: formatLargeNumber(2000000 + (symbol.charCodeAt(0) - 65) * 150000),
    peRatio: parseFloat((20 + (symbol.charCodeAt(0) - 65) * 0.5).toFixed(2)),
    high52Week: parseFloat((basePrice * 1.25).toFixed(2)),
    low52Week: parseFloat((basePrice * 0.85).toFixed(2)),
    logoUrl: `https://placehold.co/40x40.png`, 
    dataAiHint,
    chartData: generateDeterministicChartData(basePrice),
    previousClose: previousClose
  };
};

export const mockStocks: Stock[] = [
  initialStockDetails('AAPL', 'Apple Inc.', 170.34, 'apple logo', 3.00),
  initialStockDetails('MSFT', 'Microsoft Corp.', 420.72, 'microsoft logo', -1.50),
  initialStockDetails('GOOGL', 'Alphabet Inc. (C)', 152.20, 'google logo', 0.75),
  initialStockDetails('AMZN', 'Amazon.com Inc.', 180.00, 'amazon logo', 2.10),
  initialStockDetails('TSLA', 'Tesla, Inc.', 175.79, 'tesla logo', -5.20),
  initialStockDetails('NVDA', 'NVIDIA Corporation', 900.50, 'nvidia logo', 10.55),
];

export const getStockBySymbol = (symbol: string): Stock | undefined => {
  const stock = mockStocks.find(stock => stock.symbol === symbol);
  return stock ? { ...stock } : undefined; 
};

const newsHeadlinesTemplates = [
  "Market Hits Record High Amidst Tech Rally",
  "Future of Renewable Energy Stocks Looks Bright",
  "Global Economy Shows Signs of Slowdown, Experts Warn",
  "New Innovations in AI Could Disrupt Major Industries",
  "Understanding the Impact of Inflation on Your Portfolio",
  "Crypto Market Volatility: What Investors Need to Know",
  "Real Estate Trends: Is Now a Good Time to Buy or Sell?",
  "E-commerce Growth Continues to Outpace Traditional Retail",
  "The Rise of Sustainable Investing: Opportunities and Risks",
  "Geopolitical Tensions and Their Effect on Oil Prices"
];

const newsSummariesTemplates = [
  "The stock market surged today, driven by strong earnings reports from leading technology companies and positive economic indicators.",
  "Investment in renewable energy is expected to grow significantly, with new policies and technologies paving the way for a greener future.",
  "Economists are expressing concerns about a potential global economic slowdown, citing supply chain issues and rising interest rates.",
  "Artificial intelligence is rapidly evolving, with new breakthroughs poised to transform sectors from healthcare to finance and transportation.",
  "Inflation can erode purchasing power and investment returns. We explore strategies to protect your wealth in an inflationary environment.",
  "The cryptocurrency market remains highly volatile, offering both significant opportunities and substantial risks for savvy investors.",
  "Current real estate market conditions present a mixed bag for buyers and sellers, with regional variations playing a key role.",
  "Online retail sales continue their upward trajectory, challenging traditional brick-and-mortar stores to adapt or perish.",
  "Sustainable and ESG (Environmental, Social, and Governance) investing is gaining traction, but requires careful due diligence.",
  "Ongoing international conflicts and political instability are creating uncertainty in global energy markets, particularly for oil."
];

const newsSources = ["Market Insider", "Global Financial Times", "Eco Trends Magazine", "Industry Watch Daily", "FutureTech AI News", "Business Chronicle", "Economy Today"];
const newsDataAiHints = ["stock chart", "solar panel", "graphs statistics", "artificial intelligence", "money coins", "office building", "currency exchange"];

export const generateMockNews = (count: number = 10): NewsArticle[] => {
  const articles: NewsArticle[] = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const articleDate = new Date(today);
    articleDate.setDate(today.getDate() - i); // Dates go backwards from today

    articles.push({
      id: uuidv4(),
      title: `${newsHeadlinesTemplates[i % newsHeadlinesTemplates.length]} - Day ${i + 1}`,
      description: `${newsSummariesTemplates[i % newsSummariesTemplates.length]} This is mock article ${i + 1}.`,
      url: '#', // Placeholder URL
      urlToImage: `https://placehold.co/600x400.png`,
      publishedAt: articleDate.toISOString(),
      source: { name: newsSources[i % newsSources.length] },
      author: `Author ${i % 5 + 1}`,
      content: `Full content for mock article ${i + 1}. ${newsSummariesTemplates[i % newsSummariesTemplates.length]}`,
      dataAiHint: newsDataAiHints[i % newsDataAiHints.length]
    });
  }
  return articles;
};


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

export const mockPortfolio: Omit<PortfolioPosition, 'currentPrice' | 'name' | 'logoUrl' | 'dataAiHint' | 'marketValue' | 'initialCost' | 'gainLoss' | 'gainLossPercent'>[] = [
  { symbol: 'AAPL', shares: 10, avgPurchasePrice: 150.00 },
  { symbol: 'MSFT', shares: 5, avgPurchasePrice: 400.00 },
  { symbol: 'TSLA', shares: 20, avgPurchasePrice: 160.00 },
  { symbol: 'GOOGL', shares: 15, avgPurchasePrice: 140.00 },
];

function formatLargeNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return 'N/A';
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
