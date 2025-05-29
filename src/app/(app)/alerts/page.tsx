
"use client";
import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Trash2, Edit3, BellRing } from 'lucide-react';
import { useAlerts } from '@/hooks/use-alerts';
import { mockStocks } from '@/lib/mock-data';
import type { Alert } from '@/lib/types';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { useToast } from "@/hooks/use-toast";

export default function AlertsPage() {
  const { alerts, addAlert, removeAlert, updateAlert, isLoaded } = useAlerts();
  const { toast } = useToast();

  const [symbol, setSymbol] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [targetPrice, setTargetPrice] = useState('');
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);


  const resetForm = () => {
    setSymbol('');
    setCondition('above');
    setTargetPrice('');
    setEditingAlert(null);
    setFormError(null);
  };

  const handleSubmit = () => {
    setFormError(null);
    if (!symbol.trim() || !targetPrice.trim()) {
      setFormError("Symbol and target price are required.");
      return;
    }
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      setFormError("Target price must be a positive number.");
      return;
    }
    const stockExists = mockStocks.some(s => s.symbol.toUpperCase() === symbol.trim().toUpperCase());
    if (!stockExists) {
      setFormError(`Stock symbol "${symbol.trim().toUpperCase()}" not found in mock data.`);
      return;
    }

    if (editingAlert) {
      updateAlert(editingAlert.id, { symbol: symbol.trim().toUpperCase(), condition, targetPrice: price });
      toast({ title: "Alert Updated", description: `Alert for ${symbol.toUpperCase()} has been updated.` });
    } else {
      addAlert({ symbol: symbol.trim().toUpperCase(), condition, targetPrice: price, createdAt: new Date().toISOString() });
      toast({ title: "Alert Created", description: `Alert for ${symbol.toUpperCase()} set at ${formatCurrency(price)}.` });
    }
    resetForm();
  };
  
  const handleEdit = (alert: Alert) => {
    setEditingAlert(alert);
    setSymbol(alert.symbol);
    setCondition(alert.condition as 'above' | 'below'); // Assuming only above/below for now
    setTargetPrice(alert.targetPrice.toString());
  };


  return (
    <div className="w-full">
      <PageHeader
        title="Price Alerts"
        description="Set up and manage your stock price notifications. Alerts are stored locally."
        icon={BellRing}
      />
      
      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <CardTitle>{editingAlert ? 'Edit Alert' : 'Create New Alert'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
            <div>
              <Label htmlFor="symbol">Stock Symbol</Label>
              <Input id="symbol" placeholder="e.g., AAPL" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} />
            </div>
            <div>
              <Label htmlFor="condition">Condition</Label>
              <Select value={condition} onValueChange={(value: 'above' | 'below') => setCondition(value)}>
                <SelectTrigger id="condition">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">Price Above</SelectItem>
                  <SelectItem value="below">Price Below</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="targetPrice">Target Price</Label>
              <Input id="targetPrice" type="number" placeholder="e.g., 150.00" value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} className="w-full sm:w-auto">
                {editingAlert ? <Edit3 className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                {editingAlert ? 'Update Alert' : 'Add Alert'}
              </Button>
              {editingAlert && (
                <Button variant="outline" onClick={resetForm} className="w-full sm:w-auto">Cancel</Button>
              )}
            </div>
          </div>
          {formError && <p className="text-sm text-destructive mt-2">{formError}</p>}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
          <CardDescription>
            {isMounted && isLoaded && alerts.length > 0 
              ? `You have ${alerts.length} active alert(s).`
              : isMounted && isLoaded ? "No active alerts." : "Loading alerts..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isMounted && isLoaded && alerts.length > 0 ? (
            <ul className="space-y-3">
              {alerts.map(alert => (
                <li key={alert.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                  <div>
                    <span className="font-semibold text-primary">{alert.symbol}</span>
                    <span className="text-muted-foreground"> - Price {alert.condition} </span>
                    <span className="font-medium">{formatCurrency(alert.targetPrice)}</span>
                    <p className="text-xs text-muted-foreground">Created: {formatDateTime(alert.createdAt)}</p>
                    {alert.triggered && <p className="text-xs text-green-500">Triggered!</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(alert)} aria-label="Edit alert">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {removeAlert(alert.id); toast({title: "Alert Removed", description: `Alert for ${alert.symbol} has been removed.`})}} aria-label="Remove alert">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center">
              {isMounted && isLoaded ? "You have no active alerts. Create one above!" : "Loading alerts..."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
