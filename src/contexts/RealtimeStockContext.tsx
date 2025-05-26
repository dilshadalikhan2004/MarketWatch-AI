
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
  // Ensure the environment variable name matches exactly what's in your .env file
  const [apiKey] = useState(process.env.NEXT_PUBLIC_POLYGON_API_KEY);


  useEffect(() => {
    // More prominent check for API key absence
    if (!apiKey) {
      const errorMessage = "CRITICAL: Polygon API key (NEXT_PUBLIC_POLYGON_API_KEY) is not configured or not loaded from .env. Real-time updates are disabled.";
      setError(errorMessage);
      setIsLoading(false);
      console.error(errorMessage, "Please ensure the key is in your .env file and the Next.js server was restarted.");
      return;
    }
    
    // Temporary log for debugging - REMOVE AFTER DEBUGGING
    console.log('Attempting to use Polygon API Key:', apiKey ? apiKey.substring(0, 5) + "..." : "API Key is undefined/empty");


    if (subscribedSymbols.size === 0) {
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    setError(null);

    console.log(`Attempting to connect to WebSocket for symbols: ${Array.from(subscribedSymbols).join(', ')}`);

    const ws = new WebSocket('wss://socket.polygon.io/stocks');

    ws.onopen = () => {
      console.log('WebSocket connected to Polygon.io');
      setIsLoading(false);
      ws.send(JSON.stringify({ action: 'auth', params: apiKey }));
      
      const symbolsToSubscribeString = Array.from(subscribedSymbols).map(s => `AM.${s}`).join(',');
      if (symbolsToSubscribeString) {
         ws.send(JSON.stringify({ action: 'subscribe', params: symbolsToSubscribeString }));
        console.log(`Sent subscription request for minute aggregates: ${symbolsToSubscribeString}`);
      }
    };

    ws.onmessage = (event) => {
      try {
        const messages = JSON.parse(event.data as string);
        (Array.isArray(messages) ? messages : [messages]).forEach(msg => {
          if (msg.ev === 'status') {
            console.log('Polygon status message:', msg.message, '(Status:', msg.status, ')');
            if (msg.status === 'auth_failed') {
                setError('Polygon WebSocket authentication failed. Please check your API key, subscription, or network connection.');
                ws.close();
            } else if (msg.status === 'auth_success') {
                console.log('Polygon WebSocket authentication successful.');
            } else if (msg.status === 'success' && msg.message.startsWith('subscribed to')) {
                console.log('Successfully subscribed to symbols:', msg.message);
            }
          } else if (msg.sym && (msg.ev === 'AM' || msg.ev === 'T' || msg.ev === 'Q')) {
            const symbol = msg.sym;
            
            setStockData(prevData => {
              const baseStockInfo = mockStocks.find(s => s.symbol === symbol);
              const currentStock = prevData[symbol] || baseStockInfo || { symbol, name: symbol, price: 0, change: 0, changePercent: 0, previousClose: 0 };
              
              let newPrice = currentStock.price;
              if (msg.ev === 'AM' && msg.c !== undefined) {
                newPrice = msg.c;
              } else if (msg.ev === 'T' && msg.p !== undefined) {
                newPrice = msg.p;
              } else if (msg.ev === 'Q' && msg.bp !== undefined) {
                newPrice = msg.bp; 
              }

              const previousCloseToUse = currentStock.previousClose || (msg.ev === 'AM' && msg.o) || baseStockInfo?.previousClose || newPrice;
              const change = newPrice - previousCloseToUse;
              const changePercent = previousCloseToUse !== 0 ? (change / previousCloseToUse) : 0;

              return {
                ...prevData,
                [symbol]: {
                  ...currentStock,
                  name: currentStock.name || baseStockInfo?.name || symbol,
                  logoUrl: currentStock.logoUrl || baseStockInfo?.logoUrl,
                  dataAiHint: currentStock.dataAiHint || baseStockInfo?.dataAiHint,
                  price: newPrice,
                  lastPrice: newPrice,
                  change: parseFloat(change.toFixed(2)),
                  changePercent: parseFloat(changePercent.toFixed(4)), // Store as decimal
                  volume: msg.v !== undefined ? ((prevData[symbol]?.dailyVolume || 0) + msg.v).toString() : currentStock.volume,
                  dailyVolume: msg.v !== undefined ? (prevData[symbol]?.dailyVolume || 0) + msg.v : currentStock.dailyVolume,
                  timestamp: msg.t || Date.now(),
                  previousClose: previousCloseToUse,
                  chartData: currentStock.chartData || baseStockInfo?.chartData || [],
                },
              };
            });
          }
        });
      } catch (e) {
        console.error('Error parsing WebSocket message or updating state:', e);
      }
    };

    ws.onerror = (errEvent) => {
      console.error('WebSocket error:', errEvent);
      setError('WebSocket connection error. Real-time updates may be unavailable.');
      setIsLoading(false);
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected from Polygon.io. Code:', event.code, 'Reason:', event.reason, 'Was clean:', event.wasClean);
      if (!event.wasClean) {
        setError('WebSocket connection closed unexpectedly. Real-time updates stopped.');
      }
      setIsLoading(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        console.log('Closing WebSocket connection');
        ws.close();
      }
    };
  }, [subscribedSymbols, apiKey]); 

  const subscribeToSymbol = useCallback((symbol: string) => {
    setSubscribedSymbols(prev => {
      if (prev.has(symbol)) return prev; // Already subscribed
      const newSet = new Set(prev);
      newSet.add(symbol);
      console.log('Context: Added to subscription queue:', symbol);
      return newSet;
    });
  }, []);

  const unsubscribeFromSymbol = useCallback((symbol: string) => {
    setSubscribedSymbols(prev => {
      const newSet = new Set(prev);
      if (newSet.delete(symbol)) {
        console.log('Context: Removed from subscription queue:', symbol);
        // Actual unsubscribe message to WebSocket should happen in the useEffect cleanup
        // or when the ws connection is active and symbols change.
        // For simplicity here, the main useEffect handles subscriptions based on subscribedSymbols set.
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

