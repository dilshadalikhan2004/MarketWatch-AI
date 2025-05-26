"use client";
import type { Alert } from '@/lib/types';
import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

const ALERTS_STORAGE_KEY = 'marketwatch_ai_alerts';

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedAlerts = localStorage.getItem(ALERTS_STORAGE_KEY);
      if (storedAlerts) {
        setAlerts(JSON.parse(storedAlerts));
      }
    } catch (error) {
      console.error("Failed to load alerts from localStorage:", error);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
      } catch (error) {
        console.error("Failed to save alerts to localStorage:", error);
      }
    }
  }, [alerts, isLoaded]);

  const addAlert = useCallback((alertData: Omit<Alert, 'id' | 'createdAt' | 'triggered'>) => {
    const newAlert: Alert = {
      ...alertData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      triggered: false,
    };
    setAlerts(prev => [newAlert, ...prev]); // Add to beginning of array
    return newAlert;
  }, []);

  const removeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  const updateAlert = useCallback((alertId: string, updates: Partial<Alert>) => {
    setAlerts(prev => prev.map(alert => alert.id === alertId ? { ...alert, ...updates } : alert));
  }, []);
  
  const getAlertsBySymbol = useCallback((symbol: string) => {
    return alerts.filter(alert => alert.symbol === symbol);
  }, [alerts]);

  return { alerts, addAlert, removeAlert, updateAlert, getAlertsBySymbol, isLoaded };
}
