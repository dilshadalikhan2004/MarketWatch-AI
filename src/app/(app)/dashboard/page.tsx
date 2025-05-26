
"use client";
import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaChart, BarChart3, Newspaper, TrendingUp, TrendingDown, Zap, Users, MessageCircle, Settings, ArrowRight } from 'lucide-react';
import { StockCard, MinimalStockCard } from '@/components/common/StockCard';
import { NewsCard } from '@/components/common/NewsCard';
import { mockStocks, mockNews, mockMarketMovers, mockSentimentData, getUpdatedMockStocks } from '@/lib/mock-data';
import type { Stock, NewsArticle, MarketMover, SentimentDataPoint } from '@/lib/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, Line, LineChart, ResponsiveContainer, Tooltip as RechartsTooltip, Legend as RechartsLegend, Cell } from 'recharts'; // Aliased BarChart to RechartsBarChart
import { formatCurrency, formatPercentage, formatDate } from '@/lib/formatters';
import Link from 'next/link';

const chartConfig = {
  price: { label: "Price", color: "hsl(var(--chart-1))" },
  positive: { label: "Positive", color: "hsl(var(--chart-4))" },
  negative: { label: "Negative", color: "hsl(var(--chart-5))" },
  neutral: { label: "Neutral", color: "hsl(var(--chart-3))" },
};

export default function DashboardPage() {
  const [currentStocks, setCurrentStocks] = useState<Stock[]>(mockStocks);
  const [marketOverviewStock, setMarketOverviewStock] = useState<Stock>(mockStocks[0]);

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
            <Link href="/reports">
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
                  <LineChart data={marketOverviewStock.chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      tickMargin={8} 
                      tickFormatter={(value) => `$${value}`}
                    />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" hideLabel />} />
                    <Line type="monotone" dataKey="price" stroke="var(--color-price)" strokeWidth={2} dot={false} />
                  </LineChart>
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
              <CardTitle>Portfolio Snapshot (Coming Soon)</CardTitle>
              <CardDescription>A quick look at your investments performance.</CardDescription>
            </CardHeader>
            <CardContent className="h-[150px] flex items-center justify-center">
              <p className="text-muted-foreground">Portfolio data will be displayed here.</p>
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
