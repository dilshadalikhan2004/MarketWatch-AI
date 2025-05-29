
"use client";
import React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StockCard } from '@/components/common/StockCard';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useWatchlist } from '@/hooks/use-watchlist';
import { getStockBySymbol, mockStocks } from '@/lib/mock-data';
import type { Stock } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";

export default function WatchlistPage() {
  const { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist, isLoaded } = useWatchlist();
  const { toast } = useToast();
  const [newSymbol, setNewSymbol] = React.useState('');
  const [error, setError] = React.useState('');

  const handleAddSymbol = () => {
    if (!newSymbol.trim()) {
      setError('Please enter a stock symbol.');
      return;
    }
    const symbolUpper = newSymbol.trim().toUpperCase();
    const stockExists = mockStocks.some(s => s.symbol.toUpperCase() === symbolUpper);
    if (!stockExists) {
      setError(`Stock symbol "${symbolUpper}" not found in available mock data.`);
      return;
    }
    if (isInWatchlist(symbolUpper)) {
      setError(`"${symbolUpper}" is already in your watchlist.`);
      return;
    }
    addToWatchlist(symbolUpper);
    toast({ title: "Stock Added", description: `${symbolUpper} added to your watchlist.` });
    setNewSymbol('');
    setError('');
  };

  const watchlistStocks: Stock[] = React.useMemo(() => {
    if (!isLoaded) return [];
    return watchlist
      .map(item => getStockBySymbol(item.symbol))
      .filter(stock => stock !== undefined) as Stock[];
  }, [watchlist, isLoaded]);

  return (
    <div className="w-full">
      <PageHeader
        title="My Watchlist"
        description="Track stocks you are interested in. Data sourced from mock data."
        icon={ListChecks}
      />
      
      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <CardTitle>Add Stock to Watchlist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 items-start">
            <div className="flex-grow">
              <Input
                type="text"
                placeholder="Enter stock symbol (e.g., AAPL)"
                value={newSymbol}
                onChange={(e) => {
                  setNewSymbol(e.target.value.toUpperCase());
                  if (error) setError('');
                }}
                className="max-w-xs"
              />
              {error && <p className="text-sm text-destructive mt-1">{error}</p>}
            </div>
            <Button onClick={handleAddSymbol}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Symbol
            </Button>
          </div>
        </CardContent>
      </Card>

      {!isLoaded && (
         <Card className="shadow-lg">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">Loading watchlist...</p>
          </CardContent>
        </Card>
      )}

      {isLoaded && watchlistStocks.length === 0 && (
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">Your watchlist is empty. Add some stocks to get started!</p>
          </CardContent>
        </Card>
      )}

      {watchlistStocks.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {watchlistStocks.map(stock => (
            <StockCard
              key={stock.symbol}
              stock={stock}
              actions={
                <Button variant="ghost" size="sm" onClick={() => { removeFromWatchlist(stock.symbol); toast({title: "Stock Removed", description: `${stock.symbol} removed from your watchlist.`})}}>
                  <Trash2 className="h-4 w-4 mr-1 text-destructive" /> Remove
                </Button>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
