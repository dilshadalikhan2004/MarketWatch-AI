
"use client";
import type { Stock, RealtimeStockData } from '@/lib/types';
import { mockStocks } from '@/lib/mock-data'; // For initial static data
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// This type would represent the data structure you expect from Polygon.io WebSocket
// For example: { ev: string, sym: string, p: number, v: number, t: number, ... }
// You'll need to map this to your RealtimeStockData structure.
// type PolygonWebSocketMessage = any; 

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
    // Initialize with mock data for initial display
    const initialData: Record<string, RealtimeStockData> = {};
    mockStocks.forEach(stock => {
      initialData[stock.symbol] = { ...stock }; // Spread to make it RealtimeStockData compatible
    });
    return initialData;
  });
  const [subscribedSymbols, setSubscribedSymbols] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true); // True initially until WebSocket attempts connection
  const [error, setError] = useState<string | null>(null);
  const [apiKey] = useState(process.env.POLYGON_API_KEY || process.env.NEXT_PUBLIC_POLYGON_API_KEY);


  useEffect(() => {
    if (!apiKey) {
      setError("Polygon API key is not configured. Real-time updates are disabled.");
      setIsLoading(false);
      console.warn("POLYGON_API_KEY is not set in .env file. Real-time updates will not work.");
      return;
    }
    
    if (subscribedSymbols.size === 0) {
        // If no symbols are subscribed, we can close any existing connection or simply not connect.
        // For now, we'll just ensure loading is false if we're not trying to connect.
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    setError(null);

    // TODO: Replace with actual Polygon.io WebSocket client initialization
    // Example: const ws = new WebSocket('wss://socket.polygon.io/stocks');
    // You might use the polygon.io-client-js library for easier handling.

    console.log(`Attempting to connect to WebSocket for symbols: ${Array.from(subscribedSymbols).join(', ')}`);

    // --- START POLYGON.IO WEBSOCKET PLACEHOLDER ---
    // This is a conceptual placeholder. You'll need to implement this with Polygon.io's actual API.
    // For example, using the 'polygon.io-client-js':
    // import { restClient, websocketClient } from '@polygon.io/client-js';
    // const ws = websocketClient(apiKey).stocks();

    const ws = new WebSocket('wss://socket.polygon.io/stocks'); // Replace with actual endpoint if different

    ws.onopen = () => {
      console.log('WebSocket connected to Polygon.io');
      setIsLoading(false);
      ws.send(JSON.stringify({ action: 'auth', params: apiKey }));
      
      // Subscribe to all symbols in the subscribedSymbols set
      const symbolsToSubscribe = Array.from(subscribedSymbols).join(',');
      if (symbolsToSubscribe) {
        // Example: Subscribe to trades for these symbols
        // Polygon's specific subscription message format will be needed here.
        // This is a generic example, check Polygon docs for correct format for trades/quotes.
        // For trades (T) and quotes (Q)
        // ws.send(JSON.stringify({ action: 'subscribe', params: `T.${symbolsToSubscribe},Q.${symbolsToSubscribe}` }));

        // Simplified subscription for aggregates (AM for minute aggregates)
         ws.send(JSON.stringify({ action: 'subscribe', params: Array.from(subscribedSymbols).map(s => `AM.${s}`).join(',') }));
        console.log(`Subscribed to minute aggregates for: ${symbolsToSubscribe}`);
      }
    };

    ws.onmessage = (event) => {
      try {
        const messages = JSON.parse(event.data as string);
        // Polygon sends an array of messages
        (Array.isArray(messages) ? messages : [messages]).forEach(msg => {
          // console.log('WebSocket message received:', msg);
          // Example: 'AM' for minute aggregates
          // [ { ev: 'AM', sym: 'AAPL', v: 100, vw: 150.00, o: 150.00, c: 150.01, h: 150.02, l: 149.99, t: 1633028400000, n: 5 } ]
          if (msg.ev === 'status') {
            console.log('Polygon status message:', msg.message);
            if (msg.status === 'auth_failed') {
                setError('Polygon WebSocket authentication failed.');
                ws.close();
            }
          } else if (msg.sym && (msg.ev === 'AM' || msg.ev === 'T' || msg.ev === 'Q')) { // AM for Minute Aggregates, T for Trades, Q for Quotes
            const symbol = msg.sym;
            
            setStockData(prevData => {
              const currentStock = prevData[symbol] || mockStocks.find(s => s.symbol === symbol) || { symbol, name: symbol, price: 0, change: 0, changePercent: 0 };
              
              let newPrice = currentStock.price;
              if (msg.ev === 'AM' && msg.c !== undefined) { // Minute aggregate close price
                newPrice = msg.c;
              } else if (msg.ev === 'T' && msg.p !== undefined) { // Trade price
                newPrice = msg.p;
              } else if (msg.ev === 'Q' && msg.bp !== undefined) { // Quote bid price (or ask price: msg.ap)
                newPrice = msg.bp; // Or choose mid-price, etc.
              }

              const previousClose = currentStock.previousClose || (msg.ev === 'AM' && msg.o) || currentStock.price; // Use open of minute bar if available
              const change = newPrice - previousClose;
              const changePercent = previousClose !== 0 ? (change / previousClose) : 0;

              return {
                ...prevData,
                [symbol]: {
                  ...currentStock,
                  price: newPrice,
                  lastPrice: newPrice,
                  change: parseFloat(change.toFixed(2)),
                  changePercent: parseFloat(changePercent.toFixed(4)),
                  volume: msg.v !== undefined ? (currentStock.volume || '0') + msg.v : currentStock.volume, // Accumulate volume if possible or use daily
                  dailyVolume: msg.v, // Or from a different field based on msg type
                  timestamp: msg.t || Date.now(),
                  previousClose: previousClose, // Store for next update
                },
              };
            });
          }
        });
      } catch (e) {
        console.error('Error parsing WebSocket message or updating state:', e);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      setError('WebSocket connection error. Real-time updates may be unavailable.');
      setIsLoading(false);
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected from Polygon.io', event.reason);
      // Optionally, you might want to implement a reconnect strategy here.
      // For simplicity, we're not doing that in this example.
      if (!event.wasClean) {
        setError('WebSocket connection closed unexpectedly.');
      }
      setIsLoading(false);
    };
    // --- END POLYGON.IO WEBSOCKET PLACEHOLDER ---

    return () => {
      console.log('Closing WebSocket connection');
      ws.close();
    };
  }, [subscribedSymbols, apiKey]); // Re-run effect if subscribedSymbols or apiKey changes

  const subscribeToSymbol = useCallback((symbol: string) => {
    setSubscribedSymbols(prev => {
      const newSet = new Set(prev);
      newSet.add(symbol);
      return newSet;
    });
  }, []);

  const unsubscribeFromSymbol = useCallback((symbol: string) => {
    setSubscribedSymbols(prev => {
      const newSet = new Set(prev);
      newSet.delete(symbol);
      // TODO: Send unsubscribe message to WebSocket if Polygon supports it
      // ws.send(JSON.stringify({ action: 'unsubscribe', params: `AM.${symbol}` }));
      return newSet;
    });
  }, []);

  return (
    <RealtimeStockContext.Provider value={{ stockData, subscribedSymbols, subscribeToSymbol, unsubscribeFromSymbol, isLoading, error }}>
      {children}
    </RealtimeStockContext.Provider>
  );
};
