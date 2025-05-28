
"use client";
import type { RealtimeStockData, Stock } from '@/lib/types';
import { mockStocks as baseMockStocks } from '@/lib/mock-data';
import { fetchInitialStockDetails, fetchFmpQuote } from '@/services/stock-api-service';
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
        previousClose: stock.previousClose,
      };
    });
    return initialData;
  });
  const [subscribedSymbols, setSubscribedSymbols] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(false);
  const ongoingRequestsRef = useRef(new Set<string>());

  const [apiKey, setApiKey] = useState<string | undefined>(undefined);

  // Refs for stable access within useCallback
  const stockDataRef = useRef(stockData);
  const subscribedSymbolsRef = useRef(subscribedSymbols);
  const errorRef = useRef(error); // To access current error state in callbacks without re-triggering them

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  useEffect(() => {
    stockDataRef.current = stockData;
  }, [stockData]);

  useEffect(() => {
    subscribedSymbolsRef.current = subscribedSymbols;
  }, [subscribedSymbols]);

  useEffect(() => {
    errorRef.current = error;
  }, [error]);


  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_FMP_API_KEY;
    setApiKey(key);
    if (!key || key === "YOUR_FMP_API_KEY_HERE") {
       const msg = "FinancialModelingPrep API key is not configured or is a placeholder. Real-time updates are disabled.";
       if (errorRef.current !== msg) {
            setError(msg);
       }
    } else {
      // Clear the specific API key configuration error if it was set
      if (errorRef.current === "FinancialModelingPrep API key is not configured or is a placeholder. Real-time updates are disabled.") {
        setError(null);
      }
    }
  }, []); // Run once on mount


  const subscribeToSymbol = useCallback((symbol: string) => {
    setSubscribedSymbols(prev => {
      if (prev.has(symbol)) return prev;
      const newSet = new Set(prev);
      newSet.add(symbol);
      // console.log('[StockDataProvider] Subscribed to:', symbol, 'Current subscriptions:', Array.from(newSet));
      return newSet;
    });
  }, []);

  const unsubscribeFromSymbol = useCallback((symbol: string) => {
    setSubscribedSymbols(prev => {
      const newSet = new Set(prev);
      if (newSet.delete(symbol)) {
        // console.log('[StockDataProvider] Unsubscribed from:', symbol, 'Current subscriptions:', Array.from(newSet));
      }
      return newSet;
    });
  }, []);

  const refreshStockData = useCallback(async (symbolsToRefreshInput?: string[] | string) => {
    if (!isMountedRef.current) return;

    if (!apiKey || apiKey === "YOUR_FMP_API_KEY_HERE") {
      const msg = "FMP API key is not configured. Cannot fetch live data.";
      if (errorRef.current !== msg && !errorRef.current?.startsWith("FMP API Error: We have detected your API key as")) {
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
        setIsLoading(false);
        return;
    }
    
    const newRequests = symbolsToFetchArray.filter(s => !ongoingRequestsRef.current.has(s));
    if (newRequests.length === 0) {
        if (ongoingRequestsRef.current.size === 0) setIsLoading(false);
        return;
    }

    setIsLoading(true);
    // Clear only general errors, not specific API key config errors
    if (errorRef.current && !errorRef.current.includes("API key is not configured")) {
        setError(null);
    }
    newRequests.forEach(s => ongoingRequestsRef.current.add(s));
    // console.log(`[StockDataProvider] Refreshing data for symbols: ${newRequests.join(', ')}`);

    const collectiveUpdates: Record<string, RealtimeStockData> = {};
    let collectiveErrorMessages: string[] = [];

    const promises = newRequests.map(async (symbol) => {
      try {
        const quoteData = await fetchFmpQuote(symbol, apiKey);
        
        const baseDetails = stockDataRef.current[symbol] || await fetchInitialStockDetails(symbol) || { 
            symbol, 
            name: symbol, 
            price: 0, 
            change: 0, 
            changePercent: 0, 
            previousClose: 0 
        };

        if (quoteData && typeof quoteData.price === 'number') {
          const currentPrice = quoteData.price;
          const previousClose = baseDetails?.previousClose ?? currentPrice; // Fallback to current if no previous
          
          let change = 0;
          let changePercent = 0;

          if (typeof previousClose === 'number' && previousClose !== 0) {
            change = currentPrice - previousClose;
            changePercent = change / previousClose;
          }

          const updatedStock: RealtimeStockData = {
            symbol: symbol,
            name: baseDetails?.name || stockDataRef.current[symbol]?.name || symbol,
            logoUrl: baseDetails?.logoUrl || stockDataRef.current[symbol]?.logoUrl,
            dataAiHint: baseDetails?.dataAiHint || stockDataRef.current[symbol]?.dataAiHint,
            chartData: baseDetails?.chartData || stockDataRef.current[symbol]?.chartData || [],
            price: currentPrice,
            change: change,
            changePercent: changePercent,
            dailyVolume: quoteData.dailyVolume ?? stockDataRef.current[symbol]?.dailyVolume,
            timestamp: quoteData.timestamp ?? Date.now(),
            previousClose: previousClose,
            marketCap: baseDetails?.marketCap || stockDataRef.current[symbol]?.marketCap,
            avgVolume: baseDetails?.avgVolume || stockDataRef.current[symbol]?.avgVolume,
            peRatio: baseDetails?.peRatio || stockDataRef.current[symbol]?.peRatio,
            high52Week: baseDetails?.high52Week || stockDataRef.current[symbol]?.high52Week,
            low52Week: baseDetails?.low52Week || stockDataRef.current[symbol]?.low52Week,
          };
          collectiveUpdates[symbol] = updatedStock;
        } else {
          // console.warn(`[StockDataProvider] No valid quote data returned for ${symbol} from FMP.`);
        }
      } catch (err: any) {
        // console.warn(`[StockDataProvider] Error refreshing data for ${symbol}:`, err.message);
        collectiveErrorMessages.push(`Error for ${symbol}: ${err.message}`);
      } finally {
        ongoingRequestsRef.current.delete(symbol);
      }
    });

    try {
        await Promise.allSettled(promises);

        if (Object.keys(collectiveUpdates).length > 0) {
          setStockData(prevData => ({
            ...prevData,
            ...collectiveUpdates,
          }));
        }

        if (collectiveErrorMessages.length > 0) {
          const newError = collectiveErrorMessages.join('; ');
          // Append to existing general errors, or set if no critical API key error exists
           if (errorRef.current && errorRef.current.includes("API key is not configured")) {
             // Don't overwrite critical API key config error with transient fetch errors
           } else {
             setError(prevError => prevError ? `${prevError}; ${newError}` : newError);
           }
        }

    } finally {
        if (isMountedRef.current && ongoingRequestsRef.current.size === 0) {
            setIsLoading(false);
            // console.log('[StockDataProvider] Finished refreshing data cycle.');
        }
    }
  }, [apiKey, errorRef, stockDataRef, subscribedSymbolsRef]); // Dependencies are stable refs or stable apiKey

  // Effect to fetch data when subscribed symbols change or API key becomes available
  useEffect(() => {
    if (isMountedRef.current && apiKey && apiKey !== "YOUR_FMP_API_KEY_HERE" && !errorRef.current?.includes("API key is not configured")) {
      const currentSubscribed = Array.from(subscribedSymbolsRef.current); // Use ref for current value
      if (currentSubscribed.length > 0) {
        const symbolsToActuallyFetch = currentSubscribed.filter(s => !ongoingRequestsRef.current.has(s));
        if (symbolsToActuallyFetch.length > 0) {
          // console.log('[StockDataProvider] Subscribed symbols changed or API key ready, fetching for:', symbolsToActuallyFetch);
          refreshStockData(symbolsToActuallyFetch);
        } else if (ongoingRequestsRef.current.size === 0 && isLoading) { // isLoading from state
           // console.log('[StockDataProvider] No new symbols to fetch, and no ongoing requests, ensuring loading is false.');
           setIsLoading(false);
        }
      } else if (currentSubscribed.length === 0 && ongoingRequestsRef.current.size === 0 && isLoading) { // isLoading from state
        // console.log('[StockDataProvider] No subscribed symbols and no ongoing requests, ensuring loading is false.');
        setIsLoading(false);
      }
    }
  // Only re-run if apiKey changes or subscribedSymbols set instance changes
  }, [apiKey, subscribedSymbols, refreshStockData]);


  return (
    <RealtimeStockContext.Provider value={{ stockData, subscribedSymbols, subscribeToSymbol, unsubscribeFromSymbol, refreshStockData, isLoading, error }}>
      {children}
    </RealtimeStockContext.Provider>
  );
};

