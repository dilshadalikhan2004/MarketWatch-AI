
"use client";
import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AreaChart, BarChart3, Newspaper, TrendingUp, TrendingDown, Zap, ArrowRight, AlertCircle, Wallet } from 'lucide-react';
import { StockCard, MinimalStockCard } from '@/components/common/StockCard';
import { NewsCard } from '@/components/common/NewsCard';
import { mockStocks, mockNews, mockMarketMovers, mockSentimentData, getUpdatedMockStocks, mockPortfolio } from '@/lib/mock-data';
import type { Stock, NewsArticle, MarketMover, SentimentDataPoint, PortfolioPosition as PortfolioPositionType } from '@/lib/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, Line, LineChart as RechartsLineChart, ResponsiveContainer, Tooltip as RechartsTooltip, Legend as RechartsLegend, Cell } from 'recharts';
import { formatCurrency, formatPercentage, formatDate } from '@/lib/formatters';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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
}

export default function DashboardPage() {
  const [currentStocks, setCurrentStocks] = useState<Stock[]>(mockStocks);
  const [marketOverviewStock, setMarketOverviewStock] = useState<Stock>(mockStocks[0]);
  const [portfolioData, setPortfolioData] = useState<DisplayPortfolioPosition[]>([]);
  const [portfolioTotals, setPortfolioTotals] = useState({
    marketValue: 0,
    gainLoss: 0,
    gainLossPercent: 0,
    initialCost: 0,
  });


  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStocks(getUpdatedMockStocks());
    }, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updatedOverviewStock = currentStocks.find(s => s.symbol === marketOverviewStock.symbol);
    if (updatedOverviewStock) {
      setMarketOverviewStock(updatedOverviewStock);
    }

    // Calculate portfolio values
    const enrichedPortfolio = mockPortfolio.map(pos => {
      const currentStock = currentStocks.find(s => s.symbol === pos.symbol);
      const currentPrice = currentStock?.price || pos.avgPurchasePrice; // Use avgPurchasePrice as fallback if stock not found for some reason
      const marketValue = pos.shares * currentPrice;
      const initialCost = pos.shares * pos.avgPurchasePrice;
      const gainLoss = marketValue - initialCost;
      const gainLossPercent = initialCost !== 0 ? (gainLoss / initialCost) : 0;

      return {
        ...pos,
        name: currentStock?.name,
        logoUrl: currentStock?.logoUrl,
        dataAiHint: currentStock?.dataAiHint,
        currentPrice: currentPrice,
        marketValue,
        initialCost,
        gainLoss,
        gainLossPercent,
      };
    });

    setPortfolioData(enrichedPortfolio);

    const totalMarketValue = enrichedPortfolio.reduce((sum, item) => sum + item.marketValue, 0);
    const totalInitialCost = enrichedPortfolio.reduce((sum, item) => sum + item.initialCost, 0);
    const totalGainLoss = totalMarketValue - totalInitialCost;
    const totalGainLossPercent = totalInitialCost !== 0 ? (totalGainLoss / totalInitialCost) : 0;

    setPortfolioTotals({
      marketValue: totalMarketValue,
      gainLoss: totalGainLoss,
      gainLossPercent: totalGainLossPercent,
      initialCost: totalInitialCost,
    });

  }, [currentStocks, marketOverviewStock.symbol]);


  const renderMarketMoverCard = (mover: MarketMover) => (
    <MinimalStockCard key={mover.symbol} stock={mover} className="w-full" />
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Dashboard Overview"
        description="Welcome back! Here's a snapshot of the current market."
        icon={AreaChart}
        actions={
          <Button asChild variant="outline">
            <Link href="#">
              <Newspaper className="mr-2 h-4 w-4" />
              Generate Report
            </Link>
          </Button>
        }
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (Market Overview & Portfolio Snapshot) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Market Overview: {marketOverviewStock.name} ({marketOverviewStock.symbol})</span>
                <img src={marketOverviewStock.logoUrl} alt={`${marketOverviewStock.name} logo`} data-ai-hint={marketOverviewStock.dataAiHint || 'company logo'} className="h-8 w-8 rounded-full" />
              </CardTitle>
              <CardDescription>
                Price: {formatCurrency(marketOverviewStock.price)}
                <span className={marketOverviewStock.change >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {' '} ({marketOverviewStock.change >= 0 ? '+' : ''}{formatCurrency(marketOverviewStock.change)} / {formatPercentage(marketOverviewStock.changePercent, 2)})
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {marketOverviewStock.chartData && marketOverviewStock.chartData.length > 1 ? (
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
                  Not enough data for chart.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" />Portfolio Snapshot</CardTitle>
              <CardDescription>A sample overview of your investment performance.</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="default" className="mb-4 bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-700 font-semibold">Sample Data</AlertTitle>
                <AlertDescription className="text-blue-600">
                  The portfolio data displayed below is for demonstration purposes only.
                </AlertDescription>
              </Alert>
              {portfolioData.length > 0 ? (
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
                <p className="text-muted-foreground text-center py-4">Loading portfolio data or no positions held.</p>
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
                  {mockMarketMovers.gainers.map(renderMarketMoverCard)}
                </TabsContent>
                <TabsContent value="losers" className="mt-4 space-y-3">
                  {mockMarketMovers.losers.map(renderMarketMoverCard)}
                </TabsContent>
                <TabsContent value="active" className="mt-4 space-y-3">
                  {mockMarketMovers.active.map(renderMarketMoverCard)}
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
          {mockNews.slice(0, 3).map(article => (
            <NewsCard key={article.id} article={article} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
