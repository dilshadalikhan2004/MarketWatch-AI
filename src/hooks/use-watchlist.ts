
"use client";
import type { WatchlistItem } from '@/lib/types';
import { useState, useEffect, useCallback } from 'react';

const WATCHLIST_STORAGE_KEY = 'marketwatch_ai_watchlist_v1';

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedWatchlist = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (storedWatchlist) {
        setWatchlist(JSON.parse(storedWatchlist));
      }
    } catch (error) {
      console.error("Failed to load watchlist from localStorage:", error);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist));
      } catch (error) {
        console.error("Failed to save watchlist to localStorage:", error);
      }
    }
  }, [watchlist, isLoaded]);

  const addToWatchlist = useCallback((symbol: string, notes?: string) => {
    if (!watchlist.some(item => item.symbol === symbol)) {
      const newItem: WatchlistItem = {
        symbol,
        addedAt: new Date().toISOString(),
        notes,
      };
      setWatchlist(prev => [...prev, newItem].sort((a,b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()));
      return true;
    }
    return false;
  }, [watchlist]);

  const removeFromWatchlist = useCallback((symbol: string) => {
    setWatchlist(prev => prev.filter(item => item.symbol !== symbol));
  }, []);

  const isInWatchlist = useCallback((symbol: string) => {
    return watchlist.some(item => item.symbol === symbol);
  }, [watchlist]);
  
  const updateWatchlistItem = useCallback((symbol: string, updates: Partial<Omit<WatchlistItem, 'symbol' | 'addedAt'>>) => {
    setWatchlist(prev => prev.map(item => item.symbol === symbol ? { ...item, ...updates } : item));
  }, []);

  return { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist, updateWatchlistItem, isLoaded };
}
