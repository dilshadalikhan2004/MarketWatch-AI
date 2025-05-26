
"use client";
import type { UserPortfolioPosition } from '@/lib/types';
import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const USER_PORTFOLIO_STORAGE_KEY = 'marketwatch_ai_user_portfolio_v1';

export function useUserPortfolio() {
  const [positions, setPositions] = useState<UserPortfolioPosition[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedPositions = localStorage.getItem(USER_PORTFOLIO_STORAGE_KEY);
      if (storedPositions) {
        setPositions(JSON.parse(storedPositions));
      }
    } catch (error) {
      console.error("Failed to load user portfolio from localStorage:", error);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(USER_PORTFOLIO_STORAGE_KEY, JSON.stringify(positions));
      } catch (error) {
        console.error("Failed to save user portfolio to localStorage:", error);
      }
    }
  }, [positions, isLoaded]);

  const addPosition = useCallback((data: Omit<UserPortfolioPosition, 'id' | 'addedAt'>) => {
    // Check if a position for this symbol already exists.
    // For simplicity, we'll allow multiple positions for the same symbol,
    // or users can manage them as separate lots.
    // A more complex app might merge them or require unique symbols.
    const newPosition: UserPortfolioPosition = {
      ...data,
      id: uuidv4(),
      addedAt: new Date().toISOString(),
    };
    setPositions(prev => [...prev, newPosition].sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()));
    return newPosition;
  }, []);

  const removePosition = useCallback((positionId: string) => {
    setPositions(prev => prev.filter(pos => pos.id !== positionId));
  }, []);

  const updatePosition = useCallback((positionId: string, updates: Partial<Omit<UserPortfolioPosition, 'id' | 'symbol' | 'addedAt'>>) => {
    setPositions(prev => prev.map(pos => pos.id === positionId ? { ...pos, ...updates } : pos));
  }, []);

  return { positions, addPosition, removePosition, updatePosition, isLoaded };
}
