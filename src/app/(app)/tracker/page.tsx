"use client";
import { PageHeader } from "@/components/common/PageHeader";
import { StockCard } from "@/components/common/StockCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getStockBySymbol, mockStocks, getUpdatedMockStocks } from "@/lib/mock-data";
import type { Stock } from "@/lib/types";
import { LineChart, Search, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import React, { useState, useEffect, FormEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { LineChart as RechartsLineChart, Line as RechartsLine, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Area, AreaChart as RechartsAreaChart } from "recharts";


const generatePriceHistory = (basePrice: number, days: number) => {
  const history = [];
  let currentPrice = basePrice;
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    history.push({
      date: date.toISOString().split('T')[0],
      price: parseFloat(currentPrice.toFixed(2)),
    });
    currentPrice *= (1 + (Math.random() - 0.5) * 0.05); // Fluctuate by up to 5%
  }
  return history;
};

const chartConfig = {
  price: { label: "Price", color: "hsl(var(--primary))" },
} satisfies ChartConfig;


export default function TrackerPage() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchedStock, setSearchedStock] = useState<Stock | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [priceHistory, setPriceHistory] = useState<{ date: string, price: number }[]>([]);
  const [liveStocks, setLiveStocks] = useState<Stock[]>(mockStocks);

  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      const updatedStocks = getUpdatedMockStocks();
      setLiveStocks(updatedStocks);
      if (searchedStock) {
        const updatedSearchedStock = updatedStocks.find(s => s.symbol === searchedStock.symbol);
        if (updatedSearchedStock) {
          setSearchedStock(updatedSearchedStock);
           setPriceHistory(prev => {
            if (prev.length === 0) return generatePriceHistory(updatedSearchedStock.price, 30);
            const newEntry = { date: new Date().toISOString().split('T')[0], price: updatedSearchedStock.price };
            const updatedHistory = [...prev.slice(-29), newEntry]; // Keep last 30 points
            // Check if date already exists, if so, update price, else add new
            const existingIndex = updatedHistory.findIndex(p => p.date === newEntry.date);
            if(existingIndex !== -1 && existingIndex !== updatedHistory.length -1) { // if it's not the last one
                 updatedHistory[existingIndex] = newEntry; // Update if date already exists (e.g. multiple updates in a day)
            } else if (existingIndex === -1 || updatedHistory[updatedHistory.length-1].date !== newEntry.date) {
                 updatedHistory.push(newEntry); // Add if new date
            }
            return updatedHistory.slice(-30);
          });
        }
      }
    }, 2000); // Update prices every 2 seconds for more "live" feel
    return () => clearInterval(interval);
  }, [searchedStock]);


  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setError("Please enter a stock symbol.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSearchedStock(null);
    setPriceHistory([]);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    const stock = getStockBySymbol(searchTerm);

    if (stock) {
      setSearchedStock(stock);
      setPriceHistory(generatePriceHistory(stock.price, 30));
      toast({ title: "Stock Found", description: `Displaying details for ${stock.name} (${stock.symbol}).` });
    } else {
      setError(`Stock symbol "${searchTerm.toUpperCase()}" not found.`);
      toast({ title: "Not Found", description: `Stock symbol "${searchTerm.toUpperCase()}" not found.`, variant: "destructive" });
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Live Stock Tracker" 
        icon={LineChart} 
        description="Search for real-time stock prices and view detailed information." 
      />

      <Card>
        <CardHeader>
          <CardTitle>Search Stock</CardTitle>
          <CardDescription>Enter a stock symbol (e.g., AAPL, MSFT, TSLA) to track its performance.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter stock symbol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
              className="max-w-sm"
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="p-4">
            <div className="flex items-center text-destructive">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p className="font-semibold">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {searchedStock && (
        <Card className="shadow-xl">
           <CardHeader>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                {searchedStock.logoUrl && <Image src={searchedStock.logoUrl} alt={`${searchedStock.name} logo`} width={48} height={48} className="rounded-full" data-ai-hint={`${searchedStock.symbol} logo`} />}
                <div>
                    <CardTitle className="text-2xl font-bold">{searchedStock.symbol} - {searchedStock.name}</CardTitle>
                    <CardDescription>Real-time price and performance data.</CardDescription>
                </div>
                </div>
                <div className={`text-right ${searchedStock.changePercent > 0 ? 'text-green-600' : searchedStock.changePercent < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                    <div className="text-3xl font-bold">{formatCurrency(searchedStock.price)}</div>
                    <div className="text-sm flex items-center justify-end">
                        {searchedStock.changePercent > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : searchedStock.changePercent < 0 ? <TrendingDown className="h-4 w-4 mr-1" /> : null}
                        {formatCurrency(searchedStock.change, undefined, Math.abs(searchedStock.change) < 0.01 ? 4 : 2)} ({formatPercentage(searchedStock.changePercent)})
                    </div>
                </div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Price Chart (Last 30 Days)</h3>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <ResponsiveContainer>
                   <RechartsAreaChart data={priceHistory} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                    <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} stroke="hsl(var(--muted-foreground))" />
                    <YAxis domain={['dataMin - 2', 'dataMax + 2']} tickFormatter={(value) => `$${value.toFixed(0)}`} stroke="hsl(var(--muted-foreground))" />
                    <ChartTooltip
                        cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, fill: 'hsl(var(--primary) / 0.1)' }}
                        content={<ChartTooltipContent indicator="line" labelFormatter={(value, payload) => payload?.[0]?.payload.date ? new Date(payload[0].payload.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''} />}
                    />
                    <Area type="monotone" dataKey="price" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={2} />
                  </RechartsAreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Key Statistics</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {[
                    { label: "Previous Close", value: searchedStock.previousClose && formatCurrency(searchedStock.previousClose) },
                    { label: "Open", value: searchedStock.open && formatCurrency(searchedStock.open) },
                    { label: "Day's High", value: searchedStock.dayHigh && formatCurrency(searchedStock.dayHigh) },
                    { label: "Day's Low", value: searchedStock.dayLow && formatCurrency(searchedStock.dayLow) },
                    { label: "52 Week High", value: searchedStock.yearHigh && formatCurrency(searchedStock.yearHigh) },
                    { label: "52 Week Low", value: searchedStock.yearLow && formatCurrency(searchedStock.yearLow) },
                    { label: "Volume", value: searchedStock.volume && (searchedStock.volume / 1_000_000).toFixed(2) + "M" },
                    { label: "Market Cap", value: searchedStock.marketCap },
                ].map(item => item.value ? (
                    <React.Fragment key={item.label}>
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-medium text-right">{item.value}</span>
                    </React.Fragment>
                ) : null)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {!searchedStock && !isLoading && !error && (
        <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Search for a stock to see its live data and performance chart.</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}

// Loader component (if not already globally available or part of Button)
const Loader2 = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);
