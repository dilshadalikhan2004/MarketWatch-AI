
"use client";
import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart as LucideLineChart, Search, PlusCircle, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { getUpdatedMockStocks, mockStocks } from '@/lib/mock-data';
import type { Stock } from '@/lib/types';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { cn } from '@/lib/utils';

const chartConfig = {
  price: { label: "Price", color: "hsl(var(--chart-1))" },
};


export default function TrackerPage() {
  const [trackedStocks, setTrackedStocks] = useState<Stock[]>(mockStocks.slice(0, 3)); // Initial tracked stocks
  const [allStocksData, setAllStocksData] = useState<Stock[]>(mockStocks); // All available stocks for adding
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStockForChart, setSelectedStockForChart] = useState<Stock | null>(trackedStocks[0] || null);

  useEffect(() => {
    const interval = setInterval(() => {
      const updatedSystemStocks = getUpdatedMockStocks();
      setAllStocksData(updatedSystemStocks); // Update the source of truth for all stocks
      
      // Update tracked stocks based on the updated system stocks
      setTrackedStocks(prevTracked => 
        prevTracked.map(tracked => 
          updatedSystemStocks.find(s => s.symbol === tracked.symbol) || tracked
        )
      );
      
      // Update selected chart stock if it's being tracked
      if (selectedStockForChart) {
        const updatedSelected = updatedSystemStocks.find(s => s.symbol === selectedStockForChart.symbol);
        if (updatedSelected) {
          setSelectedStockForChart(updatedSelected);
        }
      }

    }, 3000); // Update every 3 seconds
    return () => clearInterval(interval);
  }, [selectedStockForChart]);

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
    setTrackedStocks(prev => prev.filter(s => s.symbol !== stockSymbol));
    if (selectedStockForChart && selectedStockForChart.symbol === stockSymbol) {
      setSelectedStockForChart(trackedStocks.length > 1 ? trackedStocks.filter(s => s.symbol !== stockSymbol)[0] : null);
    }
  };

  const filteredSearchableStocks = allStocksData
    .filter(stock => stock.name.toLowerCase().includes(searchTerm.toLowerCase()) || stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(stock => !trackedStocks.some(ts => ts.symbol === stock.symbol)) // Exclude already tracked stocks
    .slice(0, 5); // Limit results

  return (
    <div className="w-full">
      <PageHeader
        title="Live Stock Tracker"
        description="Monitor real-time stock prices and performance."
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
                     ({selectedStockForChart.change >= 0 ? '+' : ''}{formatCurrency(selectedStockForChart.change, '', 2)} / {formatPercentage(selectedStockForChart.changePercent, 2)})
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
                                    formatter={(value, name, item) => (
                                        <div className="flex flex-col">
                                            <span className="font-semibold">{item.payload.month}</span>
                                            <span className="text-sm">{formatCurrency(value as number)}</span>
                                        </div>
                                    )}
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
                <p className="text-muted-foreground text-center py-4">No stocks are currently being tracked.</p>
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
                            <img src={stock.logoUrl} alt={stock.name} data-ai-hint={stock.dataAiHint || 'company logo'} className="h-6 w-6 rounded-full"/>
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
