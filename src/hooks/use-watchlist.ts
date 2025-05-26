
"use client";
import type { WatchlistItem } from '@/lib/types'; // Will use the minimal WatchlistItem type
import { useState, useEffect, useCallback } from 'react';

// const WATCHLIST_STORAGE_KEY = 'marketwatch_ai_watchlist_cleared'; // Changed key

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Minimal localStorage interaction
    // try {
    //   const storedWatchlist = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    //   if (storedWatchlist) {
    //     setWatchlist(JSON.parse(storedWatchlist));
    //   }
    // } catch (error) {
    //   console.error("Failed to load watchlist (cleared):", error);
    // }
    setIsLoaded(true);
  }, []);

  // useEffect(() => {
  //   if (isLoaded) {
  //     try {
  //       localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist));
  //     } catch (error) {
  //       console.error("Failed to save watchlist (cleared):", error);
  //     }
  //   }
  // }, [watchlist, isLoaded]);

  const addToWatchlist = useCallback((symbol: string) => {
    // if (!watchlist.includes(symbol)) {
    //   setWatchlist(prev => [...prev, symbol]);
    //   return true;
    // }
    return false;
  }, [watchlist]);

  const removeFromWatchlist = useCallback((symbol: string) => {
    // setWatchlist(prev => prev.filter(item => item !== symbol));
  }, []);

  const isInWatchlist = useCallback((symbol: string) => {
    return watchlist.includes(symbol);
  }, [watchlist]);

  return { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist, isLoaded };
}
