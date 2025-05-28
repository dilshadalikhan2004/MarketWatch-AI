
// src/services/stock-api-service.ts
import type { Stock, RealtimeStockData } from '@/lib/types';
import { mockStocks as baseMockStocks } from '@/lib/mock-data';

export async function fetchInitialStockDetails(symbol: string): Promise<Partial<Stock> | null> {
  // console.log(`[StockApiService] fetchInitialStockDetails called for ${symbol}`);
  const baseStock = baseMockStocks.find(s => s.symbol === symbol);
  if (!baseStock) {
    // console.warn(`[StockApiService] No base mock stock found for ${symbol} in fetchInitialStockDetails.`);
    return null;
  }
  return {
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
  };
}


export async function fetchAlphaVantageQuote(symbol: string, apiKey: string): Promise<Partial<RealtimeStockData> | null> {
  const apiKeyFromEnv = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;
  const effectiveApiKey = apiKey || apiKeyFromEnv;

  if (!effectiveApiKey || effectiveApiKey === "YOUR_API_KEY_HERE" || effectiveApiKey === "OM1ZC4CCCCKIGT8O_REPLACE_WITH_YOUR_KEY" ) {
    const msg = `Alpha Vantage API key is not configured properly or is a placeholder. Mock data will be used if available for ${symbol}. Key: ${effectiveApiKey}`;
    // console.warn(`[AlphaVantageService] ${msg}`);
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
    throw new Error(msg);
  }

  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${effectiveApiKey}`;
  // console.log(`[AlphaVantageService] Fetching quote for ${symbol} from Alpha Vantage.`);

  try {
    const response = await fetch(url);
    const data = await response.json(); // Try to parse JSON first

    if (!response.ok) {
      let errorText = `API request failed with status ${response.status}`;
      if (data && typeof data === 'object') {
        if ('Note' in data && typeof data.Note === 'string') {
            errorText = `Alpha Vantage Note: ${data.Note}`;
        } else if ('Information' in data && typeof data.Information === 'string') {
            errorText = `Alpha Vantage Info: ${data.Information}`;
        } else if ('Error Message' in data && typeof data['Error Message'] === 'string') {
            errorText = `Alpha Vantage Error: ${data['Error Message']}`;
        }
      }
      console.warn(`[AlphaVantageService] API request failed for ${symbol}. Status: ${response.status}. Message: ${errorText}. Raw Data:`, data);
      throw new Error(errorText);
    }

    // console.log(`[AlphaVantageService] Received data for ${symbol}:`, data);

    if (data.Information) {
      const infoMessage = `Alpha Vantage: ${data.Information}`;
      // console.warn(`[AlphaVantageService] ${infoMessage} for ${symbol}`);
      throw new Error(infoMessage); 
    }
    if (data.Note) {
      // console.warn(`[AlphaVantageService] Alpha Vantage API returned a note for ${symbol}: ${data.Note}`);
      if (!data['Global Quote'] || Object.keys(data['Global Quote']).length === 0) {
        throw new Error(`Alpha Vantage Note: ${data.Note} (and no quote data)`);
      }
    }
     if (data['Error Message']) {
      const errorMessage = `Alpha Vantage Error: ${data['Error Message']}`;
      // console.warn(`[AlphaVantageService] ${errorMessage} for ${symbol}`);
      throw new Error(errorMessage);
    }


    const quote = data['Global Quote'];
    if (!quote || Object.keys(quote).length === 0) {
      console.warn(`[AlphaVantageService] No 'Global Quote' data found for ${symbol} in API response. Response:`, data);
      throw new Error(`No valid quote data received from Alpha Vantage for ${symbol}. The symbol might be invalid, delisted, or API limit reached.`);
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
        console.warn(`[AlphaVantageService] Parsed quote data for ${symbol} contains NaN values. Quote:`, quote);
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
    throw error;
  }
}
