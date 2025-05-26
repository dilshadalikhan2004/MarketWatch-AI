import type { Stock } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

interface StockCardProps {
  stock: Stock;
  onAddToWatchlist?: (symbol: string) => void;
  className?: string;
}

export function StockCard({ stock, onAddToWatchlist, className }: StockCardProps) {
  const isPositive = stock.changePercent > 0;
  const isNegative = stock.changePercent < 0;
  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const colorClass = isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-muted-foreground';

  return (
    <Card className={cn("shadow-lg hover:shadow-xl transition-shadow duration-300", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {stock.logoUrl && <Image src={stock.logoUrl} alt={`${stock.name} logo`} width={40} height={40} className="rounded-full" data-ai-hint={`${stock.symbol} logo`} />}
            <div>
              <CardTitle className="text-lg font-bold">{stock.symbol}</CardTitle>
              <CardDescription className="text-xs truncate max-w-[150px]">{stock.name}</CardDescription>
            </div>
          </div>
          {onAddToWatchlist && (
            <Button variant="outline" size="sm" onClick={() => onAddToWatchlist(stock.symbol)}>
              Add to Watchlist
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-1">{formatCurrency(stock.price)}</div>
        <div className={`flex items-center text-sm ${colorClass} mb-2`}>
          <Icon className="h-4 w-4 mr-1" />
          <span>{formatCurrency(stock.change, undefined, Math.abs(stock.change) < 0.01 ? 4 : 2)} ({formatPercentage(stock.changePercent)})</span>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          {stock.volume && <div>Volume: {(stock.volume / 1_000_000).toFixed(2)}M</div>}
          {stock.marketCap && <div>Market Cap: {stock.marketCap}</div>}
        </div>
        {stock.dayHigh && stock.dayLow && (
            <div className="mt-2">
                <div className="h-2 w-full bg-secondary rounded-full">
                    <div 
                        className="h-2 bg-primary rounded-full" 
                        style={{ width: `${((stock.price - stock.dayLow) / (stock.dayHigh - stock.dayLow)) * 100}%`}}
                    />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{formatCurrency(stock.dayLow)}</span>
                    <span>{formatCurrency(stock.dayHigh)}</span>
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}

// Minimal version for lists
export function MinimalStockCard({ stock }: { stock: Stock }) {
  const isPositive = stock.changePercent > 0;
  const isNegative = stock.changePercent < 0;
  const colorClass = isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-muted-foreground';

  return (
    <Card className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        {stock.logoUrl && <Image src={stock.logoUrl} alt={`${stock.name} logo`} width={32} height={32} className="rounded-full" data-ai-hint={`${stock.symbol} logo`} />}
        <div>
          <p className="font-semibold">{stock.symbol}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-[180px]">{stock.name}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold">{formatCurrency(stock.price)}</p>
        <p className={`text-xs ${colorClass}`}>
          {stock.change > 0 ? '+' : ''}{formatCurrency(stock.change, undefined, Math.abs(stock.change) < 0.01 ? 4 : 2)} ({formatPercentage(stock.changePercent)})
        </p>
      </div>
    </Card>
  );
}
