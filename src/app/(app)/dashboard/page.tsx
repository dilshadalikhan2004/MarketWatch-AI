
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AreaChart, BarChart3, Newspaper, TrendingUp, TrendingDown, Zap, ArrowRight, AlertCircle, Wallet, RefreshCw } from 'lucide-react';
import { MinimalStockCard } from '@/components/common/StockCard';
import { NewsCard } from '@/components/common/NewsCard';
import { mockNews, mockMarketMovers as initialMarketMovers, mockSentimentData, mockPortfolio as basePortfolio, mockStocks } from '@/lib/mock-data';
import type { Stock, NewsArticle, MarketMover, SentimentDataPoint, PortfolioPosition as PortfolioPositionType } from '@/lib/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, Line, LineChart as RechartsLineChart, Cell } from 'recharts'; // Added Cell
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useRealtimeStockData } from '@/contexts/RealtimeStockContext';

const chartConfig = {
  price: { label: "Price", color: "hsl(var(--chart-1))" },
  positive: { label: "Positive", color: "hsl(var(--chart-4))" },
  negative: { label: "Negative", color: "hsl(var(--chart-5))" },
  neutral: { label: "Neutral", color: "hsl(var(--chart-3))" },
};

interface DisplayPortfolioPosition extends PortfolioPositionType {
  name?: string;
  logoUrl?: string;
  dataAiHint?: string;
  marketValue: number;
  initialCost: number;
  gainLoss: number;
  gainLossPercent: number;
  currentPrice: number;
}

export default function DashboardPage() {
  const { stockData: realtimeStockData, subscribeToSymbol, unsubscribeFromSymbol, refreshStockData, isLoading: isLoadingData, error: dataError } = useRealtimeStockData();
  const [isMounted, setIsMounted] = useState(false);

  // Symbols to track on the dashboard
  const dashboardTrackedSymbols = useMemo(() => [
    mockStocks.length > 0 ? mockStocks[0].symbol : '', // For Market Overview
    ...basePortfolio.map(p => p.symbol), // For Portfolio Snapshot
    ...initialMarketMovers.gainers.map(m => m.symbol),
    ...initialMarketMovers.losers.map(m => m.symbol),
    ...initialMarketMovers.active.map(m => m.symbol),
  ].filter(Boolean), []); // Filter out potential empty string if mockStocks is empty


  useEffect(() => {
    setIsMounted(true);
    const uniqueSymbols = Array.from(new Set(dashboardTrackedSymbols));
    uniqueSymbols.forEach(subscribeToSymbol);
    if (uniqueSymbols.length > 0) {
        console.log('[DashboardPage] Initial data fetch for symbols:', uniqueSymbols);
        refreshStockData(uniqueSymbols);
    }
    return () => {
      uniqueSymbols.forEach(unsubscribeFromSymbol);
    };
  }, [subscribeToSymbol, unsubscribeFromSymbol, refreshStockData, dashboardTrackedSymbols]);


  const marketOverviewStockSymbol = useMemo(() => mockStocks.length > 0 ? mockStocks[0].symbol : '', []);

  const marketOverviewStock = useMemo(() => {
    if (!marketOverviewStockSymbol) return null;
    const baseStock = mockStocks.find(s => s.symbol === marketOverviewStockSymbol);
    const rtData = realtimeStockData[marketOverviewStockSymbol];
    if (rtData && isMounted) { // Only use rtData if component is mounted to avoid hydration issues with initial data
      return { ...baseStock, ...rtData, name: baseStock?.name || rtData.symbol, logoUrl: baseStock?.logoUrl, dataAiHint: baseStock?.dataAiHint, chartData: rtData.chartData || baseStock?.chartData || [] } as Stock;
    }
    return baseStock || null;
  }, [marketOverviewStockSymbol, realtimeStockData, isMounted]);
  

  const portfolioData: DisplayPortfolioPosition[] = useMemo(() => {
    return basePortfolio.map(pos => {
      const baseStockInfo = mockStocks.find(s => s.symbol === pos.symbol);
      const currentRealtimeData = realtimeStockData[pos.symbol];
      // Use realtime price if available and mounted, otherwise fallback
      const currentPrice = (isMounted && currentRealtimeData?.price) ? currentRealtimeData.price : (baseStockInfo?.price || pos.avgPurchasePrice);
      
      const initialCost = pos.shares * pos.avgPurchasePrice;
      const marketValue = pos.shares * currentPrice;
      const gainLoss = marketValue - initialCost;
      const gainLossPercent = initialCost !== 0 ? (gainLoss / initialCost) : 0;

      return {
        ...pos,
        name: baseStockInfo?.name || pos.symbol,
        logoUrl: baseStockInfo?.logoUrl,
        dataAiHint: baseStockInfo?.dataAiHint,
        currentPrice: currentPrice,
        marketValue,
        initialCost,
        gainLoss,
        gainLossPercent,
      };
    });
  }, [realtimeStockData, isMounted]);

  const portfolioTotals = useMemo(() => {
    const totalMarketValue = portfolioData.reduce((sum, item) => sum + item.marketValue, 0);
    const totalInitialCost = portfolioData.reduce((sum, item) => sum + item.initialCost, 0);
    const totalGainLoss = totalMarketValue - totalInitialCost;
    const totalGainLossPercent = totalInitialCost !== 0 ? (totalGainLoss / totalInitialCost) : 0;
    return { marketValue: totalMarketValue, initialCost: totalInitialCost, gainLoss: totalGainLoss, gainLossPercent: totalGainLossPercent };
  }, [portfolioData]);
  
  const currentMarketMovers = useMemo(() => {
    const updateMoverList = (list: MarketMover[]) => {
      return list.map(mover => {
        const rtData = realtimeStockData[mover.symbol];
        return (isMounted && rtData) ? { ...mover, ...rtData } : mover;
      })
    };
    const gainers = updateMoverList(initialMarketMovers.gainers).sort((a,b) => (b.changePercent || 0) - (a.changePercent || 0));
    const losers = updateMoverList(initialMarketMovers.losers).sort((a,b) => (a.changePercent || 0) - (b.changePercent || 0));
    const active = updateMoverList(initialMarketMovers.active).sort((a,b) => 
        (realtimeStockData[b.symbol]?.dailyVolume || parseFloat(b.volume?.replace(/[^0-9.]/g, '') || '0')) - 
        (realtimeStockData[a.symbol]?.dailyVolume || parseFloat(a.volume?.replace(/[^0-9.]/g, '') || '0'))
    );
    return {gainers, losers, active};
  }, [realtimeStockData, isMounted]);


  const renderMarketMoverCard = (mover: MarketMover) => {
    const rtData = realtimeStockData[mover.symbol];
    const displayData = (isMounted && rtData) ? { ...mover, ...rtData } : mover;
    return <MinimalStockCard key={mover.symbol} stock={displayData} className="w-full" />;
  };
  
  if (!isMounted && isLoadingData) { // Show loading skeleton if not mounted and data is loading
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="text-center">
                <svg className="mx-auto h-12 w-12 animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-4 text-lg text-foreground">Loading Dashboard Data...</p>
            </div>
        </div>
    );
  }
  
  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Dashboard Overview"
        description="Market insights at a glance. Data fetched from Alpha Vantage."
        icon={AreaChart}
        actions={
          <Button onClick={() => refreshStockData(Array.from(new Set(dashboardTrackedSymbols)))} disabled={isLoadingData} variant="outline">
            <RefreshCw className={cn("mr-2 h-4 w-4", isLoadingData && "animate-spin")} />
            Refresh Data
          </Button>
        }
      />
      {isLoadingData && isMounted && <p className="text-sm text-muted-foreground">Fetching latest data...</p>}
      {dataError && isMounted && (
        <Alert variant="destructive" className="max-w-full">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Data Fetching Error</AlertTitle>
            <AlertDescription>{dataError} Some data might be outdated or unavailable. This could be due to API limits.</AlertDescription>
        </Alert>
      )}


      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (Market Overview & Portfolio Snapshot) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Market Overview: {marketOverviewStock?.name || marketOverviewStockSymbol} ({marketOverviewStockSymbol})</span>
                {marketOverviewStock?.logoUrl && <img src={marketOverviewStock.logoUrl} alt={`${marketOverviewStock.name} logo`} data-ai-hint={marketOverviewStock.dataAiHint || 'company logo'} className="h-8 w-8 rounded-full" />}
              </CardTitle>
              {marketOverviewStock && (
                <CardDescription>
                  Price: {formatCurrency(marketOverviewStock.price)}
                  {isMounted && marketOverviewStock.change !== undefined ? (
                    <span className={cn(marketOverviewStock.change >= 0 ? 'text-green-500' : 'text-red-500', "ml-1")}>
                      {' '} ({marketOverviewStock.change >= 0 ? '+' : ''}{formatCurrency(marketOverviewStock.change)} / {formatPercentage(marketOverviewStock.changePercent, 2)})
                    </span>
                  ) : (
                    <span className="ml-1">(...)</span> 
                  )}
                   {isLoadingData && marketOverviewStockSymbol === marketOverviewStock?.symbol && <span className="ml-2 text-xs">(Updating...)</span>}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {isMounted && marketOverviewStock && marketOverviewStock.chartData && marketOverviewStock.chartData.length > 1 ? (
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                  <RechartsLineChart data={marketOverviewStock.chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      tickMargin={8} 
                      tickFormatter={(value) => `$${value.toFixed(0)}`}
                      domain={['dataMin - 5', 'dataMax + 5']}
                    />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" hideLabel />} />
                    <Line type="monotone" dataKey="price" stroke="var(--color-price)" strokeWidth={2} dot={false} />
                  </RechartsLineChart>
                </ChartContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  {isMounted && marketOverviewStock ? "Not enough historical data for chart." : "Loading chart data..."}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" />Portfolio Snapshot</CardTitle>
              <CardDescription>A sample overview of your investment performance. Prices from Alpha Vantage (may be delayed).</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="default" className="mb-4 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-blue-700 dark:text-blue-300 font-semibold">Sample Data</AlertTitle>
                <AlertDescription className="text-blue-600 dark:text-blue-400">
                  The portfolio data displayed below is for demonstration purposes only, using dynamic mock prices or delayed data from Alpha Vantage.
                </AlertDescription>
              </Alert>
              {isMounted && portfolioData.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Symbol</TableHead>
                          <TableHead className="text-right">Shares</TableHead>
                          <TableHead className="text-right">Avg. Price</TableHead>
                          <TableHead className="text-right">Current Price</TableHead>
                          <TableHead className="text-right">Mkt Value</TableHead>
                          <TableHead className="text-right">Gain/Loss</TableHead>
                          <TableHead className="text-right">Gain/Loss %</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {portfolioData.map((item) => (
                          <TableRow key={item.symbol}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {item.logoUrl && <img src={item.logoUrl} alt={item.name || item.symbol} data-ai-hint={item.dataAiHint || 'company logo'} className="h-6 w-6 rounded-full"/>}
                                <div>
                                  <div>{item.symbol}</div>
                                  <div className="text-xs text-muted-foreground">{item.name}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{item.shares}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.avgPurchasePrice)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.currentPrice)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.marketValue)}</TableCell>
                            <TableCell className={cn("text-right", item.gainLoss >= 0 ? "text-green-600" : "text-red-600")}>
                              {item.gainLoss >= 0 ? <TrendingUp className="inline h-4 w-4 mr-1"/> : <TrendingDown className="inline h-4 w-4 mr-1"/>}
                              {formatCurrency(item.gainLoss)}
                            </TableCell>
                            <TableCell className={cn("text-right", item.gainLossPercent >= 0 ? "text-green-600" : "text-red-600")}>
                              {formatPercentage(item.gainLossPercent)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-6 border-t pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-md font-semibold">Total Initial Cost:</span>
                      <span className="text-md font-semibold">{formatCurrency(portfolioTotals.initialCost)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-md font-semibold">Total Market Value:</span>
                      <span className="text-md font-semibold">{formatCurrency(portfolioTotals.marketValue)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Total Gain/Loss:</span>
                      <span className={cn("text-lg font-bold", portfolioTotals.gainLoss >= 0 ? "text-green-600" : "text-red-600")}>
                        {formatCurrency(portfolioTotals.gainLoss)} ({formatPercentage(portfolioTotals.gainLossPercent)})
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  {isMounted ? "Loading portfolio data or no positions held." : "Loading..."}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Market Movers & Quick Actions) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Market Movers</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="gainers" className="w-full">
                <TabsList className="flex w-full">
                  <TabsTrigger value="gainers" className="flex-1 w-full"><TrendingUp className="mr-1 h-4 w-4" />Gainers</TabsTrigger>
                  <TabsTrigger value="losers" className="flex-1 w-full"><TrendingDown className="mr-1 h-4 w-4" />Losers</TabsTrigger>
                  <TabsTrigger value="active" className="flex-1 w-full"><Zap className="mr-1 h-4 w-4" />Active</TabsTrigger>
                </TabsList>
                <TabsContent value="gainers" className="mt-4 space-y-3">
                  {isMounted ? currentMarketMovers.gainers.map(renderMarketMoverCard) : <p>Loading...</p>}
                </TabsContent>
                <TabsContent value="losers" className="mt-4 space-y-3">
                   {isMounted ? currentMarketMovers.losers.map(renderMarketMoverCard) : <p>Loading...</p>}
                </TabsContent>
                <TabsContent value="active" className="mt-4 space-y-3">
                   {isMounted ? currentMarketMovers.active.map(renderMarketMoverCard) : <p>Loading...</p>}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
           <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>News Sentiment</CardTitle>
               <CardDescription>Overall sentiment from recent news.</CardDescription>
            </CardHeader>
            <CardContent>
              {isMounted ? (
                <ChartContainer config={chartConfig} className="h-[150px] w-full">
                  <RechartsBarChart data={mockSentimentData} layout="vertical" margin={{left:10, right:10}}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Bar dataKey="value" radius={5}>
                      {mockSentimentData.map((entry) => (
                          <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                        ))}
                    </Bar>
                  </RechartsBarChart>
                </ChartContainer>
              ) : <p>Loading chart...</p>}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Recent News Section */}
      <Card className="shadow-lg w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Recent News
            <Button variant="outline" size="sm" asChild>
              <Link href="/sentiment">View All News <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardTitle>
          <CardDescription>Latest headlines impacting the market.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isMounted ? mockNews.slice(0, 3).map(article => (
            <NewsCard key={article.id} article={article} />
          )) : <p>Loading news...</p>}
        </CardContent>
      </Card>
    </div>
  );
}
