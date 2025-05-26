
"use client";
import { PageHeader } from "@/components/common/PageHeader";
import { mockStocks, mockNews, getUpdatedMockStocks } from "@/lib/mock-data";
import type { Stock, NewsArticle } from "@/lib/types";
import { MinimalStockCard } from "@/components/common/StockCard";
import { NewsCard } from "@/components/common/NewsCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, BarChart3, Newspaper, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Line, LineChart as RechartsLineChart, Cell } from "recharts"; // Renamed BarChart to RechartsBarChart
import React, { useEffect, useState } from "react";
import { analyzeNewsSentimentAction } from "@/lib/actions/sentiment";
import { useToast } from "@/hooks/use-toast";

const chartConfig = {
  price: { label: "Price", color: "hsl(var(--primary))" },
  volume: { label: "Volume", color: "hsl(var(--accent))" },
  positive: { label: "Positive", color: "hsl(var(--chart-2))" },
  negative: { label: "Negative", color: "hsl(var(--chart-5))" },
  neutral: { label: "Neutral", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

const aggregateNewsSentiment = (news: NewsArticle[]) => {
  const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
  news.forEach(article => {
    if (article.sentiment) {
      sentimentCounts[article.sentiment]++;
    }
  });
  return [
    { sentiment: "Positive", count: sentimentCounts.positive, fill: "hsl(var(--chart-2))" },
    { sentiment: "Negative", count: sentimentCounts.negative, fill: "hsl(var(--chart-5))" },
    { sentiment: "Neutral", count: sentimentCounts.neutral, fill: "hsl(var(--chart-4))" },
  ];
};

export default function DashboardPage() {
  const { toast } = useToast();
  const [stocks, setStocks] = useState<Stock[]>(mockStocks);
  const [news, setNews] = useState<NewsArticle[]>(mockNews.slice(0, 4));
  const [analyzingArticleId, setAnalyzingArticleId] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setStocks(getUpdatedMockStocks());
    }, 5000); // Update prices every 5 seconds
    return () => clearInterval(interval);
  }, []);
  
  const topGainers = [...stocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
  const topLosers = [...stocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);
  const mostActive = [...stocks].sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0)).slice(0, 5);

  const marketOverviewData = stocks.slice(0,10).map(s => ({ month: s.symbol, desktop: s.price, mobile: (s.price * (1 + (s.changePercent/200))) }));

  const handleAnalyzeSentiment = async (articleToAnalyze: NewsArticle) => {
    setAnalyzingArticleId(articleToAnalyze.id);
    const result = await analyzeNewsSentimentAction({ text: `${articleToAnalyze.headline} ${articleToAnalyze.summary || ''}` });
    if ('error' in result) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      setNews(prevNews => prevNews.map(n => 
        n.id === articleToAnalyze.id ? { ...n, sentiment: result.sentiment, sentimentScore: result.score, sentimentReason: result.reason } : n
      ));
      toast({ title: "Sentiment Analyzed", description: `Sentiment for "${articleToAnalyze.headline}" is ${result.sentiment}.` });
    }
    setAnalyzingArticleId(null);
  };
  
  const newsSentimentData = aggregateNewsSentiment(news);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Market Dashboard" icon={AreaChart} description="Overview of market performance and key insights." />

      <Card>
        <CardHeader>
          <CardTitle>Market Overview</CardTitle>
          <CardDescription>Price trends of top stocks.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={marketOverviewData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" domain={['dataMin - 10', 'dataMax + 10']} tickFormatter={(value) => `$${value.toFixed(0)}`} />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line type="monotone" dataKey="desktop" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="mobile" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
              </RechartsLineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Market Movers</CardTitle>
            <CardDescription>Top gainers, losers, and most active stocks.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="gainers">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="gainers" className="w-full"><TrendingUp className="h-4 w-4 mr-1" />Gainers</TabsTrigger>
                <TabsTrigger value="losers" className="w-full"><TrendingDown className="h-4 w-4 mr-1" />Losers</TabsTrigger>
                <TabsTrigger value="active" className="w-full"><Activity className="h-4 w-4 mr-1" />Active</TabsTrigger>
              </TabsList>
              <TabsContent value="gainers" className="space-y-3">
                {topGainers.map(stock => <MinimalStockCard key={stock.symbol} stock={stock} />)}
              </TabsContent>
              <TabsContent value="losers" className="space-y-3">
                {topLosers.map(stock => <MinimalStockCard key={stock.symbol} stock={stock} />)}
              </TabsContent>
              <TabsContent value="active" className="space-y-3">
                {mostActive.map(stock => <MinimalStockCard key={stock.symbol} stock={stock} />)}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Newspaper className="h-5 w-5 text-primary" /> Recent News</CardTitle>
            <CardDescription>Latest market news and sentiment analysis.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {news.map(article => (
                <NewsCard 
                  key={article.id} 
                  article={article} 
                  onAnalyzeSentiment={handleAnalyzeSentiment} 
                  isAnalyzing={analyzingArticleId === article.id}
                />
              ))}
            </div>
             <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={newsSentimentData} layout="vertical" margin={{ right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                    <YAxis dataKey="sentiment" type="category" stroke="hsl(var(--muted-foreground))" width={60} />
                    <ChartTooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent />} />
                    <Bar dataKey="count" radius={4}>
                      {newsSentimentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

