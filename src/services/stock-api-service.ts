
// src/services/stock-api-service.ts
import type { Stock, RealtimeStockData } from '@/lib/types';
import { mockStocks as baseMockStocks } from '@/lib/mock-data';

const API_SIMULATION_DELAY = 300; // Simulate network delay

export async function fetchInitialStockDetails(symbol: string): Promise<Partial<Stock> | null> {
  console.log(`[StockApiService] fetchInitialStockDetails called for ${symbol}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      const baseStock = baseMockStocks.find(s => s.symbol === symbol);
      if (!baseStock) {
        console.warn(`[StockApiService] No base mock stock found for ${symbol} in fetchInitialStockDetails.`);
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
  const apiKeyFromEnv = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;
  const effectiveApiKey = apiKey || apiKeyFromEnv;

  console.log(`[AlphaVantageService] Attempting to fetch quote for ${symbol}. API Key effectively used: ${effectiveApiKey ? effectiveApiKey.substring(0,4) + '...' : 'N/A'}`);


  if (!effectiveApiKey || effectiveApiKey === "YOUR_API_KEY_HERE" || effectiveApiKey === "V89R5M3623Z4P7A6_REPLACE_WITH_YOUR_KEY" || effectiveApiKey === "OM1ZC4CCCCKIGT8O_REPLACE_WITH_YOUR_KEY") {
    const msg = `Alpha Vantage API key is not configured properly or is a placeholder. Mock data will be used if available for ${symbol}. Key found: ${effectiveApiKey}`;
    console.warn(`[AlphaVantageService] ${msg}`);
    // Fallback to mock data if API key is not set - this part might be removed if we always want to throw an error
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
    throw new Error(msg); // Or simply return null if preferred
  }

  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${effectiveApiKey}`;
  console.log(`[AlphaVantageService] Fetching quote for ${symbol} from ${url.replace(effectiveApiKey, "YOUR_API_KEY_REDACTED")}`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      let errorData;
      let errorText = `API request failed with status ${response.status}`;
      try {
        errorData = await response.json();
        console.error(`[AlphaVantageService] API request failed for ${symbol} with status: ${response.status}. Error data:`, errorData);
        if (errorData && typeof errorData === 'object') {
            if ('Note' in errorData && typeof errorData.Note === 'string') {
                errorText = `Alpha Vantage API Error: ${errorData.Note}`;
            } else if ('Information' in errorData && typeof errorData.Information === 'string') {
                errorText = `Alpha Vantage API Info: ${errorData.Information}`;
            } else if ('Error Message' in errorData && typeof errorData['Error Message'] === 'string') {
                errorText = `Alpha Vantage API Error: ${errorData['Error Message']}`;
            }
        }
      } catch (e) {
        console.error(`[AlphaVantageService] Could not parse error JSON for ${symbol}. Status: ${response.status}`);
      }
      throw new Error(errorText);
    }

    const data = await response.json();
    console.log(`[AlphaVantageService] Received data for ${symbol}:`, data);

    // Check for top-level informational or error messages from Alpha Vantage
    if (data.Information) {
      console.warn(`[AlphaVantageService] Alpha Vantage API returned an informational message for ${symbol}: ${data.Information}`);
      throw new Error(`Alpha Vantage: ${data.Information}`);
    }
    if (data.Note) { // This might be for higher frequency limits on premium keys
      console.warn(`[AlphaVantageService] Alpha Vantage API returned a note for ${symbol}: ${data.Note}`);
      // Don't necessarily throw, might be a "thank you for using" message on success with Global Quote
      // unless Global Quote itself is missing.
    }
     if (data['Error Message']) {
      console.warn(`[AlphaVantageService] Alpha Vantage API returned an error message for ${symbol}: ${data['Error Message']}`);
      throw new Error(`Alpha Vantage Error: ${data['Error Message']}`);
    }


    const quote = data['Global Quote'];
    if (!quote || Object.keys(quote).length === 0) {
      console.warn(`[AlphaVantageService] No 'Global Quote' data found for ${symbol} in API response. Full response:`, data);
      // At this point, if Information/Note/Error Message didn't catch it, it's an unexpected empty quote.
      throw new Error(`No valid quote data received from Alpha Vantage for ${symbol}. The symbol might be invalid or delisted.`);
    }

    const price = parseFloat(quote['05. price']);
    const previousClose = parseFloat(quote['08. previous close']);
    const change = parseFloat(quote['09. change']);
    const changePercentString = quote['10. change percent'];
    const changePercent = parseFloat(changePercentString?.replace('%', '')) / 100;
    const volumeStr = quote['06. volume'];
    const latestTradingDay = quote['07. latest trading day'];
    const timestamp = latestTradingDay ? new Date(latestTradingDay).getTime() : Date.now();

    if (isNaN(price) || isNaN(previousClose) || isNaN(change) || isNaN(changePercent)) {
        console.error(`[AlphaVantageService] Parsed quote data for ${symbol} contains NaN values. Quote:`, quote);
        throw new Error(`Invalid data format received from Alpha Vantage for ${symbol}. Some numerical values were not parsable.`);
    }

    return {
      symbol: quote['01. symbol'],
      price: price,
      change: change,
      changePercent: changePercent,
      volume: volumeStr,
      dailyVolume: parseFloat(volumeStr),
      timestamp: timestamp,
      previousClose: previousClose,
    };

  } catch (error: any) {
    console.error(`[AlphaVantageService] Error in fetchAlphaVantageQuote for ${symbol}:`, error.message);
    // Re-throw the error so it's caught by RealtimeStockContext
    // and the error state can be updated there.
    throw error;
  }
}
