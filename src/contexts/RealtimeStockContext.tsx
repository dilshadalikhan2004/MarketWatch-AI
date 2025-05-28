
"use client";
import type { RealtimeStockData, Stock } from '@/lib/types';
import { mockStocks as baseMockStocks } from '@/lib/mock-data';
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
    baseMockStocks.forEach(stock => {
      initialData[stock.symbol] = {
        ...stock, // Includes price, change, changePercent from deterministic mock
        dailyVolume: parseFloat(stock.volume?.replace(/[^0-9.]/g, '') || '0'),
        timestamp: Date.now(),
        previousClose: stock.previousClose
      };
    });
    return initialData;
  });
  const [subscribedSymbols, setSubscribedSymbols] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use a ref for isMounted to avoid it being a dependency in effects that shouldn't re-run on its change
  const isMountedRef = useRef(false);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);


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
    if (!apiKey || apiKey === "YOUR_API_KEY_HERE" || apiKey === "OM1ZC4CCCCKIGT8O_REPLACE_WITH_YOUR_KEY" || apiKey === "OM1ZC4CCCCKIGT8O" || apiKey === "V89R5M3623Z4P7A6" ) {
      const msg = "Alpha Vantage API key is not configured or is a placeholder/demo key. Real-time updates are disabled. Please set NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY in your .env file with a valid key.";
      // console.warn('[StockDataProvider] Configuration Issue:', msg);
      setError(msg);
    } else {
      // console.log('[StockDataProvider] Alpha Vantage API Key loaded.');
      setError(null);
    }
  }, [apiKey]);

  const subscribeToSymbol = useCallback((symbol: string) => {
    setSubscribedSymbols(prev => {
      if (prev.has(symbol)) return prev;
      const newSet = new Set(prev);
      newSet.add(symbol);
      return newSet;
    });
  }, []);

  const unsubscribeFromSymbol = useCallback((symbol: string) => {
    setSubscribedSymbols(prev => {
      const newSet = new Set(prev);
      newSet.delete(symbol);
      return newSet;
    });
  }, []);

  const refreshStockData = useCallback(async (symbolsToRefreshInput?: string[] | string) => {
    if (!apiKey || apiKey === "YOUR_API_KEY_HERE" || apiKey === "OM1ZC4CCCCKIGT8O_REPLACE_WITH_YOUR_KEY" || apiKey === "OM1ZC4CCCCKIGT8O" || apiKey === "V89R5M3623Z4P7A6") {
      const msg = "Alpha Vantage API key is not configured or is a placeholder/demo key. Real-time updates are disabled. Please set NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY in your .env file with a valid key.";
      // Only set error if it's not already this specific message to avoid loops
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

    if (symbolsToFetchArray.length === 0) return;

    setIsLoading(true);
    // setError(null); // Clear previous non-config errors if needed - this might cause issues if an error just occurred

    const promises = symbolsToFetchArray.map(async (symbol) => {
      try {
        const quoteData = await fetchAlphaVantageQuote(symbol, apiKey);
        const currentSymbolData = stockDataRef.current[symbol]; // Use ref for current data
        // Fetch base details (name, logo, chartData) only if not already present
        const baseDetails = (currentSymbolData && currentSymbolData.name) ? currentSymbolData : await fetchInitialStockDetails(symbol);

        if (quoteData) {
          setStockData(prevData => {
            const updatedStock: RealtimeStockData = {
              symbol: symbol, // Ensure symbol is always from the request
              name: baseDetails?.name || prevData[symbol]?.name || symbol,
              logoUrl: baseDetails?.logoUrl || prevData[symbol]?.logoUrl,
              dataAiHint: baseDetails?.dataAiHint || prevData[symbol]?.dataAiHint,
              chartData: baseDetails?.chartData || prevData[symbol]?.chartData || [],
              price: quoteData.price ?? prevData[symbol]?.price ?? baseDetails?.price ?? 0,
              change: quoteData.change ?? prevData[symbol]?.change ?? baseDetails?.change ?? 0,
              changePercent: quoteData.changePercent ?? prevData[symbol]?.changePercent ?? baseDetails?.changePercent ?? 0,
              volume: quoteData.volume ?? prevData[symbol]?.volume ?? baseDetails?.volume,
              dailyVolume: quoteData.dailyVolume ?? prevData[symbol]?.dailyVolume,
              timestamp: quoteData.timestamp ?? Date.now(),
              previousClose: quoteData.previousClose ?? prevData[symbol]?.previousClose ?? baseDetails?.previousClose,
              marketCap: baseDetails?.marketCap || prevData[symbol]?.marketCap,
              avgVolume: baseDetails?.avgVolume || prevData[symbol]?.avgVolume,
              peRatio: baseDetails?.peRatio || prevData[symbol]?.peRatio,
              high52Week: baseDetails?.high52Week || prevData[symbol]?.high52Week,
              low52Week: baseDetails?.low52Week || prevData[symbol]?.low52Week,
            };
            return { ...prevData, [symbol]: updatedStock };
          });
        } else {
          // console.warn(`[StockDataProvider] No quote data returned for ${symbol}. It might be an invalid symbol or API issue.`);
        }
      } catch (err: any) {
        console.warn(`[StockDataProvider] Error refreshing data for ${symbol}:`, err.message);
        // More specific error handling for API limit messages
        if (err.message.toLowerCase().includes("api call frequency is") || err.message.toLowerCase().includes("rate limit") || err.message.toLowerCase().includes("requests per day")) {
             setError(prevError => {
                const newErrorMessage = `API limit likely reached for ${symbol}. ${err.message}`;
                return prevError && prevError.includes("API limit") ? prevError : `${prevError ? prevError + '; ' : ''}${newErrorMessage}`;
            });
        } else if (err.message.includes("API key is not configured")) {
             setError(err.message); // Propagate this specific error
        } else {
            setError(prevError => {
                const newErrorMessage = `Failed to fetch ${symbol}. ${err.message}`;
                // Avoid adding duplicate messages for the same symbol
                return prevError && prevError.includes(`Failed to fetch ${symbol}`) ? prevError : `${prevError ? prevError + '; ' : ''}${newErrorMessage}`;
            });
        }
      }
    });

    try {
        await Promise.allSettled(promises);
    } finally {
        setIsLoading(false);
    }
  }, [apiKey, error]); // Keep 'error' if it's used to prevent re-fetching on existing API config error

  // Effect to refresh data when subscribed symbols change
  useEffect(() => {
    const symbolsArray = Array.from(subscribedSymbolsRef.current); // Use ref here
    if (isMountedRef.current && symbolsArray.length > 0) {
      refreshStockData(symbolsArray);
    }
  }, [subscribedSymbols, refreshStockData]); // refreshStockData is now more stable

  return (
    <RealtimeStockContext.Provider value={{ stockData, subscribedSymbols, subscribeToSymbol, unsubscribeFromSymbol, refreshStockData, isLoading, error }}>
      {children}
    </RealtimeStockContext.Provider>
  );
};
