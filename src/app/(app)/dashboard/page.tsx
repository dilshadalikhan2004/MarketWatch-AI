
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
import { generateMockNews, mockMarketMovers as initialMarketMovers, mockSentimentData, mockPortfolio as basePortfolio, mockStocks } from '@/lib/mock-data';
import type { Stock, NewsArticle, MarketMover, SentimentDataPoint, PortfolioPosition as PortfolioPositionType } from '@/lib/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, Line, LineChart as RechartsLineChart, Cell } from 'recharts';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useRealtimeStockData } from '@/contexts/RealtimeStockContext';
import { getNewsArticlesAction } from '@/lib/actions/news';

const chartConfig = {
  price: { label: "Price", color: "hsl(var(--chart-1))" },
  positive: { label: "Positive", color: "hsl(var(--chart-4))" },
  negative: { label: "Negative", color: "hsl(var(--chart-5))" },
  neutral: { label: "Neutral", color: "hsl(var(--chart-3))" },
};


export default function DashboardPage() {
  const { stockData: realtimeStockData, subscribeToSymbol, unsubscribeFromSymbol, refreshStockData, isLoading: isLoadingRealtime, error: dataError } = useRealtimeStockData();
  const [isMounted, setIsMounted] = useState(false);
  const [recentNews, setRecentNews] = useState<NewsArticle[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);

  const marketOverviewStockSymbol = useMemo(() => mockStocks.length > 0 ? mockStocks[0].symbol : 'AAPL', []);
  const selectedMarketSymbol = marketOverviewStockSymbol;


  const allDashboardSymbolsToRefresh = useMemo(() => Array.from(new Set([
    selectedMarketSymbol,
    ...basePortfolio.map(p => p.symbol),
    ...initialMarketMovers.gainers.map(m => m.symbol),
    ...initialMarketMovers.losers.map(m => m.symbol),
    ...initialMarketMovers.active.map(m => m.symbol),
  ].filter(Boolean))), [selectedMarketSymbol]);

  useEffect(() => {
    setIsMounted(true);
    // Subscribe to necessary symbols
    allDashboardSymbolsToRefresh.forEach(subscribeToSymbol);

    const fetchNewsAndInitialStock = async () => {
      // console.log('[DashboardPage] useEffect: Attempting to fetch news and initial stock...');
      setIsLoadingNews(true);
      setNewsError(null);
      try {
        const newsResult = await getNewsArticlesAction('finance market', 3);
        // console.log('[DashboardPage] useEffect: News fetch result:', newsResult);
        if (newsResult.error) {
          setNewsError(newsResult.error);
        } else if (newsResult.articles) {
          setRecentNews(newsResult.articles);
        }
      } catch (e: any) {
        console.error("[DashboardPage] Exception during news fetch:", e);
        setNewsError("An unexpected error occurred while fetching news.");
      } finally {
        setIsLoadingNews(false);
      }

      if (selectedMarketSymbol) {
        // console.log('[DashboardPage] Initial auto-fetch for market overview stock:', selectedMarketSymbol);
        await refreshStockData([selectedMarketSymbol]);
      }
    };

    fetchNewsAndInitialStock();

    return () => {
      allDashboardSymbolsToRefresh.forEach(unsubscribeFromSymbol);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, marketOverviewStockSymbol]); // Keep refreshStockData, sub/unsub out of deps if they are stable


  const marketOverviewStock = useMemo(() => {
    if (!selectedMarketSymbol) return null;
    const baseStock = mockStocks.find(s => s.symbol === selectedMarketSymbol);
    const rtData = realtimeStockData[selectedMarketSymbol];
    if (isMounted && rtData && rtData.price !== undefined) {
      return { ...baseStock, ...rtData, name: baseStock?.name || rtData.symbol, logoUrl: baseStock?.logoUrl, dataAiHint: baseStock?.dataAiHint, chartData: rtData.chartData || baseStock?.chartData || [] } as Stock;
    }
    return baseStock || { symbol: selectedMarketSymbol, name: selectedMarketSymbol, price: 0, change:0, changePercent:0, chartData: [] } as Stock;
  }, [selectedMarketSymbol, realtimeStockData, isMounted]);


  const portfolioData: PortfolioPositionType[] = useMemo(() => {
    return basePortfolio.map(pos => {
      const baseStockInfo = mockStocks.find(s => s.symbol === pos.symbol);
      const currentRealtimeData = realtimeStockData[pos.symbol];

      const currentPrice = (isMounted && currentRealtimeData?.price !== undefined) ? currentRealtimeData.price : (baseStockInfo?.price || pos.avgPurchasePrice);

      const initialCost = pos.shares * pos.avgPurchasePrice;
      const marketValue = pos.shares * currentPrice;
      const gainLoss = marketValue - initialCost;
      const gainLossPercent = initialCost !== 0 ? (gainLoss / initialCost) : 0;

      return {
        ...pos,
        name: currentRealtimeData?.name || baseStockInfo?.name || pos.symbol,
        logoUrl: currentRealtimeData?.logoUrl || baseStockInfo?.logoUrl,
        dataAiHint: currentRealtimeData?.dataAiHint || baseStockInfo?.dataAiHint,
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
    const updateMoverList = (list: MarketMover[]): MarketMover[] => {
      return list.map(mover => {
        const baseMoverInfo = mockStocks.find(s => s.symbol === mover.symbol);
        const rtData = realtimeStockData[mover.symbol];
        if (isMounted && rtData && rtData.price !== undefined) {
          return { ...baseMoverInfo, ...rtData, name: baseMoverInfo?.name || rtData.name || mover.symbol, type: mover.type } as MarketMover;
        }
        return { ...baseMoverInfo, ...mover, name: baseMoverInfo?.name || mover.name || mover.symbol } as MarketMover;
      }).filter(mover => mover.symbol && mover.name);
    };
    const gainers = updateMoverList(initialMarketMovers.gainers).sort((a,b) => (b.changePercent || 0) - (a.changePercent || 0));
    const losers = updateMoverList(initialMarketMovers.losers).sort((a,b) => (a.changePercent || 0) - (b.changePercent || 0));
    const active = updateMoverList(initialMarketMovers.active).sort((a,b) => {
        const volumeA = realtimeStockData[a.symbol]?.dailyVolume ?? parseFloat(a.volume?.replace(/[^0-9.]/g, '') || '0');
        const volumeB = realtimeStockData[b.symbol]?.dailyVolume ?? parseFloat(b.volume?.replace(/[^0-9.]/g, '') || '0');
        return volumeB - volumeA;
    });
    return {gainers, losers, active};
  }, [realtimeStockData, isMounted]);


  const renderMarketMoverCard = (mover: MarketMover) => {
    const baseStock = mockStocks.find(s => s.symbol === mover.symbol) || mover;
    const rtData = realtimeStockData[mover.symbol];
    const displayData = (isMounted && rtData && rtData.price !== undefined)
      ? { ...baseStock, ...rtData, name: baseStock.name || rtData.name || mover.symbol, type: mover.type }
      : { ...baseStock, name: baseStock.name || mover.name || mover.symbol, type: mover.type };

    return <MinimalStockCard key={mover.symbol} stock={displayData as Stock} className="w-full" />;
  };

  const handleRefreshAllDashboardData = async () => {
    if (allDashboardSymbolsToRefresh.length > 0) {
        // console.log('[DashboardPage] Manual refresh triggered for symbols:', allDashboardSymbolsToRefresh);
        await refreshStockData(allDashboardSymbolsToRefresh);
    }
    // Re-fetch news on manual refresh too
    // console.log('[DashboardPage] Manual Refresh: Attempting to fetch news...');
    setIsLoadingNews(true);
    setNewsError(null);
    try {
        const result = await getNewsArticlesAction('finance market', 3);
        // console.log('[DashboardPage] Manual Refresh: News fetch result:', result);
        if (result.error) {
          setNewsError(result.error);
        } else if (result.articles) {
          setRecentNews(result.articles);
        }
    } catch(e: any) {
        console.error("[DashboardPage] Manual Refresh: Exception during news fetch:", e);
        setNewsError("An unexpected error occurred while fetching news.");
    } finally {
        setIsLoadingNews(false);
    }
  };

  if (!isMounted && isLoadingRealtime && !marketOverviewStock) {
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
        description="Market insights at a glance. Stock data from Alpha Vantage, News from NewsAPI.org."
        icon={AreaChart}
        actions={
          <Button onClick={handleRefreshAllDashboardData} disabled={isLoadingRealtime || isLoadingNews} variant="outline">
            <RefreshCw className={cn("mr-2 h-4 w-4", (isLoadingRealtime || isLoadingNews) && "animate-spin")} />
            Refresh Data
          </Button>
        }
      />
      {(isLoadingRealtime || isLoadingNews) && isMounted && <p className="text-sm text-muted-foreground">Fetching latest data...</p>}
      {dataError && isMounted && (
        <Alert variant="destructive" className="max-w-full">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Stock Data Error</AlertTitle>
            <AlertDescription>{dataError}</AlertDescription>
        </Alert>
      )}


      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (Market Overview & Portfolio Snapshot) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Market Overview: {marketOverviewStock?.name || selectedMarketSymbol} ({selectedMarketSymbol})</span>
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
                    <span className="ml-1">(Mock data or loading...)</span>
                  )}
                   {isLoadingRealtime && marketOverviewStock.symbol === selectedMarketSymbol && <span className="ml-2 text-xs">(Updating...)</span>}
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
              <CardDescription>A sample overview of your investment performance. Click "Refresh Data" for latest Alpha Vantage prices (API limits apply).</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="default" className="mb-4 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-blue-700 dark:text-blue-300 font-semibold">Sample Data & API Limits</AlertTitle>
                <AlertDescription className="text-blue-600 dark:text-blue-400">
                  This portfolio uses sample positions. Prices update from Alpha Vantage when "Refresh Data" is clicked, subject to API limits. Mock data is used as a fallback.
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
              <CardDescription>Top movers. Click "Refresh Data" for latest.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="gainers" className="w-full">
                <TabsList className="flex w-full">
                  <TabsTrigger value="gainers" className="flex-1 w-full"><TrendingUp className="mr-1 h-4 w-4" />Gainers</TabsTrigger>
                  <TabsTrigger value="losers" className="flex-1 w-full"><TrendingDown className="mr-1 h-4 w-4" />Losers</TabsTrigger>
                  <TabsTrigger value="active" className="flex-1 w-full"><Zap className="mr-1 h-4 w-4" />Active</TabsTrigger>
                </TabsList>
                <TabsContent value="gainers" className="mt-4 space-y-3">
                  {isMounted && currentMarketMovers.gainers.length > 0 ? currentMarketMovers.gainers.map(renderMarketMoverCard) : <p className="text-muted-foreground text-center py-2">No gainers data or click refresh.</p>}
                </TabsContent>
                <TabsContent value="losers" className="mt-4 space-y-3">
                   {isMounted && currentMarketMovers.losers.length > 0 ? currentMarketMovers.losers.map(renderMarketMoverCard) : <p className="text-muted-foreground text-center py-2">No losers data or click refresh.</p>}
                </TabsContent>
                <TabsContent value="active" className="mt-4 space-y-3">
                   {isMounted && currentMarketMovers.active.length > 0 ? currentMarketMovers.active.map(renderMarketMoverCard) : <p className="text-muted-foreground text-center py-2">No active data or click refresh.</p>}
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
              ) : <p className="text-muted-foreground text-center py-4">Loading chart...</p>}
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
          <CardDescription>Latest headlines impacting the market. Data from NewsAPI.org.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoadingNews && <p className="text-muted-foreground text-center py-4 md:col-span-2 lg:col-span-3">Loading news...</p>}
          {newsError && <Alert variant="destructive" className="md:col-span-2 lg:col-span-3"><AlertCircle className="h-4 w-4" /><AlertTitle>News Error</AlertTitle><AlertDescription>{newsError}</AlertDescription></Alert>}
          {!isLoadingNews && !newsError && recentNews.length === 0 && <p className="text-muted-foreground text-center py-4 md:col-span-2 lg:col-span-3">No news articles found.</p>}
          {!isLoadingNews && !newsError && recentNews.length > 0 && recentNews.map(article => (
            <NewsCard key={article.id} article={article} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
