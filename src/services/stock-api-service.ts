
// src/services/stock-api-service.ts
import type { Stock, RealtimeStockData } from '@/lib/types';
import { mockStocks as baseMockStocks } from '@/lib/mock-data';

const API_SIMULATION_DELAY = 300;

export async function fetchInitialStockDetails(symbol: string): Promise<Partial<Stock> | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const baseStock = baseMockStocks.find(s => s.symbol === symbol);
      if (!baseStock) {
        resolve(null);
        return;
      }
      resolve({
        symbol: baseStock.symbol,
        name: baseStock.name,
        logoUrl: baseStock.logoUrl,
        dataAiHint: baseStock.dataAiHint,
        chartData: baseStock.chartData,
        peRatio: baseStock.peRatio,
        high52Week: baseStock.high52Week,
        low52Week: baseStock.low52Week,
        marketCap: baseStock.marketCap,
        avgVolume: baseStock.avgVolume,
        previousClose: baseStock.previousClose,
      });
    }, API_SIMULATION_DELAY);
  });
}

export async function fetchAlphaVantageQuote(symbol: string, apiKey: string): Promise<Partial<RealtimeStockData> | null> {
  if (!apiKey || apiKey === "YOUR_API_KEY_HERE" || apiKey === "V89R5M3623Z4P7A6_REPLACE_WITH_YOUR_KEY") {
    console.warn(`Alpha Vantage API key is missing or a placeholder. Using mock data for ${symbol}.`);
    // Fallback to mock data if API key is not set
    const mock = baseMockStocks.find(s => s.symbol === symbol);
    if (mock) {
      return {
        symbol: mock.symbol,
        name: mock.name,
        price: mock.price,
        change: mock.change,
        changePercent: mock.changePercent,
        volume: mock.volume?.toString(),
        dailyVolume: parseFloat(mock.volume?.replace(/[^0-9.]/g, '') || '0'),
        timestamp: Date.now(),
        previousClose: mock.previousClose
      };
    }
    return null;
  }

  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
  console.log(`[AlphaVantageService] Fetching quote for ${symbol} from ${url.replace(apiKey, "YOUR_API_KEY")}`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[AlphaVantageService] API request failed for ${symbol} with status: ${response.status}`);
      // Try to get error message from Alpha Vantage if available
      const errorData = await response.json().catch(() => ({}));
      console.error(`[AlphaVantageService] Error data:`, errorData);
      if (errorData.Note) {
         throw new Error(`Alpha Vantage API limit reached or error: ${errorData.Note}`);
      }
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log(`[AlphaVantageService] Received data for ${symbol}:`, data);

    const quote = data['Global Quote'];
    if (!quote || Object.keys(quote).length === 0) {
      // Check for API limit note specifically
      if (data.Note && data.Note.includes("call frequency")) {
         console.warn(`[AlphaVantageService] API call frequency limit reached for ${symbol}. Note: ${data.Note}`);
         throw new Error(`Alpha Vantage API limit reached: ${data.Note}. Please wait and try again or upgrade your API plan.`);
      }
      console.warn(`[AlphaVantageService] No quote data found for ${symbol} in API response. Response:`, data);
      return null; // Or throw an error if appropriate
    }

    const price = parseFloat(quote['05. price']);
    const previousClose = parseFloat(quote['08. previous close']);
    // Alpha Vantage provides change and changePercent directly.
    // However, their "09. change" might be calculated against previous day's close even for intraday quotes.
    // For consistency, let's ensure previousClose is available for our own calculation if needed,
    // but prioritize their provided change values if they make sense.
    const change = parseFloat(quote['09. change']);
    const changePercentString = quote['10. change percent'];
    const changePercent = parseFloat(changePercentString?.replace('%', '')) / 100;

    const volumeStr = quote['06. volume'];
    
    // Get the latest trading day and parse it to a timestamp
    // Alpha Vantage dates are usually YYYY-MM-DD.
    // The GLOBAL_QUOTE timestamp might not be "real-time" for free tier, it's end-of-day or delayed.
    const latestTradingDay = quote['07. latest trading day'];
    const timestamp = latestTradingDay ? new Date(latestTradingDay).getTime() : Date.now();


    return {
      symbol: quote['01. symbol'],
      price: price,
      change: change,
      changePercent: changePercent,
      volume: volumeStr, // Keep as string as per original type, or parse if needed
      dailyVolume: parseFloat(volumeStr),
      timestamp: timestamp,
      previousClose: previousClose,
      // Alpha Vantage GLOBAL_QUOTE doesn't provide detailed chart data directly,
      // nor market cap or avg volume in this specific endpoint.
      // These would need separate API calls (e.g., TIME_SERIES_DAILY for chart, OVERVIEW for others)
      // or can be populated from initial mock data if available.
    };

  } catch (error) {
    console.error(`[AlphaVantageService] Error fetching or parsing data for ${symbol}:`, error);
    throw error; // Re-throw to be caught by the context
  }
}
