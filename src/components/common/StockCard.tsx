
import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import type { Stock } from '@/lib/types';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import Image from 'next/image'; // Using next/image

interface StockCardProps {
  stock: Stock;
  className?: string;
  actions?: React.ReactNode;
}

export function StockCard({ stock, className, actions }: StockCardProps) {
  const isPositiveChange = stock.change >= 0;

  return (
    <Card className={cn("shadow-lg hover:shadow-xl transition-shadow duration-200 flex flex-col", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {stock.logoUrl && (
              <Image 
                src={stock.logoUrl} 
                alt={`${stock.name} logo`} 
                width={32} 
                height={32} 
                className="rounded-full object-contain"
                data-ai-hint={stock.dataAiHint || 'company logo'}
              />
            )}
            <CardTitle className="text-lg truncate" title={stock.name}>{stock.name}</CardTitle>
          </div>
          <span className="text-sm font-medium text-muted-foreground flex-shrink-0">{stock.symbol}</span>
        </div>
        <CardDescription className="truncate" title={stock.name}>
          {formatCurrency(stock.price)}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow pt-0">
        <div className={cn("flex items-center text-sm", isPositiveChange ? "text-green-600" : "text-red-600")}>
          {isPositiveChange ? <TrendingUp className="mr-1 h-4 w-4" /> : <TrendingDown className="mr-1 h-4 w-4" />}
          <span>{isPositiveChange ? '+' : ''}{formatCurrency(stock.change, '', 2)}</span>
          <span className="mx-1">/</span>
          <span>({isPositiveChange ? '+' : ''}{formatPercentage(stock.changePercent, 2)})</span>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          <p>Market Cap: {stock.marketCap || 'N/A'}</p>
          <p>Volume: {stock.volume || 'N/A'}</p>
        </div>
      </CardContent>
      <CardFooter className="pt-3 flex items-center justify-between">
        {actions || (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/stock/${stock.symbol}`}>
              View Details <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

interface MinimalStockCardProps {
  stock: Stock;
  className?: string;
}

export function MinimalStockCard({ stock, className }: MinimalStockCardProps) {
  const isPositiveChange = stock.change >= 0;
  return (
    <Link href={`/stock/${stock.symbol}`} className="block">
      <Card className={cn("hover:bg-muted/50 transition-colors", className)}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
               {stock.logoUrl && (
                <Image 
                    src={stock.logoUrl} 
                    alt={`${stock.name} logo`} 
                    width={24} 
                    height={24} 
                    className="rounded-full object-contain"
                    data-ai-hint={stock.dataAiHint || 'company logo'}
                />
                )}
              <span className="font-semibold text-sm truncate">{stock.symbol}</span>
            </div>
            <div className={cn("text-xs font-medium", isPositiveChange ? "text-green-600" : "text-red-600")}>
              {isPositiveChange ? '+' : ''}{formatPercentage(stock.changePercent, 2)}
            </div>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{stock.name}</p>
          <p className="text-sm font-semibold mt-0.5">{formatCurrency(stock.price)}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
