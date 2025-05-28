
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
        timestamp: Date.now()
      };
    });
    // console.log('[StockDataProvider] Initialized stockData with mock data.');
    return initialData;
  });
  const [subscribedSymbols, setSubscribedSymbols] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const msg = "Alpha Vantage API key is not configured or is a placeholder. Real-time updates are disabled. Please set NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY in your .env file.";
      console.warn('[StockDataProvider] Configuration Issue:', msg);
      setError(msg);
    } else {
      console.log('[StockDataProvider] Alpha Vantage API Key loaded.');
      setError(null); 
    }
  }, [apiKey]);

  const subscribeToSymbol = useCallback((symbol: string) => {
    setSubscribedSymbols(prev => {
      if (prev.has(symbol)) return prev;
      const newSet = new Set(prev);
      newSet.add(symbol);
      // console.log('[StockDataProvider] Subscribed to symbol:', symbol, 'Current subscriptions:', Array.from(newSet));
      return newSet;
    });
  }, []);

  const unsubscribeFromSymbol = useCallback((symbol: string) => {
    setSubscribedSymbols(prev => {
      const newSet = new Set(prev);
      if (newSet.delete(symbol)) {
        // console.log('[StockDataProvider] Unsubscribed from symbol:', symbol, 'Current subscriptions:', Array.from(newSet));
      }
      return newSet;
    });
  }, []);

  const refreshStockData = useCallback(async (symbolsToRefreshInput?: string[] | string) => {
    if (!apiKey || apiKey === "YOUR_API_KEY_HERE" || apiKey === "OM1ZC4CCCCKIGT8O_REPLACE_WITH_YOUR_KEY") {
      const msg = "Alpha Vantage API key is not configured. Real-time updates are disabled. Please set NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY in your .env file.";
      if (!error?.includes("API key is not configured")) {
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
      // console.log('[StockDataProvider] No symbols to refresh.');
      return;
    }

    // console.log('[StockDataProvider] Refreshing data for symbols:', symbolsToFetchArray.join(', '));
    setIsLoading(true);
    // setError(null); // Clear previous non-config errors if needed, or be selective

    const promises = symbolsToFetchArray.map(async (symbol) => {
      try {
        const quoteData = await fetchAlphaVantageQuote(symbol, apiKey);
        const currentSymbolData = stockDataRef.current[symbol];
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
              chartData: baseDetails?.chartData || prevData[symbol]?.chartData || [],
              previousClose: quoteData.previousClose ?? baseDetails?.previousClose ?? prevData[symbol]?.previousClose,
            };
            return { ...prevData, [symbol]: updatedStock };
          });
        } else {
           console.warn(`[StockDataProvider] No quote data returned for ${symbol}. It might be an invalid symbol or API issue.`);
        }
      } catch (err: any) {
        console.warn(`[StockDataProvider] Error refreshing data for ${symbol}:`, err.message);
        if (err.message.includes("API key is not configured")) {
             setError(err.message);
        } else if (err.message.toLowerCase().includes("api call frequency") || err.message.toLowerCase().includes("rate limit") || err.message.includes("25 requests per day")) {
             setError(prevError => {
                const newErrorMessage = `API limit likely reached. ${err.message}`;
                return prevError && prevError.includes("API limit") ? prevError : `${prevError ? prevError + '; ' : ''}${newErrorMessage}`;
            });
        } else {
            setError(prevError => {
                const newErrorMessage = `Failed to fetch ${symbol}. ${err.message}`;
                return prevError && prevError.includes(`Failed to fetch ${symbol}`) ? prevError : `${prevError ? prevError + '; ' : ''}${newErrorMessage}`;
            });
        }
      }
    });

    try {
        await Promise.allSettled(promises);
    } finally {
        setIsLoading(false);
        // console.log('[StockDataProvider] Finished refreshing data cycle.');
    }
  }, [apiKey, error]); // stockData and subscribedSymbols are accessed via refs

  return (
    <RealtimeStockContext.Provider value={{ stockData, subscribedSymbols, subscribeToSymbol, unsubscribeFromSymbol, refreshStockData, isLoading, error }}>
      {children}
    </RealtimeStockContext.Provider>
  );
};
