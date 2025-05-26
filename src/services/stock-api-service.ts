
// src/services/stock-api-service.ts
'use server'; // Mark this if you intend to call it from Server Actions directly,
              // or remove if it's only called from other server-side code like `getUpdatedMockStocks`.
              // For now, `getUpdatedMockStocks` is client-side due to `useEffect`, so this module won't be 'use server'.
              // If `getUpdatedMockStocks` was a server action, then this could be 'use server'.

import type { Stock } from '@/lib/types';
import { mockStocks as baseMockStocks } from '@/lib/mock-data'; // For base data

// Simulate a delay to mimic a real API call
const API_SIMULATION_DELAY = 500; // 0.5 seconds

// Helper function from mock-data.ts (or define it here if preferred)
function formatLargeNumberSimulated(num: number): string {
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


/**
 * Fetches (simulated) real-time stock data for a given symbol.
 * TODO: Replace this with actual API call logic.
 */
export async function fetchRealTimeStockData(symbol: string): Promise<Partial<Stock> | null> {
  // TODO: Replace with your chosen financial API integration.
  // 1. Get your API key. Store it securely, e.g., in .env.local
  //    const apiKey = process.env.NEXT_PUBLIC_FINANCIAL_API_KEY;
  //    if (!apiKey) {
  //      console.error("Financial API key is not set.");
  //      return null;
  //    }
  //
  // 2. Construct the API URL for the given symbol.
  //    const apiUrl = `https://api.example.com/stock/${symbol}/quote?apikey=${apiKey}`;
  //
  // 3. Fetch data from the API.
  //    try {
  //      const response = await fetch(apiUrl);
  //      if (!response.ok) {
  //        console.error(`API request failed for ${symbol}: ${response.statusText}`);
  //        return null;
  //      }
  //      const data = await response.json();
  //
  // 4. Parse the API response and map it to Partial<Stock> format.
  //    Example mapping (highly dependent on your API's response structure):
  //    return {
  //      price: data.latestPrice,
  //      change: data.change,
  //      changePercent: data.changePercent,
  //      marketCap: formatLargeNumberSimulated(data.marketCap), // Ensure formatting matches
  //      volume: formatLargeNumberSimulated(data.volume),
  //      // Potentially add updated chartData here if your API provides it
  //    };
  //    } catch (error) {
  //      console.error(`Error fetching real time data for ${symbol}:`, error);
  //      return null;
  //    }

  // --- START MOCK IMPLEMENTATION (Remove when integrating real API) ---
  return new Promise((resolve) => {
    setTimeout(() => {
      const baseStock = baseMockStocks.find(s => s.symbol === symbol);
      if (!baseStock) {
        resolve(null);
        return;
      }

      // Simulate some price fluctuation for the mock data
      const priceFluctuation = (Math.random() - 0.5) * (baseStock.price * 0.02); // +/- 2%
      const newPrice = parseFloat((baseStock.price + priceFluctuation).toFixed(2));
      const oldPriceForChangeCalc = baseStock.price; // Or a "previous close" if available
      
      const newChange = parseFloat((newPrice - oldPriceForChangeCalc).toFixed(2));
      const newChangePercent = oldPriceForChangeCalc !== 0 ? parseFloat((newChange / oldPriceForChangeCalc).toFixed(4)) : 0;
      
      const newVolume = Math.floor(parseFloat(baseStock.volume?.replace(/[^0-9.]/g, '') || '0') * (0.9 + Math.random() * 0.2));
      const newMarketCap = Math.floor(parseFloat(baseStock.marketCap?.replace(/[^0-9BMT]/g, '') || '0') * (1 + (newChangePercent / 100)) * 1_000_000_000); // Simplistic market cap update

      resolve({
        price: newPrice,
        change: newChange,
        changePercent: newChangePercent,
        volume: formatLargeNumberSimulated(newVolume),
        marketCap: formatLargeNumberSimulated(newMarketCap),
        // Note: Chart data isn't updated here in this mock, it uses initial from baseMockStocks
      });
    }, API_SIMULATION_DELAY);
  });
  // --- END MOCK IMPLEMENTATION ---
}
