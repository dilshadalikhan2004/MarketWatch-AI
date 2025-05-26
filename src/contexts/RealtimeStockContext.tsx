
"use client";
import type { Stock, RealtimeStockData } from '@/lib/types';
import { mockStocks } from '@/lib/mock-data'; // For initial static data
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface RealtimeStockContextState {
  stockData: Record<string, RealtimeStockData>;
  subscribedSymbols: Set<string>;
  subscribeToSymbol: (symbol: string) => void;
  unsubscribeFromSymbol: (symbol: string) => void;
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
      initialData[stock.symbol] = { ...stock };
    });
    console.log('[RealtimeStockContext] Initialized stockData with mock data:', initialData);
    return initialData;
  });
  const [subscribedSymbols, setSubscribedSymbols] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiKey] = useState(process.env.NEXT_PUBLIC_POLYGON_API_KEY);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    console.log('[RealtimeStockContext] useEffect triggered. Subscribed symbols:', Array.from(subscribedSymbols), 'API Key available:', !!apiKey);

    if (!apiKey) {
      const errorMessage = "CRITICAL: Polygon API key (NEXT_PUBLIC_POLYGON_API_KEY) is not configured or not loaded. Real-time updates are disabled.";
      console.error(errorMessage, "Please ensure the key is in your .env file and the Next.js server was restarted.");
      setError(errorMessage);
      setIsLoading(false);
      setIsAuthenticated(false);
      return;
    }

    if (subscribedSymbols.size === 0) {
      console.log('[RealtimeStockContext] No symbols to subscribe to. WebSocket will not connect yet.');
      setIsLoading(false); // Not loading if there's nothing to do
      setIsAuthenticated(false);
      // Optionally, you could close an existing ws here if desired, but new connection logic handles it
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsAuthenticated(false); // Reset auth state on new connection attempt

    console.log(`[RealtimeStockContext] Attempting to connect to WebSocket for symbols: ${Array.from(subscribedSymbols).join(', ')}`);
    const ws = new WebSocket('wss://socket.polygon.io/stocks');

    ws.onopen = () => {
      console.log('[RealtimeStockContext] WebSocket connected to Polygon.io. Sending auth...');
      ws.send(JSON.stringify({ action: 'auth', params: apiKey }));
    };

    ws.onmessage = (event) => {
      console.log('[RealtimeStockContext] WebSocket message received:', event.data);
      try {
        const messages = JSON.parse(event.data as string);
        (Array.isArray(messages) ? messages : [messages]).forEach(msg => {
          if (msg.ev === 'status') {
            console.log(`[RealtimeStockContext] Polygon status message: ${msg.message} (Status: ${msg.status})`);
            if (msg.status === 'auth_success') {
              setIsAuthenticated(true);
              console.log('[RealtimeStockContext] WebSocket authentication successful.');
              // Now subscribe to symbols
              const symbolsToSubscribeString = Array.from(subscribedSymbols).map(s => `AM.${s}`).join(',');
              if (symbolsToSubscribeString) {
                ws.send(JSON.stringify({ action: 'subscribe', params: symbolsToSubscribeString }));
                console.log(`[RealtimeStockContext] Sent subscription request for minute aggregates: ${symbolsToSubscribeString}`);
              } else {
                console.log('[RealtimeStockContext] Authenticated, but no symbols currently in subscribedSymbols set to send.');
              }
            } else if (msg.status === 'auth_failed') {
              setError('Polygon WebSocket authentication failed. Please check your API key, subscription, or network connection.');
              setIsAuthenticated(false);
              setIsLoading(false);
              ws.close(); // Close connection on auth failure
            } else if (msg.status === 'success' && msg.message?.startsWith('subscribed to')) {
              console.log(`[RealtimeStockContext] Successfully subscribed to: ${msg.message}`);
              setIsLoading(false); // Consider loading finished once subscriptions are confirmed
            } else if (msg.status === 'error') {
              console.error(`[RealtimeStockContext] Polygon subscription error: ${msg.message}`);
              setError(`Polygon subscription error: ${msg.message}`);
              // Decide if we should set isLoading to false or attempt to reconnect/handle
            }
          } else if (msg.sym && msg.ev === 'AM') { // Aggregate Minute data
            const symbol = msg.sym;
            console.log(`[RealtimeStockContext] Received AM data for ${symbol}:`, msg);
            setStockData(prevData => {
              const baseStockInfo = mockStocks.find(s => s.symbol === symbol);
              const currentStock = prevData[symbol] || baseStockInfo || { symbol, name: symbol, price: 0, change: 0, changePercent: 0, previousClose: 0, volume: "0" };
              
              const newPrice = msg.c; // Closing price for the minute aggregate
              // Use open of minute 'msg.o' or previous day's close if available.
              // Fallback chain for previousClose to calculate change.
              const previousCloseToUse = currentStock.previousClose || (baseStockInfo?.previousClose) || msg.o || newPrice;

              const change = newPrice - previousCloseToUse;
              const changePercent = previousCloseToUse !== 0 ? (change / previousCloseToUse) : 0;
              const newDailyVolume = (currentStock.dailyVolume || 0) + (msg.v || 0);


              const updatedStock: RealtimeStockData = {
                ...currentStock,
                name: currentStock.name || baseStockInfo?.name || symbol,
                logoUrl: currentStock.logoUrl || baseStockInfo?.logoUrl,
                dataAiHint: currentStock.dataAiHint || baseStockInfo?.dataAiHint,
                price: newPrice,
                lastPrice: newPrice,
                change: parseFloat(change.toFixed(2)),
                changePercent: parseFloat(changePercent.toFixed(4)),
                volume: newDailyVolume.toString(), // Displaying cumulative volume
                dailyVolume: newDailyVolume,
                timestamp: msg.s || Date.now(), // Start time of the aggregate window
                previousClose: previousCloseToUse, // Persist the determined previous close
                chartData: currentStock.chartData || baseStockInfo?.chartData || [],
              };
              console.log(`[RealtimeStockContext] Updating state for ${symbol} with:`, updatedStock);
              return {
                ...prevData,
                [symbol]: updatedStock,
              };
            });
            // Potentially set isLoading to false here if it's still true,
            // once first data message is received and processed for any symbol.
            if (isLoading) setIsLoading(false);

          } else {
            console.log('[RealtimeStockContext] Received unhandled message type or non-AM event:', msg);
          }
        });
      } catch (e) {
        console.error('[RealtimeStockContext] Error parsing WebSocket message or updating state:', e);
      }
    };

    ws.onerror = (errEvent) => {
      console.error('[RealtimeStockContext] WebSocket error:', errEvent);
      setError('WebSocket connection error. Real-time updates may be unavailable.');
      setIsLoading(false);
      setIsAuthenticated(false);
    };

    ws.onclose = (event) => {
      console.log(`[RealtimeStockContext] WebSocket disconnected from Polygon.io. Code: ${event.code}, Reason: '${event.reason}', Clean: ${event.wasClean}`);
      setIsLoading(false);
      setIsAuthenticated(false);
      if (!event.wasClean && subscribedSymbols.size > 0) { // Only set error if not a clean close and there were subscriptions
         setError('WebSocket connection closed unexpectedly. Real-time updates stopped.');
      }
    };

    return () => {
      console.log('[RealtimeStockContext] useEffect cleanup: Closing WebSocket.');
      ws.close();
      setIsLoading(false); // Ensure loading is false on cleanup
      setIsAuthenticated(false);
    };
  }, [subscribedSymbols, apiKey]); // apiKey is stable after init, subscribedSymbols drives changes

  const subscribeToSymbol = useCallback((symbol: string) => {
    setSubscribedSymbols(prev => {
      if (prev.has(symbol)) return prev;
      const newSet = new Set(prev);
      newSet.add(symbol);
      console.log('[RealtimeStockContext] Queued for subscription:', symbol, 'New set:', Array.from(newSet));
      return newSet;
    });
  }, []);

  const unsubscribeFromSymbol = useCallback((symbol: string) => {
    setSubscribedSymbols(prev => {
      const newSet = new Set(prev);
      if (newSet.delete(symbol)) {
        console.log('[RealtimeStockContext] Queued for unsubscription:', symbol, 'New set:', Array.from(newSet));
        // The main useEffect will handle sending unsubscribe if ws is active and symbol is removed
        // However, Polygon's model is often just close and reopen with new subscriptions.
        // For explicit unsubscribe, one would need ws.send({"action":"unsubscribe", ...}) if ws is open.
        // Current model: change in subscribedSymbols re-establishes connection with new subs.
      }
      return newSet;
    });
  }, []);

  return (
    <RealtimeStockContext.Provider value={{ stockData, subscribedSymbols, subscribeToSymbol, unsubscribeFromSymbol, isLoading, error }}>
      {children}
    </RealtimeStockContext.Provider>
  );
};
