
"use client";
import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart as LucideLineChart, Search, PlusCircle, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { getUpdatedMockStocks, mockStocks as initialMockStocks } from '@/lib/mock-data';
import type { Stock } from '@/lib/types';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

const chartConfig = {
  price: { label: "Price", color: "hsl(var(--chart-1))" },
};


export default function TrackerPage() {
  const [trackedStocks, setTrackedStocks] = useState<Stock[]>(initialMockStocks.slice(0, 3)); 
  const [allStocksData, setAllStocksData] = useState<Stock[]>(initialMockStocks); 
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStockForChart, setSelectedStockForChart] = useState<Stock | null>(initialMockStocks[0] || null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInitialAndSubscribe = async () => {
      try {
        const updatedSystemStocks = await getUpdatedMockStocks();
        setAllStocksData(updatedSystemStocks);
        
        // Update tracked stocks based on the new full list
        setTrackedStocks(prevTracked => 
          prevTracked.map(tracked => 
            updatedSystemStocks.find(s => s.symbol === tracked.symbol) || tracked
          ).filter(Boolean) as Stock[] // filter out undefined if a symbol was removed
        );
        
        // Update selected chart stock if it's being tracked
        if (selectedStockForChart) {
          const updatedSelected = updatedSystemStocks.find(s => s.symbol === selectedStockForChart.symbol);
          if (updatedSelected) {
            setSelectedStockForChart(updatedSelected);
          } else if (trackedStocks.length > 0) { // If selected stock is no longer available, pick first tracked
             setSelectedStockForChart(trackedStocks[0]);
          } else {
             setSelectedStockForChart(null);
          }
        } else if (updatedSystemStocks.length > 0 && trackedStocks.length > 0) {
            setSelectedStockForChart(trackedStocks[0] || updatedSystemStocks[0]);
        }


      } catch (error) {
        console.error("Failed to fetch initial stock data:", error);
      } finally {
        setIsLoading(false);
      }

      const interval = setInterval(async () => {
        try {
          const updatedSystemStocks = await getUpdatedMockStocks();
          setAllStocksData(updatedSystemStocks);
      
          setTrackedStocks(prevTracked => 
            prevTracked.map(tracked => 
              updatedSystemStocks.find(s => s.symbol === tracked.symbol) || tracked
            ).filter(Boolean) as Stock[]
          );
          
          if (selectedStockForChart) {
            const updatedSelected = updatedSystemStocks.find(s => s.symbol === selectedStockForChart.symbol);
            if (updatedSelected) {
              setSelectedStockForChart(updatedSelected);
            }
          }
        } catch (error) {
          console.error("Failed to fetch updated stock data:", error);
        }
      }, 3000); // Update every 3 seconds
      return () => clearInterval(interval);
    };
    
    fetchInitialAndSubscribe();

  }, []); // Main dependency is on mount, interval handles selectedStockForChart updates implicitly via allStocksData

  // Update selected stock for chart if the main list changes and the selected one is present
   useEffect(() => {
    if (!isLoading && selectedStockForChart) {
        const currentSelectedStockData = allStocksData.find(s => s.symbol === selectedStockForChart.symbol);
        if (currentSelectedStockData) {
            setSelectedStockForChart(currentSelectedStockData);
        } else if (trackedStocks.length > 0) { // If current selected is gone, pick first from tracked
            setSelectedStockForChart(trackedStocks[0]);
        } else {
             setSelectedStockForChart(null);
        }
    } else if (!isLoading && !selectedStockForChart && trackedStocks.length > 0) {
        setSelectedStockForChart(trackedStocks[0]);
    }
  }, [allStocksData, trackedStocks, selectedStockForChart, isLoading]);


  const handleAddStock = (stockSymbol: string) => {
    const stockToAdd = allStocksData.find(s => s.symbol === stockSymbol);
    if (stockToAdd && !trackedStocks.some(s => s.symbol === stockSymbol)) {
      setTrackedStocks(prev => [...prev, stockToAdd]);
      if (!selectedStockForChart) {
        setSelectedStockForChart(stockToAdd);
      }
    }
  };

  const handleRemoveStock = (stockSymbol: string) => {
    setTrackedStocks(prev => {
      const newTracked = prev.filter(s => s.symbol !== stockSymbol);
      if (selectedStockForChart && selectedStockForChart.symbol === stockSymbol) {
        setSelectedStockForChart(newTracked.length > 0 ? newTracked[0] : null);
      }
      return newTracked;
    });
  };

  const filteredSearchableStocks = allStocksData
    .filter(stock => stock.name.toLowerCase().includes(searchTerm.toLowerCase()) || stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(stock => !trackedStocks.some(ts => ts.symbol === stock.symbol)) // Exclude already tracked stocks
    .slice(0, 5); // Limit results


  if (isLoading && trackedStocks.length === 0) {
     return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="text-center">
                <svg className="mx-auto h-12 w-12 animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-4 text-lg text-foreground">Loading Stock Tracker...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="w-full">
      <PageHeader
        title="Live Stock Tracker"
        description="Monitor stock prices and performance. Data updates periodically."
        icon={LucideLineChart}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Stock Chart and Add Stock */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>
                {selectedStockForChart ? `${selectedStockForChart.name} (${selectedStockForChart.symbol})` : 'Select a stock to view chart'}
              </CardTitle>
              {selectedStockForChart && (
                <CardDescription>
                  Current Price: {formatCurrency(selectedStockForChart.price)}
                  <span className={cn("ml-2", selectedStockForChart.change >= 0 ? 'text-green-500' : 'text-red-500')}>
                     ({selectedStockForChart.change >= 0 ? '+' : ''}{formatCurrency(selectedStockForChart.change)} / {formatPercentage(selectedStockForChart.changePercent, 2)})
                  </span>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {selectedStockForChart && selectedStockForChart.chartData && selectedStockForChart.chartData.length > 1 ? (
                 <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <LineChart data={selectedStockForChart.chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      tickMargin={8} 
                      tickFormatter={(value) => `$${value.toFixed(0)}`}
                      domain={['dataMin - 5', 'dataMax + 5']}
                    />
                    <ChartTooltip 
                        cursor={false} 
                        content={<ChartTooltipContent 
                                    indicator="line" 
                                    hideLabel 
                                    formatter={(value, name, item) => item.payload.month && item.payload.price ? (
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
                  {selectedStockForChart ? 'Loading chart data or insufficient data...' : 'No stock selected for chart.'}
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
                <Button variant="outline"><Search className="mr-2 h-4 w-4"/> Search</Button>
              </div>
              {searchTerm && filteredSearchableStocks.length > 0 && (
                <div className="border rounded-md max-h-48 overflow-y-auto">
                  {filteredSearchableStocks.map(stock => (
                    <div key={stock.symbol} className="flex items-center justify-between p-2 hover:bg-muted/50">
                      <div>
                        <span className="font-semibold">{stock.symbol}</span>
                        <span className="text-sm text-muted-foreground ml-2">{stock.name}</span>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => { handleAddStock(stock.symbol); setSearchTerm(''); }}>
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

        {/* Right Column: Tracked Stocks List */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Tracked Stocks</CardTitle>
              <CardDescription>Your currently tracked stocks.</CardDescription>
            </CardHeader>
            <CardContent>
              {trackedStocks.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No stocks are currently being tracked. Add some using the search above.</p>
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
                        onClick={() => setSelectedStockForChart(stock)} 
                        className={cn("cursor-pointer", selectedStockForChart?.symbol === stock.symbol && "bg-muted/50")}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {stock.logoUrl && <img src={stock.logoUrl} alt={stock.name} data-ai-hint={stock.dataAiHint || 'company logo'} className="h-6 w-6 rounded-full"/>}
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
