
"use client";
import type { RealtimeStockData } from '@/lib/types';
import { mockStocks } from '@/lib/mock-data';
import { fetchAlphaVantageQuote, fetchInitialStockDetails } from '@/services/stock-api-service';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface RealtimeStockContextState {
  stockData: Record<string, RealtimeStockData>;
  subscribedSymbols: Set<string>;
  subscribeToSymbol: (symbol: string) => void;
  unsubscribeFromSymbol: (symbol: string) => void;
  refreshStockData: (symbolsToRefresh?: string[] | string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const RealtimeStockContext = createContext<RealtimeStockContextState | undefined>(undefined);

export const useRealtimeStockData = () => {
  const context = useContext(RealtimeStockContext);
  if (!context) {
    throw new Error('useRealtimeStockData must be used within a RealtimeStockProvider');
  }
  return context;
};

interface RealtimeStockProviderProps {
  children: ReactNode;
}

export const RealtimeStockProvider: React.FC<RealtimeStockProviderProps> = ({ children }) => {
  const [stockData, setStockData] = useState<Record<string, RealtimeStockData>>(() => {
    const initialData: Record<string, RealtimeStockData> = {};
    mockStocks.forEach(stock => {
      initialData[stock.symbol] = { ...stock, dailyVolume: parseFloat(stock.volume?.replace(/[^0-9.]/g, '') || '0') };
    });
    console.log('[StockDataProvider] Initialized stockData with mock data:', initialData);
    return initialData;
  });
  const [subscribedSymbols, setSubscribedSymbols] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey] = useState(process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY);

  const subscribeToSymbol = useCallback((symbol: string) => {
    setSubscribedSymbols(prev => {
      if (prev.has(symbol)) return prev;
      const newSet = new Set(prev);
      newSet.add(symbol);
      console.log('[StockDataProvider] Added to subscription queue:', symbol, 'New set:', Array.from(newSet));
      // Optionally trigger a fetch for the newly subscribed symbol
      // refreshStockData([symbol]); // Be mindful of rate limits if called too often
      return newSet;
    });
  }, []);

  const unsubscribeFromSymbol = useCallback((symbol: string) => {
    setSubscribedSymbols(prev => {
      const newSet = new Set(prev);
      if (newSet.delete(symbol)) {
        console.log('[StockDataProvider] Removed from subscription queue:', symbol, 'New set:', Array.from(newSet));
      }
      return newSet;
    });
  }, []);

  const refreshStockData = useCallback(async (symbolsToRefreshInput?: string[] | string) => {
    if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
      const msg = "Alpha Vantage API key is not configured. Real-time updates are disabled. Please set NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY in your .env file and restart the server.";
      console.error(msg);
      setError(msg);
      setIsLoading(false);
      return;
    }
    
    let symbolsToFetchArray: string[];
    if (typeof symbolsToRefreshInput === 'string') {
      symbolsToFetchArray = [symbolsToRefreshInput];
    } else if (Array.isArray(symbolsToRefreshInput)) {
      symbolsToFetchArray = symbolsToRefreshInput;
    } else {
      symbolsToFetchArray = Array.from(subscribedSymbols);
    }

    if (symbolsToFetchArray.length === 0) {
      console.log('[StockDataProvider] No symbols to refresh.');
      return;
    }

    console.log('[StockDataProvider] Refreshing data for symbols:', symbolsToFetchArray.join(', '));
    setIsLoading(true);
    setError(null);

    const promises = symbolsToFetchArray.map(async (symbol) => {
      try {
        const quoteData = await fetchAlphaVantageQuote(symbol, apiKey);
        // Fetch initial details if not already present or to supplement quote
        const baseDetails = stockData[symbol] || await fetchInitialStockDetails(symbol);

        if (quoteData) {
          setStockData(prevData => {
            const updatedStock: RealtimeStockData = {
              ...(baseDetails || {}), // Start with base details (name, logo, chartData etc.)
              ...prevData[symbol],    // Overlay with existing data in state
              ...quoteData,           // Overlay with new quote data
              symbol: symbol,         // Ensure symbol is correctly set
              name: baseDetails?.name || prevData[symbol]?.name || symbol,
              logoUrl: baseDetails?.logoUrl || prevData[symbol]?.logoUrl,
              dataAiHint: baseDetails?.dataAiHint || prevData[symbol]?.dataAiHint,
              chartData: baseDetails?.chartData || prevData[symbol]?.chartData || [],
            };
             console.log(`[StockDataProvider] Updating state for ${symbol} with:`, updatedStock);
            return { ...prevData, [symbol]: updatedStock };
          });
        } else {
          console.warn(`[StockDataProvider] No quote data returned for ${symbol}. It might be an invalid symbol or API issue.`);
          // Optionally, set an error for this specific symbol or leave it as is
        }
      } catch (err: any) {
        console.error(`[StockDataProvider] Error refreshing data for ${symbol}:`, err.message);
        // Set a general error, or per-symbol error if your state supports it
        setError(prevError => `${prevError ? prevError + '; ' : ''}Failed to fetch ${symbol}: ${err.message}`);
      }
    });

    try {
        await Promise.allSettled(promises); // Use allSettled to wait for all fetches, even if some fail
    } finally {
        setIsLoading(false);
        console.log('[StockDataProvider] Finished refreshing data cycle.');
    }

  }, [apiKey, subscribedSymbols, stockData]); // Include stockData to access baseDetails if needed

  // Example: Fetch data for all subscribed symbols when the component mounts (optional)
  // Be very careful with this due to Alpha Vantage rate limits.
  // Consider if this initial fetch is necessary or if components should trigger it.
  /*
  useEffect(() => {
    if (subscribedSymbols.size > 0 && apiKey && apiKey !== "YOUR_API_KEY_HERE") {
      console.log("[StockDataProvider] Initial mount: refreshing all subscribed symbols.");
      refreshStockData(Array.from(subscribedSymbols));
    }
  }, [apiKey]); // Only run when apiKey is available, subscribedSymbols changes are handled by components
  */

  return (
    <RealtimeStockContext.Provider value={{ stockData, subscribedSymbols, subscribeToSymbol, unsubscribeFromSymbol, refreshStockData, isLoading, error }}>
      {children}
    </RealtimeStockContext.Provider>
  );
};
