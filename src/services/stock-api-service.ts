
// src/services/stock-api-service.ts
import type { RealtimeStockData, Stock } from '@/lib/types';
import { mockStocks as baseMockStocks } from '@/lib/mock-data';

// This function can be used to get more static details like name, logo, initial chart data
// which might not be available from all quote APIs.
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
    previousClose: baseStock.previousClose, // Important for calculating change
  };
}


export async function fetchFmpQuote(symbol: string, apiKey: string): Promise<Partial<RealtimeStockData> | null> {
  const effectiveApiKey = apiKey || process.env.NEXT_PUBLIC_FMP_API_KEY;

  if (!effectiveApiKey || effectiveApiKey === "YOUR_FMP_API_KEY_HERE") {
    const msg = `FinancialModelingPrep API key is not configured properly or is a placeholder for ${symbol}. Key: ${effectiveApiKey}`;
    console.warn(`[FMPService] ${msg}`);
    // Fallback to mock if key is bad, to keep UI from completely breaking with no data
    const mock = baseMockStocks.find(s => s.symbol === symbol);
    if (mock) {
      return {
        symbol: mock.symbol,
        name: mock.name,
        price: mock.price,
        // Change and changePercent will be calculated by the context using previousClose
        volume: mock.volume?.toString(), // FMP provides volume as number
        dailyVolume: parseFloat(mock.volume?.replace(/[^0-9.]/g, '') || '0'),
        timestamp: Date.now(),
        previousClose: mock.previousClose
      };
    }
    throw new Error(msg);
  }

  const url = `https://financialmodelingprep.com/api/v3/stock/full/real-time-price/${symbol}?apikey=${effectiveApiKey}`;
  // console.log(`[FMPService] Fetching quote for ${symbol} from FMP.`);

  try {
    const response = await fetch(url);
    const responseData = await response.json();

    if (!response.ok) {
      let errorText = `FMP API request failed with status ${response.status}`;
      if (responseData && responseData.message) {
        errorText = `FMP API Error: ${responseData.message}`;
      } else if (responseData && responseData["Error Message"]) {
        errorText = `FMP API Error: ${responseData["Error Message"]}`;
      }
      console.warn(`[FMPService] API request failed for ${symbol}. Status: ${response.status}. Message: ${errorText}. Raw Data:`, responseData);
      throw new Error(errorText);
    }
    
    // FMP returns an array, usually with one element for this endpoint
    if (!responseData || !Array.isArray(responseData) || responseData.length === 0) {
      console.warn(`[FMPService] No data or unexpected format received from FMP for ${symbol}. Response:`, responseData);
      throw new Error(`No valid quote data received from FMP for ${symbol}.`);
    }

    const quote = responseData[0];

    if (!quote || typeof quote.symbol === 'undefined') {
        console.warn(`[FMPService] Invalid quote object in FMP response for ${symbol}. Quote:`, quote);
        throw new Error(`Invalid data structure from FMP for ${symbol}.`);
    }
    
    const price = parseFloat(quote.lastSalePrice);
    const dailyVolume = Number(quote.volume); // FMP provides volume as number
    const timestamp = Number(quote.lastSaleTime); // FMP provides timestamp in ms

    if (isNaN(price)) {
        console.warn(`[FMPService] Parsed quote data for ${symbol} contains NaN price. Quote:`, quote);
        throw new Error(`Invalid price data received from FMP for ${symbol}.`);
    }

    return {
      symbol: quote.symbol,
      price: price,
      // change & changePercent will be calculated in RealtimeStockContext
      dailyVolume: isNaN(dailyVolume) ? undefined : dailyVolume,
      timestamp: isNaN(timestamp) ? Date.now() : timestamp,
      // previousClose is not provided by this FMP endpoint, context will use its stored one
    };

  } catch (error: any) {
    // console.error(`[FMPService] Error in fetchFmpQuote for ${symbol}:`, error.message);
    throw error; // Re-throw to be caught by RealtimeStockContext
  }
}
