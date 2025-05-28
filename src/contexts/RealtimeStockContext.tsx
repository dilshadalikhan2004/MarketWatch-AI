
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

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const [apiKey, setApiKey] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Ensure API key is loaded client-side to avoid hydration issues with process.env
    // and to make it available for dependencies.
    const key = process.env.NEXT_PUBLIC_FMP_API_KEY;
    setApiKey(key);
    if (!key || key === "YOUR_FMP_API_KEY_HERE") {
      const msg = "FinancialModelingPrep API key is not configured or is a placeholder. Real-time updates are disabled. Please set NEXT_PUBLIC_FMP_API_KEY in your .env file with a valid key.";
      if (!error?.startsWith("FinancialModelingPrep API key is not configured")) {
        setError(msg);
      }
    } else {
      if (error?.startsWith("FinancialModelingPrep API key is not configured")) {
        setError(null);
      }
    }
  }, [error]); // Re-check if error was related to API key config

  const stockDataRef = useRef(stockData);
  const subscribedSymbolsRef = useRef(subscribedSymbols);
  const errorRef = useRef(error);

  useEffect(() => {
    stockDataRef.current = stockData;
  }, [stockData]);

  useEffect(() => {
    subscribedSymbolsRef.current = subscribedSymbols;
  }, [subscribedSymbols]);

  useEffect(() => {
    errorRef.current = error;
  }, [error]);


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
    if (!isMountedRef.current) return;

    if (!apiKey || apiKey === "YOUR_FMP_API_KEY_HERE") {
      const msg = "FinancialModelingPrep API key is not configured or is a placeholder. Real-time updates are disabled. Please set NEXT_PUBLIC_FMP_API_KEY in your .env file with a valid key.";
       if (errorRef.current !== msg) { // Avoid redundant setError calls
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
        // console.log('[StockDataProvider] All requested symbols are already being fetched or no new symbols.');
        // If no *new* symbols to fetch, but other requests might complete, we might still be loading
        // Consider not setting isLoading to false here unless ongoingRequestsRef is also empty.
        if (ongoingRequestsRef.current.size === 0) setIsLoading(false);
        return;
    }

    setIsLoading(true);
    newRequests.forEach(s => ongoingRequestsRef.current.add(s));
    // console.log(`[StockDataProvider] Refreshing data for symbols: ${newRequests.join(', ')}. Ongoing: ${Array.from(ongoingRequestsRef.current).join(', ')}`);


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

        if (quoteData && quoteData.price !== undefined) {
          const previousClose = baseDetails?.previousClose ?? quoteData.price;
          let change = 0;
          let changePercent = 0;
          if (typeof previousClose === 'number' && previousClose !== 0) {
              change = quoteData.price - previousClose;
              changePercent = change / previousClose;
          }

          setStockData(prevData => {
            const updatedStock: RealtimeStockData = {
              symbol: symbol,
              name: baseDetails?.name || prevData[symbol]?.name || symbol,
              logoUrl: baseDetails?.logoUrl || prevData[symbol]?.logoUrl,
              dataAiHint: baseDetails?.dataAiHint || prevData[symbol]?.dataAiHint,
              chartData: baseDetails?.chartData || prevData[symbol]?.chartData || [],
              price: quoteData.price,
              change: change,
              changePercent: changePercent,
              dailyVolume: quoteData.dailyVolume ?? prevData[symbol]?.dailyVolume,
              timestamp: quoteData.timestamp ?? Date.now(),
              previousClose: previousClose,
              marketCap: baseDetails?.marketCap || prevData[symbol]?.marketCap,
              avgVolume: baseDetails?.avgVolume || prevData[symbol]?.avgVolume,
              peRatio: baseDetails?.peRatio || prevData[symbol]?.peRatio,
              high52Week: baseDetails?.high52Week || prevData[symbol]?.high52Week,
              low52Week: baseDetails?.low52Week || prevData[symbol]?.low52Week,
            };
            return { ...prevData, [symbol]: updatedStock };
          });
        } else {
          // console.warn(`[StockDataProvider] No quote data returned for ${symbol} from FMP.`);
        }
      } catch (err: any) {
        // console.warn(`[StockDataProvider] Error refreshing data for ${symbol}:`, err.message);
        if (err.message.includes("API call frequency is") || err.message.includes("API rate limit") || err.message.includes("limit reached") ) {
             const newErrorMessage = `API limit likely reached for ${symbol}. ${err.message}`;
             setError(prevError => prevError && prevError.includes(newErrorMessage.substring(0,30)) ? prevError : `${prevError ? prevError + '; ' : ''}${newErrorMessage}`);
        } else if (err.message.includes("API key is not configured")) {
             setError(err.message);
        } else {
             const newErrorMessage = `Failed to fetch ${symbol}. ${err.message}`;
             setError(prevError => prevError && prevError.includes(newErrorMessage.substring(0,30)) ? prevError : `${prevError ? prevError + '; ' : ''}${newErrorMessage}`);
        }
      } finally {
        ongoingRequestsRef.current.delete(symbol);
      }
    });

    try {
        await Promise.allSettled(promises);
    } finally {
        if (isMountedRef.current && ongoingRequestsRef.current.size === 0) {
            setIsLoading(false);
        }
    }
  }, [apiKey]); // Only apiKey as primary dependency for function stability

  useEffect(() => {
    // This effect is for initial load or when API key becomes available
    // and there are already subscribed symbols (e.g. from localStorage persistence)
    if (isMountedRef.current && apiKey && apiKey !== "YOUR_FMP_API_KEY_HERE") {
      const currentSubscribed = Array.from(subscribedSymbolsRef.current);
      if (currentSubscribed.length > 0 && ongoingRequestsRef.current.size === 0) {
        // console.log('[StockDataProvider] Context Mount/API Key Ready: Triggering refresh for existing subscriptions:', currentSubscribed);
        refreshStockData(currentSubscribed);
      } else if (currentSubscribed.length === 0 && ongoingRequestsRef.current.size === 0) {
        setIsLoading(false);
      }
    }
  }, [apiKey, refreshStockData]); // Runs when apiKey changes or refreshStockData reference changes (which is rare now)


  return (
    <RealtimeStockContext.Provider value={{ stockData, subscribedSymbols, subscribeToSymbol, unsubscribeFromSymbol, refreshStockData, isLoading, error }}>
      {children}
    </RealtimeStockContext.Provider>
  );
};

