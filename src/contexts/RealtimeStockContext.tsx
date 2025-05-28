
"use client";
import type { RealtimeStockData, Stock } from '@/lib/types';
import { mockStocks } from '@/lib/mock-data';
import { fetchAlphaVantageQuote, fetchInitialStockDetails } from '@/services/stock-api-service';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';

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
      initialData[stock.symbol] = { 
        ...stock, 
        dailyVolume: parseFloat(stock.volume?.replace(/[^0-9.]/g, '') || '0'),
        timestamp: Date.now() // Add a timestamp for initial mock data
      };
    });
    console.log('[StockDataProvider] Initialized stockData with mock data:', initialData);
    return initialData;
  });
  const [subscribedSymbols, setSubscribedSymbols] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use NEXT_PUBLIC_ prefix if the key needs to be accessible on the client (not recommended for sensitive keys)
  // For Alpha Vantage, if calls are made server-side (e.g. via Server Actions or API routes), no prefix is needed.
  // If calls are client-side (like in this context), it needs NEXT_PUBLIC_
  const [apiKey] = useState(process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY);

  const stockDataRef = useRef(stockData);
  const subscribedSymbolsRef = useRef(subscribedSymbols);

  useEffect(() => {
    stockDataRef.current = stockData;
  }, [stockData]);

  useEffect(() => {
    subscribedSymbolsRef.current = subscribedSymbols;
  }, [subscribedSymbols]);

  useEffect(() => {
    if (!apiKey || apiKey === "YOUR_API_KEY_HERE" || apiKey === "OM1ZC4CCCCKIGT8O_REPLACE_WITH_YOUR_KEY") {
      console.warn('[StockDataProvider] Alpha Vantage API key is not configured or is a placeholder. Real-time updates are disabled. Please set NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY in your .env file.');
      setError("Alpha Vantage API key is not configured. Real-time updates are disabled.");
    } else {
      console.log('[StockDataProvider] Alpha Vantage API Key loaded successfully.');
      setError(null); // Clear any initial config error
    }
  }, [apiKey]);

  const subscribeToSymbol = useCallback((symbol: string) => {
    setSubscribedSymbols(prev => {
      if (prev.has(symbol)) return prev;
      const newSet = new Set(prev);
      newSet.add(symbol);
      console.log('[StockDataProvider] Subscribed to symbol:', symbol, 'Current subscriptions:', Array.from(newSet));
      return newSet;
    });
  }, []);

  const unsubscribeFromSymbol = useCallback((symbol: string) => {
    setSubscribedSymbols(prev => {
      const newSet = new Set(prev);
      if (newSet.delete(symbol)) {
        console.log('[StockDataProvider] Unsubscribed from symbol:', symbol, 'Current subscriptions:', Array.from(newSet));
      }
      return newSet;
    });
  }, []);

  const refreshStockData = useCallback(async (symbolsToRefreshInput?: string[] | string) => {
    if (!apiKey || apiKey === "YOUR_API_KEY_HERE" || apiKey === "OM1ZC4CCCCKIGT8O_REPLACE_WITH_YOUR_KEY") {
      const msg = "Alpha Vantage API key is not configured. Real-time updates are disabled. Please set NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY in your .env file.";
      // setError(msg) is handled in useEffect now for initial config check
      // For ongoing refreshes, we check here:
      if (!error?.includes("API key is not configured")) { // Avoid duplicate error messages
        setError(msg);
      }
      setIsLoading(false);
      return;
    }
    
    let symbolsToFetchArray: string[];
    if (typeof symbolsToRefreshInput === 'string') {
      symbolsToFetchArray = [symbolsToRefreshInput];
    } else if (Array.isArray(symbolsToRefreshInput)) {
      symbolsToFetchArray = symbolsToRefreshInput;
    } else {
      symbolsToFetchArray = Array.from(subscribedSymbolsRef.current);
    }

    if (symbolsToFetchArray.length === 0) {
      console.log('[StockDataProvider] No symbols to refresh.');
      return;
    }

    console.log('[StockDataProvider] Refreshing data for symbols:', symbolsToFetchArray.join(', '));
    setIsLoading(true);
    // setError(null); // Clear previous errors before new fetch attempt

    const promises = symbolsToFetchArray.map(async (symbol) => {
      try {
        const quoteData = await fetchAlphaVantageQuote(symbol, apiKey);
        const currentSymbolData = stockDataRef.current[symbol];
        // Fetch initial details only if we don't have them or if quote data is sparse
        const baseDetails = (currentSymbolData && currentSymbolData.name) ? currentSymbolData : await fetchInitialStockDetails(symbol);

        if (quoteData) {
          setStockData(prevData => {
            const updatedStock: RealtimeStockData = {
              ...(baseDetails || {}), 
              ...prevData[symbol],    
              ...quoteData,          
              symbol: symbol,         
              name: baseDetails?.name || prevData[symbol]?.name || symbol,
              logoUrl: baseDetails?.logoUrl || prevData[symbol]?.logoUrl,
              dataAiHint: baseDetails?.dataAiHint || prevData[symbol]?.dataAiHint,
              chartData: baseDetails?.chartData || prevData[symbol]?.chartData || prevData[symbol]?.price === undefined ? (baseDetails?.chartData || []) : (prevData[symbol]?.chartData || []),
              // Ensure previousClose is carried over if not in quoteData (it usually is)
              previousClose: quoteData.previousClose ?? baseDetails?.previousClose ?? prevData[symbol]?.previousClose,
            };
            // console.log(`[StockDataProvider] Updating state for ${symbol} with:`, updatedStock);
            return { ...prevData, [symbol]: updatedStock };
          });
        } else {
          console.warn(`[StockDataProvider] No quote data returned for ${symbol}. It might be an invalid symbol or API issue.`);
           // Keep existing data if API returns null for this symbol to avoid "N/A" wiping out old data.
           // However, we should probably signal an error for this specific symbol.
        }
      } catch (err: any) {
        console.warn(`[StockDataProvider] Error refreshing data for ${symbol}:`, err.message); // Changed to console.warn
        if (err.message.includes("API key is not configured")) {
             setError(err.message); // This specific error is critical and should override others.
        } else if (err.message.toLowerCase().includes("api call frequency") || err.message.toLowerCase().includes("rate limit")) {
             setError(prevError => {
                const newErrorMessage = `API limit likely reached for ${symbol}. Details: ${err.message}`;
                return prevError && prevError.includes(newErrorMessage.substring(0,50)) ? prevError : `${prevError ? prevError + '; ' : ''}${newErrorMessage}`;
            });
        } else {
            setError(prevError => {
                const newErrorMessage = `Failed to fetch ${symbol}. Details: ${err.message}`;
                return prevError && prevError.includes(newErrorMessage.substring(0,50)) ? prevError : `${prevError ? prevError + '; ' : ''}${newErrorMessage}`;
            });
        }
      }
    });

    try {
        await Promise.allSettled(promises); 
    } finally {
        setIsLoading(false);
        console.log('[StockDataProvider] Finished refreshing data cycle.');
    }
  }, [apiKey, error]); // Removed stockData and subscribedSymbols, using refs instead

  return (
    <RealtimeStockContext.Provider value={{ stockData, subscribedSymbols, subscribeToSymbol, unsubscribeFromSymbol, refreshStockData, isLoading, error }}>
      {children}
    </RealtimeStockContext.Provider>
  );
};
