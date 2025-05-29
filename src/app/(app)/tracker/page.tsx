
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2, TrendingUp, TrendingDown, AlertCircle, RefreshCw, LineChart as LucideLineChart, Loader2 } from 'lucide-react';
import { mockStocks as initialMockStocksBase } from '@/lib/mock-data';
import type { Stock, RealtimeStockData } from '@/lib/types';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, CartesianGrid, XAxis, YAxis } from 'recharts';
import { cn } from '@/lib/utils';
import { useRealtimeStockData } from '@/contexts/RealtimeStockContext';
import { Alert, AlertTitle, AlertDescription as ShadCnAlertDescription } from '@/components/ui/alert'; // Renamed to avoid conflict
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";

const chartConfig = {
  price: { label: "Price", color: "hsl(var(--chart-1))" },
};

export default function TrackerPage() {
  const { stockData: realtimeStockData, subscribeToSymbol, unsubscribeFromSymbol, refreshStockData, isLoading: isLoadingData, error: dataError } = useRealtimeStockData();
  const { toast } = useToast();
  
  const [isMounted, setIsMounted] = useState(false);
  const [trackedStockSymbols, setTrackedStockSymbols] = useState<Set<string>>(() => new Set(initialMockStocksBase.slice(0, 3).map(s => s.symbol)));
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Initialize selectedSymbolForChart from trackedStockSymbols or first mock stock
  const [selectedSymbolForChart, setSelectedSymbolForChart] = useState<string | null>(() => {
    const initialTrackedArray = Array.from(trackedStockSymbols);
    if (initialTrackedArray.length > 0) return initialTrackedArray[0];
    if (initialMockStocksBase.length > 0) return initialMockStocksBase[0].symbol;
    return null;
  });


  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  useEffect(() => {
    if (!isMounted) return;

    const symbolsToWatch = new Set(trackedStockSymbols);
    if (selectedSymbolForChart) {
      symbolsToWatch.add(selectedSymbolForChart);
    }
    
    const symbolsArray = Array.from(symbolsToWatch);
    symbolsArray.forEach(subscribeToSymbol);
    if (symbolsArray.length > 0) {
      refreshStockData(symbolsArray);
    }

    return () => {
      symbolsArray.forEach(unsubscribeFromSymbol);
    };
  }, [isMounted, trackedStockSymbols, selectedSymbolForChart, subscribeToSymbol, unsubscribeFromSymbol, refreshStockData]);

  const allDisplayStocks: Stock[] = useMemo(() => {
    return initialMockStocksBase.map(baseStock => {
      const rtData = realtimeStockData[baseStock.symbol];
      return (isMounted && rtData) ? { ...baseStock, ...rtData } : baseStock;
    });
  }, [realtimeStockData, isMounted]);

  const trackedStocks: Stock[] = useMemo(() => {
    if (!isMounted) return [];
    return Array.from(trackedStockSymbols)
      .map(symbol => {
        const base = initialMockStocksBase.find(s => s.symbol === symbol);
        const rt = realtimeStockData[symbol];
        if (isMounted && rt && rt.price !== undefined) return { ...base, ...rt, name: base?.name || rt.symbol, logoUrl: base?.logoUrl, dataAiHint: base?.dataAiHint, chartData: rt.chartData || base?.chartData || [] } as Stock;
        if (base) return base;
        return { symbol, name: symbol, price: 0, change: 0, changePercent: 0, chartData: [] } as Stock; // Fallback
      })
      .filter(Boolean) as Stock[];
  }, [trackedStockSymbols, realtimeStockData, isMounted]);

  const selectedStockForChartData = useMemo(() => {
    if (!selectedSymbolForChart || !isMounted) return null;
    const base = initialMockStocksBase.find(s => s.symbol === selectedSymbolForChart);
    const rt = realtimeStockData[selectedSymbolForChart];
    if (rt && rt.price !== undefined) return { ...base, ...rt, name: base?.name || rt.symbol, logoUrl: base?.logoUrl, dataAiHint: base?.dataAiHint, chartData: rt.chartData || base?.chartData || [] } as Stock;
    if (base) return base;
    return { symbol: selectedSymbolForChart, name: selectedSymbolForChart, price: 0, change:0, changePercent:0, chartData: [] } as Stock; // Fallback
  }, [selectedSymbolForChart, realtimeStockData, isMounted]);


  const handleAddStock = (stockSymbol: string) => {
    if (trackedStockSymbols.has(stockSymbol)) {
        toast({ title: "Already Tracked", description: `${stockSymbol} is already in your tracker.`, variant: "default" });
        setSearchTerm('');
        return; 
    }
    setTrackedStockSymbols(prev => {
        const newSet = new Set(prev).add(stockSymbol);
        subscribeToSymbol(stockSymbol); 
        refreshStockData([stockSymbol]); 
        return newSet;
    });
    if (!selectedSymbolForChart) {
      setSelectedSymbolForChart(stockSymbol);
    }
    toast({ title: "Stock Added", description: `${stockSymbol} added to your tracker.` });
    setSearchTerm('');
  };

  const handleRemoveStock = (stockSymbol: string) => {
    setTrackedStockSymbols(prev => {
      const newSet = new Set(prev);
      newSet.delete(stockSymbol);
      unsubscribeFromSymbol(stockSymbol); 
      if (selectedSymbolForChart === stockSymbol) {
        setSelectedSymbolForChart(newSet.size > 0 ? newSet.values().next().value : null);
      }
      return newSet;
    });
    toast({ title: "Stock Removed", description: `${stockSymbol} removed from your tracker.` });
  };
  
  const handleRefreshAllTracked = () => {
    const symbolsToRefresh = Array.from(trackedStockSymbols);
    if (selectedSymbolForChart && !symbolsToRefresh.includes(selectedSymbolForChart)){
        symbolsToRefresh.push(selectedSymbolForChart);
    }
    if (symbolsToRefresh.length > 0) {
        refreshStockData(symbolsToRefresh);
        toast({ title: "Data Refreshed", description: "Tracker data updated from FMP." });
    } else {
        toast({ title: "No Stocks to Refresh", description: "Add stocks to the tracker first.", variant: "default" });
    }
  };

  const filteredSearchableStocks = allDisplayStocks
    .filter(stock => stock.name.toLowerCase().includes(searchTerm.toLowerCase()) || stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(stock => !trackedStockSymbols.has(stock.symbol))
    .slice(0, 5);

  if (!isMounted && isLoadingData && trackedStocks.length === 0) { // Show loader only if truly nothing is ready yet
     return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="text-center">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-lg text-foreground">Loading Stock Tracker...</p>
            </div>
        </div>
    );
  }
  
  return (
    <div className="w-full">
      <PageHeader
        title="Live Stock Tracker"
        description="Monitor stock prices and performance. Data from FinancialModelingPrep (FMP)."
        icon={LucideLineChart}
        actions={
            <Button onClick={handleRefreshAllTracked} disabled={isLoadingData} variant="outline">
                <RefreshCw className={cn("mr-2 h-4 w-4", isLoadingData && "animate-spin")} />
                Refresh Tracker
            </Button>
        }
      />
       {isLoadingData && isMounted && <p className="text-sm text-muted-foreground mb-4">Fetching latest data...</p>}
       {dataError && isMounted && (
        <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Data Fetching Error</AlertTitle>
            <ShadCnAlertDescription>{dataError} Some data might be outdated or unavailable. This could be due to API limits.</ShadCnAlertDescription>
        </Alert>
      )}


      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>
                {selectedStockForChartData ? `${selectedStockForChartData.name} (${selectedStockForChartData.symbol})` : 'Select a stock to view chart'}
              </CardTitle>
              {selectedStockForChartData && (
                <CardDescription>
                  Current Price: {formatCurrency(selectedStockForChartData.price)}
                  {isMounted && selectedStockForChartData.change !== undefined ? (
                    <span className={cn("ml-2", selectedStockForChartData.change >= 0 ? 'text-green-500' : 'text-red-500')}>
                        ({selectedStockForChartData.change >= 0 ? '+' : ''}{formatCurrency(selectedStockForChartData.change)} / {formatPercentage(selectedStockForChartData.changePercent, 2)})
                    </span>
                  ) : <span className="ml-1">(...)</span>}
                   {isLoadingData && selectedSymbolForChart === selectedStockForChartData.symbol && <span className="ml-2 text-xs">(Updating...)</span>}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {isMounted && selectedStockForChartData && selectedStockForChartData.chartData && selectedStockForChartData.chartData.length > 1 ? (
                 <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <LineChart data={selectedStockForChartData.chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      tickMargin={8} 
                      tickFormatter={(value) => `$${value.toFixed(0)}`}
                      domain={['dataMin - 10', 'dataMax + 10']} // Adjusted domain slightly
                    />
                    <ChartTooltip 
                        cursor={false} 
                        content={<ChartTooltipContent 
                                    indicator="line" 
                                    hideLabel 
                                    formatter={(value, name, item) => item.payload.month && typeof item.payload.price === 'number' ? ( // Ensure price is number
                                        <div className="flex flex-col">
                                            <span className="font-semibold">{item.payload.month}</span>
                                            <span className="text-sm">{formatCurrency(item.payload.price as number)}</span>
                                        </div>
                                    ) : null}
                                />} 
                    />
                    <Line type="monotone" dataKey="price" stroke="var(--color-price)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  {isLoadingData && selectedStockForChartData ? <Loader2 className="h-6 w-6 animate-spin text-primary mr-2"/> : null}
                  {selectedStockForChartData ? 'Loading chart data or insufficient historical data...' : 'No stock selected for chart.'}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Add Stock to Tracker</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-3">
                <Input
                  type="text"
                  placeholder="Search by symbol or name (e.g., MSFT)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-md"
                />
              </div>
              {searchTerm && filteredSearchableStocks.length > 0 && (
                <div className="border rounded-md max-h-48 overflow-y-auto">
                  {filteredSearchableStocks.map(stock => (
                    <div key={stock.symbol} className="flex items-center justify-between p-2 hover:bg-muted/50">
                      <div>
                        <span className="font-semibold">{stock.symbol}</span>
                        <span className="text-sm text-muted-foreground ml-2">{stock.name}</span>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => handleAddStock(stock.symbol)}>
                        <PlusCircle className="h-4 w-4 mr-1"/> Add
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {searchTerm && filteredSearchableStocks.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">No stocks found matching your search, or they are already tracked.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Tracked Stocks</CardTitle>
              <CardDescription>Your currently tracked stocks.</CardDescription>
            </CardHeader>
            <CardContent>
              {trackedStocks.length === 0 && !isLoadingData ? (
                <p className="text-muted-foreground text-center py-4">No stocks are currently being tracked. Add some using the search above.</p>
              ) : isLoadingData && trackedStocks.length === 0 ? (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Change</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trackedStocks.map(stock => (
                      <TableRow 
                        key={stock.symbol} 
                        onClick={() => setSelectedSymbolForChart(stock.symbol)} 
                        className={cn("cursor-pointer", selectedSymbolForChart === stock.symbol && "bg-muted/50")}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {stock.logoUrl && <Image src={stock.logoUrl} alt={stock.name} data-ai-hint={stock.dataAiHint || 'company logo'} width={24} height={24} className="rounded-full"/>}
                            {stock.symbol}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(stock.price)}</TableCell>
                        <TableCell className={cn("text-right", stock.change >= 0 ? 'text-green-500' : 'text-red-500')}>
                          {stock.change >=0 ? <TrendingUp className="inline h-4 w-4 mr-1"/> : <TrendingDown className="inline h-4 w-4 mr-1"/>}
                          {formatPercentage(stock.changePercent, 2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleRemoveStock(stock.symbol);}} aria-label="Remove stock">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
