
"use client";
import type { RealtimeStockData, Stock } from '@/lib/types';
import { mockStocks as baseMockStocks } from '@/lib/mock-data';
import { fetchInitialStockDetails, fetchFmpQuote } from '@/services/stock-api-service'; // Updated import
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
        ...stock,
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

  const isMountedRef = useRef(false);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const [apiKey] = useState(process.env.NEXT_PUBLIC_FMP_API_KEY); // Changed to FMP key

  const stockDataRef = useRef(stockData);
  const subscribedSymbolsRef = useRef(subscribedSymbols);

  useEffect(() => {
    stockDataRef.current = stockData;
  }, [stockData]);

  useEffect(() => {
    subscribedSymbolsRef.current = subscribedSymbols;
  }, [subscribedSymbols]);

  useEffect(() => {
    if (!apiKey || apiKey === "YOUR_FMP_API_KEY_HERE" ) { // Changed placeholder check
      const msg = "FinancialModelingPrep API key is not configured or is a placeholder. Real-time updates are disabled. Please set NEXT_PUBLIC_FMP_API_KEY in your .env file with a valid key.";
      // console.warn('[StockDataProvider] Configuration Issue:', msg);
      if (!error?.startsWith("FinancialModelingPrep API key is not configured")) {
        setError(msg);
      }
    } else {
      // console.log('[StockDataProvider] FMP API Key loaded.');
      if (error?.startsWith("FinancialModelingPrep API key is not configured")) {
        setError(null); // Clear config error if key is now valid
      }
    }
  }, [apiKey, error]);

  const subscribeToSymbol = useCallback((symbol: string) => {
    setSubscribedSymbols(prev => {
      if (prev.has(symbol)) return prev;
      const newSet = new Set(prev);
newSet.add(symbol);
      // console.log(`[StockDataProvider] Subscribed to ${symbol}. Current subscriptions:`, Array.from(newSet));
      return newSet;
    });
  }, []);

  const unsubscribeFromSymbol = useCallback((symbol: string) => {
    setSubscribedSymbols(prev => {
      const newSet = new Set(prev);
      newSet.delete(symbol);
      // console.log(`[StockDataProvider] Unsubscribed from ${symbol}. Current subscriptions:`, Array.from(newSet));
      return newSet;
    });
  }, []);

  const refreshStockData = useCallback(async (symbolsToRefreshInput?: string[] | string) => {
    if (!isMountedRef.current) return; // Don't run if component isn't mounted

    if (!apiKey || apiKey === "YOUR_FMP_API_KEY_HERE") {
      const msg = "FinancialModelingPrep API key is not configured or is a placeholder. Real-time updates are disabled. Please set NEXT_PUBLIC_FMP_API_KEY in your .env file with a valid key.";
      if (!error?.startsWith("FinancialModelingPrep API key is not configured")) {
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
        // console.log("[StockDataProvider] No symbols to refresh.");
        setIsLoading(false); // Ensure loading is false if nothing to fetch
        return;
    }

    // console.log("[StockDataProvider] Refreshing data for symbols:", symbolsToFetchArray);
    setIsLoading(true);
    // No need to clear non-config error here, as it might provide context to user
    // if (error && !error.startsWith("FinancialModelingPrep API key is not configured")) setError(null);


    const promises = symbolsToFetchArray.map(async (symbol) => {
      try {
        const quoteData = await fetchFmpQuote(symbol, apiKey); // Use FMP service
        const currentSymbolData = stockDataRef.current[symbol];
        
        // Fetch base details (name, logo, chartData, previousClose) only if not already present or to ensure previousClose is there
        const baseDetails = (currentSymbolData && currentSymbolData.name && currentSymbolData.previousClose !== undefined) 
            ? currentSymbolData 
            : await fetchInitialStockDetails(symbol);

        if (quoteData && quoteData.price !== undefined) {
          setStockData(prevData => {
            const existingData = prevData[symbol] || {};
            const previousClose = existingData.previousClose ?? baseDetails?.previousClose ?? quoteData.price; // Fallback for previousClose
            
            let change = 0;
            let changePercent = 0;
            if (previousClose !== undefined && previousClose !== 0) {
                change = quoteData.price! - previousClose;
                changePercent = change / previousClose;
            }

            const updatedStock: RealtimeStockData = {
              symbol: symbol,
              name: baseDetails?.name || existingData.name || symbol,
              logoUrl: baseDetails?.logoUrl || existingData.logoUrl,
              dataAiHint: baseDetails?.dataAiHint || existingData.dataAiHint,
              chartData: baseDetails?.chartData || existingData.chartData || [],
              price: quoteData.price,
              change: change,
              changePercent: changePercent,
              dailyVolume: quoteData.dailyVolume ?? existingData.dailyVolume,
              timestamp: quoteData.timestamp ?? Date.now(),
              previousClose: previousClose, // Persist previousClose
              marketCap: baseDetails?.marketCap || existingData.marketCap,
              avgVolume: baseDetails?.avgVolume || existingData.avgVolume,
              peRatio: baseDetails?.peRatio || existingData.peRatio,
              high52Week: baseDetails?.high52Week || existingData.high52Week,
              low52Week: baseDetails?.low52Week || existingData.low52Week,
            };
            return { ...prevData, [symbol]: updatedStock };
          });
        } else {
          // console.warn(`[StockDataProvider] No quote data returned for ${symbol} from FMP service.`);
        }
      } catch (err: any) {
        console.warn(`[StockDataProvider] Error refreshing data for ${symbol}:`, err.message);
        // More specific error handling for API limit messages
        if (err.message.toLowerCase().includes("limit") || err.message.toLowerCase().includes("requests per day")) {
             setError(prevError => {
                const newErrorMessage = `API limit likely reached for ${symbol}. ${err.message}`;
                return prevError && prevError.includes("API limit") ? prevError : `${prevError ? prevError + '; ' : ''}${newErrorMessage}`;
            });
        } else if (err.message.includes("API key is not configured")) {
             setError(err.message); // Propagate this specific error
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
        // console.log("[StockDataProvider] Finished refreshing data cycle.");
    } finally {
        if (isMountedRef.current) { // Only update state if component is still mounted
            setIsLoading(false);
        }
    }
  }, [apiKey, error]); // Dependencies for useCallback

  useEffect(() => {
    const symbolsArray = Array.from(subscribedSymbolsRef.current);
    if (isMountedRef.current && symbolsArray.length > 0 && apiKey && apiKey !== "YOUR_FMP_API_KEY_HERE") {
      // console.log("[StockDataProvider] Subscribed symbols changed or API key became available, triggering refresh:", symbolsArray);
      // refreshStockData(symbolsArray); // Commented out to prevent initial auto-fetch on every subscription change
                                      // Data refresh should be more controlled, e.g., on mount or manual trigger
    }
  }, [subscribedSymbols, apiKey]); // Removed refreshStockData from here to avoid loops, it's stable now.

  return (
    <RealtimeStockContext.Provider value={{ stockData, subscribedSymbols, subscribeToSymbol, unsubscribeFromSymbol, refreshStockData, isLoading, error }}>
      {children}
    </RealtimeStockContext.Provider>
  );
};
