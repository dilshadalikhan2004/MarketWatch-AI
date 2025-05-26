
// src/services/stock-api-service.ts
// This file is now less relevant for primary real-time updates if using WebSockets.
// It could be used for fetching initial historical data or detailed company info
// if not provided by the WebSocket stream or if needed on demand.

import type { Stock } from '@/lib/types';
import { mockStocks as baseMockStocks } from '@/lib/mock-data'; 

// Simulate a delay to mimic a real API call for initial/historical data
const API_SIMULATION_DELAY = 300;

// Helper function (can be shared or kept here if specific to this service's formatting)
function formatLargeNumberSimulated(num: number): string {
  if (num === null || num === undefined || isNaN(num)) return 'N/A';
  if (Math.abs(num) < 1_000_000) return num.toLocaleString();
  if (Math.abs(num) < 1_000_000_000) return (num / 1_000_000).toFixed(2) + 'M';
  if (Math.abs(num) < 1_000_000_000_000) return (num / 1_000_000_000).toFixed(2) + 'B';
  return (num / 1_000_000_000_000).toFixed(2) + 'T';
}

/**
 * Fetches (simulated) initial or detailed stock data for a given symbol.
 * This function might be used to populate a stock's details page or to get
 * historical data not covered by the real-time WebSocket stream.
 *
 * TODO: If you need this functionality, replace with actual API call logic
 * to fetch one-time data like company profiles, historical charts, etc.
 */
export async function fetchInitialStockDetails(symbol: string): Promise<Partial<Stock> | null> {
  // --- START MOCK IMPLEMENTATION (Remove/Modify when integrating real API for details) ---
  return new Promise((resolve) => {
    setTimeout(() => {
      const baseStock = baseMockStocks.find(s => s.symbol === symbol);
      if (!baseStock) {
        resolve(null);
        return;
      }
      // Return a subset of data, as if fetching detailed static info
      resolve({
        symbol: baseStock.symbol,
        name: baseStock.name,
        logoUrl: baseStock.logoUrl,
        dataAiHint: baseStock.dataAiHint,
        chartData: baseStock.chartData, // Example: historical chart data
        // Other static fields like PE ratio, 52-week high/low could be fetched here
        peRatio: baseStock.peRatio,
        high52Week: baseStock.high52Week,
        low52Week: baseStock.low52Week,
        marketCap: baseStock.marketCap, // Initial market cap
        avgVolume: baseStock.avgVolume, // Average volume
      });
    }, API_SIMULATION_DELAY);
  });
  // --- END MOCK IMPLEMENTATION ---
}

// The old `fetchRealTimeStockData` that simulated polling is no longer the primary
// mechanism if WebSockets are implemented. It's commented out to avoid confusion.
// Real-time updates should be handled by the WebSocket connection managed in
// RealtimeStockContext.tsx.

/*
export async function fetchRealTimeStockData(symbol: string): Promise<Partial<Stock> | null> {
  // This polling mechanism is superseded by WebSockets.
  // Kept here for reference or if a fallback polling mechanism is desired.
  console.warn("fetchRealTimeStockData (polling) is being called. WebSockets should handle real-time updates.");
  return new Promise((resolve) => {
    setTimeout(() => {
      const baseStock = baseMockStocks.find(s => s.symbol === symbol);
      if (!baseStock) {
        resolve(null);
        return;
      }
      const priceFluctuation = (Math.random() - 0.5) * (baseStock.price * 0.02);
      const newPrice = parseFloat((baseStock.price + priceFluctuation).toFixed(2));
      const oldPriceForChangeCalc = baseStock.price;
      const newChange = parseFloat((newPrice - oldPriceForChangeCalc).toFixed(2));
      const newChangePercent = oldPriceForChangeCalc !== 0 ? parseFloat((newChange / oldPriceForChangeCalc).toFixed(4)) : 0;
      const newVolume = Math.floor(parseFloat(baseStock.volume?.replace(/[^0-9.]/g, '') || '0') * (0.9 + Math.random() * 0.2));
      const newMarketCap = Math.floor(parseFloat(baseStock.marketCap?.replace(/[^0-9BMT]/g, '') || '0') * (1 + (newChangePercent / 100)) * 1_000_000_000);

      resolve({
        price: newPrice,
        change: newChange,
        changePercent: newChangePercent,
        volume: formatLargeNumberSimulated(newVolume),
        marketCap: formatLargeNumberSimulated(newMarketCap),
      });
    }, 500); // Reduced delay as it's less critical now
  });
}
*/
