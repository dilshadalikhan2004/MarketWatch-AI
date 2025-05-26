
"use client";
import type { Alert } from '@/lib/types';
import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const ALERTS_STORAGE_KEY = 'marketwatch_ai_alerts_v1';

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
    setAlerts(prev => [newAlert, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    return newAlert;
  }, []);

  const removeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  const updateAlert = useCallback((alertId: string, updates: Partial<Omit<Alert, 'id' | 'createdAt'>>) => {
    setAlerts(prev => prev.map(alert => alert.id === alertId ? { ...alert, ...updates } : alert));
  }, []);
  
  const getAlertsBySymbol = useCallback((symbol: string) => {
    return alerts.filter(alert => alert.symbol === symbol);
  }, [alerts]);

  // Placeholder for a function that might check and trigger alerts
  const checkAndTriggerAlerts = useCallback((currentStockPrices: Record<string, number>) => {
    // This is a simplified example. A real implementation would be more complex,
    // potentially run on a server, and handle notification delivery.
    let updated = false;
    const updatedAlerts = alerts.map(alert => {
      if (alert.triggered) return alert; // Already triggered

      const currentPrice = currentStockPrices[alert.symbol];
      if (currentPrice === undefined) return alert;

      let shouldTrigger = false;
      if (alert.condition === 'above' && currentPrice > alert.targetPrice) {
        shouldTrigger = true;
      } else if (alert.condition === 'below' && currentPrice < alert.targetPrice) {
        shouldTrigger = true;
      }
      // Add more conditions like 'percent_change_up', 'percent_change_down' here

      if (shouldTrigger) {
        console.log(`Alert triggered for ${alert.symbol}: Price ${currentPrice} ${alert.condition} ${alert.targetPrice}`);
        updated = true;
        return { ...alert, triggered: true, lastNotifiedPrice: currentPrice };
      }
      return alert;
    });

    if (updated) {
      setAlerts(updatedAlerts);
    }
  }, [alerts]);


  return { alerts, addAlert, removeAlert, updateAlert, getAlertsBySymbol, isLoaded, checkAndTriggerAlerts };
}
