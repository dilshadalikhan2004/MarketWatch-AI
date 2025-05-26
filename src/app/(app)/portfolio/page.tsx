
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Briefcase, PlusCircle, Trash2, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { useUserPortfolio } from '@/hooks/use-user-portfolio';
import { mockStocks, getUpdatedMockStocks, getStockBySymbol } from '@/lib/mock-data';
import type { UserPortfolioPosition, Stock } from '@/lib/types';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";


interface DisplayUserPortfolioPosition extends UserPortfolioPosition {
  name?: string;
  logoUrl?: string;
  dataAiHint?: string;
  currentPrice: number;
  initialCost: number;
  marketValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

export default function PortfolioPage() {
  const { positions, addPosition, removePosition, isLoaded: isPortfolioLoaded } = useUserPortfolio();
  const { toast } = useToast();

  const [currentStockData, setCurrentStockData] = useState<Stock[]>(mockStocks);

  const [newSymbol, setNewSymbol] = useState('');
  const [newShares, setNewShares] = useState('');
  const [newAvgPrice, setNewAvgPrice] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStockData(getUpdatedMockStocks());
    }, 3000); // Update stock prices every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const resetForm = () => {
    setNewSymbol('');
    setNewShares('');
    setNewAvgPrice('');
    setFormError(null);
  };

  const handleAddPosition = () => {
    setFormError(null);
    const symbol = newSymbol.trim().toUpperCase();
    const shares = parseFloat(newShares);
    const avgPrice = parseFloat(newAvgPrice);

    if (!symbol) {
      setFormError("Stock symbol is required.");
      return;
    }
    if (isNaN(shares) || shares <= 0) {
      setFormError("Number of shares must be a positive number.");
      return;
    }
    if (isNaN(avgPrice) || avgPrice <= 0) {
      setFormError("Average purchase price must be a positive number.");
      return;
    }
    const stockExists = mockStocks.some(s => s.symbol.toUpperCase() === symbol);
    if (!stockExists) {
      setFormError(`Stock symbol "${symbol}" not found in available mock data.`);
      return;
    }

    addPosition({ symbol, shares, avgPurchasePrice: avgPrice });
    toast({ title: "Position Added", description: `${shares} shares of ${symbol} added to your simulated portfolio.` });
    resetForm();
  };

  const enrichedPositions: DisplayUserPortfolioPosition[] = useMemo(() => {
    if (!isPortfolioLoaded) return [];
    return positions.map(pos => {
      const stockInfo = getStockBySymbol(pos.symbol) || currentStockData.find(s => s.symbol === pos.symbol);
      const currentPrice = stockInfo?.price || pos.avgPurchasePrice; // Fallback to purchase price if not found
      
      const initialCost = pos.shares * pos.avgPurchasePrice;
      const marketValue = pos.shares * currentPrice;
      const gainLoss = marketValue - initialCost;
      const gainLossPercent = initialCost !== 0 ? (gainLoss / initialCost) : 0;

      return {
        ...pos,
        name: stockInfo?.name,
        logoUrl: stockInfo?.logoUrl,
        dataAiHint: stockInfo?.dataAiHint,
        currentPrice,
        initialCost,
        marketValue,
        gainLoss,
        gainLossPercent,
      };
    });
  }, [positions, currentStockData, isPortfolioLoaded]);

  const portfolioTotals = useMemo(() => {
    const initialCost = enrichedPositions.reduce((sum, p) => sum + p.initialCost, 0);
    const marketValue = enrichedPositions.reduce((sum, p) => sum + p.marketValue, 0);
    const gainLoss = marketValue - initialCost;
    const gainLossPercent = initialCost !== 0 ? (gainLoss / initialCost) : 0;
    return { initialCost, marketValue, gainLoss, gainLossPercent };
  }, [enrichedPositions]);


  return (
    <div className="w-full">
      <PageHeader
        title="My Simulated Portfolio"
        description="Manage your hypothetical stock positions and track their simulated performance using mock market data."
        icon={Briefcase}
      />

      <Alert variant="default" className="mb-6 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="font-semibold text-blue-700 dark:text-blue-300">Simulation Environment</AlertTitle>
        <AlertDescription className="text-blue-600 dark:text-blue-400">
          This portfolio is for simulation and educational purposes only, using mock market data.
          It does not represent real investments or provide financial advice. Prices update based on mock data feeds.
        </AlertDescription>
      </Alert>

      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <CardTitle>Add New Position</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
            <div>
              <Label htmlFor="newSymbol">Stock Symbol</Label>
              <Input id="newSymbol" placeholder="e.g., AAPL" value={newSymbol} onChange={(e) => setNewSymbol(e.target.value.toUpperCase())} />
            </div>
            <div>
              <Label htmlFor="newShares">Number of Shares</Label>
              <Input id="newShares" type="number" placeholder="e.g., 10" value={newShares} onChange={(e) => setNewShares(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="newAvgPrice">Avg. Purchase Price</Label>
              <Input id="newAvgPrice" type="number" placeholder="e.g., 150.00" value={newAvgPrice} onChange={(e) => setNewAvgPrice(e.target.value)} />
            </div>
            <Button onClick={handleAddPosition} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Position
            </Button>
          </div>
          {formError && <p className="text-sm text-destructive mt-2">{formError}</p>}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Your Positions</CardTitle>
          <CardDescription>
            {isPortfolioLoaded && enrichedPositions.length > 0 
              ? `You have ${enrichedPositions.length} position(s) in your simulated portfolio.`
              : "Your simulated portfolio is empty."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isPortfolioLoaded ? (
            <p className="text-muted-foreground text-center py-4">Loading portfolio...</p>
          ) : enrichedPositions.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead className="text-right">Shares</TableHead>
                      <TableHead className="text-right">Avg. Buy Price</TableHead>
                      <TableHead className="text-right">Current Price</TableHead>
                      <TableHead className="text-right">Initial Cost</TableHead>
                      <TableHead className="text-right">Market Value</TableHead>
                      <TableHead className="text-right">Gain/Loss</TableHead>
                      <TableHead className="text-right">Gain/Loss %</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrichedPositions.map(pos => (
                      <TableRow key={pos.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {pos.logoUrl && <Image src={pos.logoUrl} alt={pos.name || pos.symbol} data-ai-hint={pos.dataAiHint || 'company logo'} width={24} height={24} className="rounded-full"/>}
                            <div>
                              <div>{pos.symbol}</div>
                              <div className="text-xs text-muted-foreground">{pos.name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{pos.shares}</TableCell>
                        <TableCell className="text-right">{formatCurrency(pos.avgPurchasePrice)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(pos.currentPrice)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(pos.initialCost)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(pos.marketValue)}</TableCell>
                        <TableCell className={cn("text-right", pos.gainLoss >= 0 ? "text-green-600" : "text-red-600")}>
                           {pos.gainLoss >= 0 ? <TrendingUp className="inline h-4 w-4 mr-1"/> : <TrendingDown className="inline h-4 w-4 mr-1"/>}
                           {formatCurrency(pos.gainLoss)}
                        </TableCell>
                        <TableCell className={cn("text-right", pos.gainLossPercent >= 0 ? "text-green-600" : "text-red-600")}>
                          {formatPercentage(pos.gainLossPercent)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => {removePosition(pos.id); toast({title: "Position Removed", description: `Position for ${pos.symbol} removed.`})}} aria-label="Remove position">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <CardFooter className="mt-6 border-t pt-4 flex-col items-start space-y-2">
                  <CardTitle className="text-lg mb-2">Portfolio Summary</CardTitle>
                  <div className="w-full flex justify-between items-center">
                      <span className="text-md font-semibold">Total Initial Cost:</span>
                      <span className="text-md font-semibold">{formatCurrency(portfolioTotals.initialCost)}</span>
                  </div>
                  <div className="w-full flex justify-between items-center">
                      <span className="text-md font-semibold">Total Market Value:</span>
                      <span className="text-md font-semibold">{formatCurrency(portfolioTotals.marketValue)}</span>
                  </div>
                  <div className="w-full flex justify-between items-center">
                      <span className="text-lg font-bold">Total Gain/Loss:</span>
                      <span className={cn("text-lg font-bold", portfolioTotals.gainLoss >= 0 ? "text-green-600" : "text-red-600")}>
                        {formatCurrency(portfolioTotals.gainLoss)} ({formatPercentage(portfolioTotals.gainLossPercent)})
                      </span>
                  </div>
              </CardFooter>
            </>
          ) : (
            <p className="text-muted-foreground text-center py-6">
              Your simulated portfolio is empty. Add some positions above to get started!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
