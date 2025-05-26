
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
    console.log('[RealtimeStockContext] API Key for WebSocket:', apiKey ? 'Loaded' : 'NOT LOADED - Check .env and restart server!');

    if (!apiKey) {
      const errorMessage = "CRITICAL: Polygon API key (NEXT_PUBLIC_POLYGON_API_KEY) is not configured. Real-time updates are disabled. Please ensure the key is in your .env file and the Next.js server was restarted.";
      console.error(errorMessage);
      setError(errorMessage);
      setIsLoading(false);
      setIsAuthenticated(false);
      return;
    }

    if (subscribedSymbols.size === 0) {
      console.log('[RealtimeStockContext] No symbols to subscribe to. WebSocket will not connect if not already open.');
      // Don't set isLoading to false here if ws might already be open and just needs new subscriptions
      // Or, if ws is not open, it's fine, it won't attempt to connect.
      return;
    }

    setIsLoading(true);
    setError(null);
    // setIsAuthenticated(false); // Don't reset auth status if ws is already open and authenticated

    console.log(`[RealtimeStockContext] Attempting to connect/subscribe to WebSocket for symbols: ${Array.from(subscribedSymbols).join(', ')}`);
    const ws = new WebSocket('wss://socket.polygon.io/stocks');

    ws.onopen = () => {
      console.log('[RealtimeStockContext] WebSocket connected to Polygon.io.');
      ws.send(JSON.stringify({ action: 'auth', params: apiKey }));
      console.log('[RealtimeStockContext] Sent auth request with key:', apiKey ? 'Key Present' : 'Key Missing/Undefined');
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
              const symbolsToSubscribeString = Array.from(subscribedSymbols).map(s => `AM.${s}`).join(',');
              if (symbolsToSubscribeString) {
                ws.send(JSON.stringify({ action: 'subscribe', params: symbolsToSubscribeString }));
                console.log(`[RealtimeStockContext] Sent subscription request for minute aggregates: ${symbolsToSubscribeString}`);
              } else {
                console.log('[RealtimeStockContext] Authenticated, but no symbols currently in subscribedSymbols set to send.');
              }
            } else if (msg.status === 'auth_failed') {
              setError('Polygon WebSocket authentication failed. Please check your API key, subscription plan, and ensure the key is active for Stocks WebSockets on the Polygon.io dashboard.');
              setIsAuthenticated(false);
              setIsLoading(false);
              ws.close();
            } else if (msg.status === 'success' && msg.message?.startsWith('subscribed to')) {
              console.log(`[RealtimeStockContext] Successfully subscribed to: ${msg.message}`);
              setIsLoading(false); 
            } else if (msg.status === 'error') {
              console.error(`[RealtimeStockContext] Polygon subscription error: ${msg.message}`);
              setError(`Polygon subscription error: ${msg.message}. This might be due to an invalid symbol or an issue with your subscription.`);
            }
          } else if (msg.sym && msg.ev === 'AM') { // Aggregate Minute data
            const symbol = msg.sym;
            console.log(`[RealtimeStockContext] Received AM data for ${symbol}:`, msg);
            setStockData(prevData => {
              const baseStockInfo = mockStocks.find(s => s.symbol === symbol);
              const currentStock = prevData[symbol] || baseStockInfo || { symbol, name: symbol, price: 0, change: 0, changePercent: 0, previousClose: 0, volume: "0" };
              
              const newPrice = msg.c; 
              const previousCloseToUse = currentStock.previousClose || msg.o || newPrice;

              const change = newPrice - previousCloseToUse;
              const changePercent = previousCloseToUse !== 0 ? (change / previousCloseToUse) : 0;
              
              // Accumulate volume: Polygon AM event 'v' is volume for *that minute*.
              // We need to decide if we want to show minute volume or cumulative daily volume.
              // For now, let's assume msg.v is the new total volume for simplicity,
              // or adjust if we want to show minute volume.
              // A more robust solution would be to fetch daily open/close/volume via REST once
              // and then apply deltas, or use Polygon's daily aggregate messages if available.
              // For this example, we treat 'v' as the volume for this update interval.
              const newDailyVolume = (currentStock.dailyVolume || 0) + (msg.v || 0); // Example of accumulating if msg.v is interval volume


              const updatedStock: RealtimeStockData = {
                ...currentStock,
                name: currentStock.name || baseStockInfo?.name || symbol,
                logoUrl: currentStock.logoUrl || baseStockInfo?.logoUrl,
                dataAiHint: currentStock.dataAiHint || baseStockInfo?.dataAiHint,
                price: newPrice,
                lastPrice: newPrice, // For clarity, lastPrice is the most recent price
                change: parseFloat(change.toFixed(2)),
                changePercent: parseFloat(changePercent.toFixed(4)),
                volume: (msg.v || currentStock.volume || "0").toString(), // Displaying minute volume for this update
                dailyVolume: newDailyVolume, // Or msg.v if 'v' is total daily
                timestamp: msg.s || Date.now(), 
                previousClose: previousCloseToUse, 
                chartData: currentStock.chartData || baseStockInfo?.chartData || [],
              };
              console.log(`[RealtimeStockContext] Updating state for ${symbol} with:`, updatedStock);
              return {
                ...prevData,
                [symbol]: updatedStock,
              };
            });
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
      setError('WebSocket connection error. Real-time updates may be unavailable. Check browser console for details.');
      setIsLoading(false);
      setIsAuthenticated(false);
    };

    ws.onclose = (event) => {
      console.log(`[RealtimeStockContext] WebSocket disconnected from Polygon.io. Code: ${event.code}, Reason: '${event.reason}', Clean: ${event.wasClean}`);
      setIsLoading(false);
      // setIsAuthenticated(false); // Keep auth status if it was a brief disconnect and might reconnect
      if (!event.wasClean && subscribedSymbols.size > 0) {
         setError('WebSocket connection closed unexpectedly. Attempting to reconnect if needed or check logs.');
      }
    };

    return () => {
      console.log('[RealtimeStockContext] useEffect cleanup: Closing WebSocket.');
      ws.close();
      // setIsLoading(false); // Avoid race conditions if re-connecting quickly
      // setIsAuthenticated(false);
    };
  }, [subscribedSymbols, apiKey]); // apiKey is stable after init, subscribedSymbols drives changes

  const subscribeToSymbol = useCallback((symbol: string) => {
    setSubscribedSymbols(prev => {
      if (prev.has(symbol)) return prev; // Already subscribed or queued
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
        // Or, it will close and reopen connection with new set of subscriptions.
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
