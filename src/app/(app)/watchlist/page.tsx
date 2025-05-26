"use client";
import { PageHeader } from "@/components/common/PageHeader";
import { StockCard, MinimalStockCard } from "@/components/common/StockCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWatchlist } from "@/hooks/use-watchlist";
import { mockStocks, getStockBySymbol, getUpdatedMockStocks } from "@/lib/mock-data";
import type { Stock } from "@/lib/types";
import { Star, PlusCircle, Trash2, ListChecks, Search } from "lucide-react";
import React, { useState, FormEvent, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function WatchlistPage() {
  const { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist, isLoaded } = useWatchlist();
  const [newSymbol, setNewSymbol] = useState<string>("");
  const [watchlistStocks, setWatchlistStocks] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Combined loading for watchlist and prices
  const { toast } = useToast();

  // Effect to fetch stock data for symbols in watchlist
  useEffect(() => {
    if (isLoaded) {
      const symbolsToFetch = watchlist.filter(symbol => 
        !watchlistStocks.find(stock => stock.symbol === symbol)
      );
      
      const fetchedStocks: Stock[] = symbolsToFetch
        .map(symbol => getStockBySymbol(symbol))
        .filter((stock): stock is Stock => stock !== undefined);

      // Filter out stocks that are no longer in the watchlist
      const currentWatchlistStocks = watchlistStocks.filter(stock => watchlist.includes(stock.symbol));
      
      setWatchlistStocks(prev => {
        const existingSymbols = new Set(prev.map(s => s.symbol));
        const newStocksToAdd = fetchedStocks.filter(s => !existingSymbols.has(s.symbol));
        return [...currentWatchlistStocks, ...newStocksToAdd];
      });
      
      setIsLoading(false);
    }
  }, [watchlist, isLoaded]); // Removed watchlistStocks from dependencies to avoid loop

  // Effect to update prices periodically
   useEffect(() => {
    if (!isLoaded || watchlistStocks.length === 0) return;

    const interval = setInterval(() => {
      const updatedMarketStocks = getUpdatedMockStocks();
      setWatchlistStocks(prevStocks => 
        prevStocks.map(ws => {
          const updatedVersion = updatedMarketStocks.find(ums => ums.symbol === ws.symbol);
          return updatedVersion ? updatedVersion : ws; // Keep old if not found (should not happen with mock)
        })
      );
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [isLoaded, watchlistStocks.length]); // Only re-run if isLoaded or stock list length changes

  const handleAddStock = (e: FormEvent) => {
    e.preventDefault();
    if (!newSymbol.trim()) {
      toast({ title: "Error", description: "Please enter a stock symbol.", variant: "destructive" });
      return;
    }
    const stockToAdd = getStockBySymbol(newSymbol);
    if (!stockToAdd) {
      toast({ title: "Not Found", description: `Stock symbol "${newSymbol.toUpperCase()}" not found.`, variant: "destructive" });
      return;
    }
    if (isInWatchlist(stockToAdd.symbol)) {
      toast({ title: "Already Added", description: `${stockToAdd.symbol} is already in your watchlist.`, variant: "default" });
      return;
    }

    const added = addToWatchlist(stockToAdd.symbol);
    if (added) {
      setWatchlistStocks(prev => [...prev, stockToAdd]);
      toast({ title: "Stock Added", description: `${stockToAdd.name} (${stockToAdd.symbol}) added to watchlist.` });
      setNewSymbol("");
    }
  };

  const handleRemoveStock = (symbol: string) => {
    removeFromWatchlist(symbol);
    setWatchlistStocks(prev => prev.filter(stock => stock.symbol !== symbol));
    toast({ title: "Stock Removed", description: `${symbol} removed from watchlist.` });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="My Watchlist" 
        icon={Star} 
        description="Personalize and track your favorite stocks." 
      />

      <Card>
        <CardHeader>
          <CardTitle>Add Stock to Watchlist</CardTitle>
          <CardDescription>Enter a stock symbol to add it to your watchlist.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddStock} className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter stock symbol (e.g., AAPL)"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
              className="max-w-sm"
            />
            <Button type="submit">
              <PlusCircle className="h-4 w-4 mr-2" /> Add Stock
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary" /> Watched Stocks</CardTitle>
          <CardDescription>Real-time updates for your selected stocks.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !isLoaded && <p className="text-muted-foreground">Loading watchlist...</p>}
          {!isLoading && watchlist.length === 0 && (
             <div className="text-center py-10 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Your watchlist is empty.</p>
                <p>Add stocks using the form above to start tracking.</p>
            </div>
          )}
          {!isLoading && watchlist.length > 0 && watchlistStocks.length === 0 && <p className="text-muted-foreground">Loading stock data...</p>}
          
          {watchlistStocks.length > 0 && (
            <div className="space-y-4">
              {watchlistStocks.map(stock => (
                <div key={stock.symbol} className="relative group">
                  <MinimalStockCard stock={stock} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1/2 right-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemoveStock(stock.symbol)}
                    aria-label={`Remove ${stock.symbol} from watchlist`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
