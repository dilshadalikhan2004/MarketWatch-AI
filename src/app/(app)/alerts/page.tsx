"use client";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAlerts } from "@/hooks/use-alerts";
import { useToast } from "@/hooks/use-toast";
import { getStockBySymbol, mockStocks, getUpdatedMockStocks } from "@/lib/mock-data"; // For current prices
import type { Alert, Stock } from "@/lib/types";
import { BellRing, PlusCircle, Trash2, Edit3, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import React, { useState, useEffect, FormEvent } from "react";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const alertFormSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").max(10, "Symbol too long").toUpperCase(),
  targetPrice: z.coerce.number().positive("Price must be positive"),
  condition: z.enum(["above", "below"]),
});

type AlertFormData = z.infer<typeof alertFormSchema>;

export default function AlertsPage() {
  const { alerts, addAlert, removeAlert, updateAlert, isLoaded: alertsLoaded } = useAlerts();
  const { toast } = useToast();
  const [marketData, setMarketData] = useState<Record<string, Stock>>({});
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);

  const { control, handleSubmit, register, reset, setValue, formState: { errors } } = useForm<AlertFormData>({
    resolver: zodResolver(alertFormSchema),
    defaultValues: {
      symbol: "",
      targetPrice: 0,
      condition: "above",
    },
  });

  useEffect(() => {
    // Initialize marketData with current prices
    const initialMarketData: Record<string, Stock> = {};
    mockStocks.forEach(stock => {
      initialMarketData[stock.symbol] = stock;
    });
    setMarketData(initialMarketData);

    // Simulate live price updates and check alerts
    const interval = setInterval(() => {
      const updatedStocks = getUpdatedMockStocks();
      const newMarketData: Record<string, Stock> = {};
      updatedStocks.forEach(stock => {
        newMarketData[stock.symbol] = stock;
      });
      setMarketData(newMarketData);

      // Check alerts against new prices
      alerts.forEach(alert => {
        const currentStock = newMarketData[alert.symbol];
        if (currentStock && !alert.triggered) {
          const price = currentStock.price;
          let shouldTrigger = false;
          if (alert.condition === "above" && price >= alert.targetPrice) {
            shouldTrigger = true;
          } else if (alert.condition === "below" && price <= alert.targetPrice) {
            shouldTrigger = true;
          }

          if (shouldTrigger) {
            updateAlert(alert.id, { triggered: true, lastNotifiedPrice: price });
            toast({
              title: `🔔 Alert Triggered for ${alert.symbol}!`,
              description: `${alert.symbol} reached ${formatCurrency(price)}. Target was ${alert.condition} ${formatCurrency(alert.targetPrice)}.`,
              variant: "default",
              duration: 10000,
            });
          }
        }
      });
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [alerts, updateAlert, toast]);

  const onSubmit: SubmitHandler<AlertFormData> = (data) => {
    const stockExists = getStockBySymbol(data.symbol);
    if (!stockExists) {
      toast({ title: "Invalid Symbol", description: `Stock symbol "${data.symbol}" not found.`, variant: "destructive" });
      return;
    }

    if (editingAlert) {
      updateAlert(editingAlert.id, { ...data, triggered: false }); // Reset triggered status on edit
      toast({ title: "Alert Updated", description: `Alert for ${data.symbol} updated.` });
      setEditingAlert(null);
    } else {
      addAlert(data);
      toast({ title: "Alert Created", description: `Alert set for ${data.symbol} to trigger when price is ${data.condition} ${formatCurrency(data.targetPrice)}.` });
    }
    reset();
  };
  
  const handleEdit = (alert: Alert) => {
    setEditingAlert(alert);
    setValue("symbol", alert.symbol);
    setValue("targetPrice", alert.targetPrice);
    setValue("condition", alert.condition);
  };

  const handleCancelEdit = () => {
    setEditingAlert(null);
    reset();
  };

  const sortedAlerts = [...alerts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Custom Alerts" 
        icon={BellRing} 
        description="Set up and manage price alerts for your favorite stocks." 
      />

      <Card>
        <CardHeader>
          <CardTitle>{editingAlert ? "Edit Alert" : "Create New Alert"}</CardTitle>
          <CardDescription>
            {editingAlert ? `Modify the alert for ${editingAlert.symbol}.` : "Get notified when a stock reaches your target price."}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">Stock Symbol</Label>
              <Input id="symbol" placeholder="e.g., AAPL" {...register("symbol")} />
              {errors.symbol && <p className="text-sm text-destructive">{errors.symbol.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetPrice">Target Price</Label>
              <Input id="targetPrice" type="number" step="0.01" placeholder="e.g., 150.00" {...register("targetPrice")} />
              {errors.targetPrice && <p className="text-sm text-destructive">{errors.targetPrice.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Controller
                name="condition"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <SelectTrigger id="condition">
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="above">Price is Above</SelectItem>
                      <SelectItem value="below">Price is Below</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.condition && <p className="text-sm text-destructive">{errors.condition.message}</p>}
            </div>
            <div className="space-y-2 flex items-end">
               {editingAlert ? (
                <div className="flex gap-2 w-full">
                    <Button type="submit" className="w-full"><Edit3 className="h-4 w-4 mr-2" /> Update Alert</Button>
                    <Button type="button" variant="outline" onClick={handleCancelEdit} className="w-full">Cancel</Button>
                </div>
                ) : (
                <Button type="submit" className="w-full"><PlusCircle className="h-4 w-4 mr-2" /> Set Alert</Button>
                )}
            </div>
          </CardContent>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
          <CardDescription>Your currently configured price alerts.</CardDescription>
        </CardHeader>
        <CardContent>
          {!alertsLoaded && <p className="text-muted-foreground">Loading alerts...</p>}
          {alertsLoaded && sortedAlerts.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
                <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No alerts set.</p>
                <p>Create alerts using the form above to get notified.</p>
            </div>
          )}
          {alertsLoaded && sortedAlerts.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead className="text-right">Target Price</TableHead>
                  <TableHead className="text-right">Current Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAlerts.map((alert) => {
                  const currentStock = marketData[alert.symbol];
                  const currentPrice = currentStock?.price;
                  return (
                    <TableRow key={alert.id} className={alert.triggered ? "bg-primary/10" : ""}>
                      <TableCell className="font-medium">{alert.symbol}</TableCell>
                      <TableCell>Price {alert.condition} </TableCell>
                      <TableCell className="text-right">{formatCurrency(alert.targetPrice)}</TableCell>
                      <TableCell className={`text-right font-semibold ${currentPrice && ((alert.condition === 'above' && currentPrice >= alert.targetPrice) || (alert.condition === 'below' && currentPrice <= alert.targetPrice)) ? (alert.triggered ? 'text-primary' : 'text-orange-500') : ''}`}>
                        {currentPrice !== undefined ? formatCurrency(currentPrice) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {alert.triggered ? (
                          <span className="flex items-center text-green-600">
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Triggered at {formatCurrency(alert.lastNotifiedPrice || 0)}
                          </span>
                        ) : (
                          <span className="flex items-center text-yellow-600">
                            <AlertTriangle className="h-4 w-4 mr-1" /> Active
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(alert.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        {!alert.triggered && (
                             <Button variant="ghost" size="icon" onClick={() => handleEdit(alert)} className="mr-1 text-blue-600 hover:text-blue-700">
                                <Edit3 className="h-4 w-4" />
                            </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90">
                               <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the alert for {alert.symbol}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => removeAlert(alert.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
