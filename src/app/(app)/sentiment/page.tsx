
"use client";
import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2, TrendingUp, TrendingDown, MinusCircle } from 'lucide-react';
import { analyzeNewsSentimentAction } from '@/lib/actions/sentiment';
import type { AnalyzeSentimentOutput } from '@/ai/flows/sentiment-analysis';
import { generateMockNews } from '@/lib/mock-data';
import type { NewsArticle } from '@/lib/types';
import { NewsCard } from '@/components/common/NewsCard';
import { Badge } from '@/components/ui/badge';
import { Alert as ShadCnAlert, AlertTitle, AlertDescription } from '@/components/ui/alert';


export default function SentimentPage() {
  const [textToAnalyze, setTextToAnalyze] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalyzeSentimentOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentNewsWithSentiment, setRecentNewsWithSentiment] = useState<NewsArticle[]>([]);

  useEffect(() => {
    setRecentNewsWithSentiment(generateMockNews(6)); // Generate news on mount
  }, []);

  const handleAnalyze = async () => {
    if (!textToAnalyze.trim()) {
      setError("Please enter some text to analyze.");
      return;
    }
    if (textToAnalyze.length < 10) {
      setError("Text must be at least 10 characters long for analysis.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    const result = await analyzeNewsSentimentAction({ text: textToAnalyze });
    setIsLoading(false);
    if ('error' in result) {
      setError(result.error);
    } else {
      setAnalysisResult(result);
    }
  };

  const getSentimentIcon = (sentiment?: 'positive' | 'negative' | 'neutral') => {
    if (sentiment === 'positive') return <TrendingUp className="h-5 w-5 text-green-500" />;
    if (sentiment === 'negative') return <TrendingDown className="h-5 w-5 text-red-500" />;
    return <MinusCircle className="h-5 w-5 text-gray-500" />;
  };
  
  const getSentimentColorClass = (sentiment?: 'positive' | 'negative' | 'neutral') => {
    if (sentiment === 'positive') return 'text-green-600 border-green-500';
    if (sentiment === 'negative') return 'text-red-600 border-red-500';
    return 'text-gray-600 border-gray-500';
  };


  return (
    <div className="w-full">
      <PageHeader
        title="Sentiment Analysis"
        description="Analyze market sentiment from news articles or custom text. Dates refresh daily."
        icon={Sparkles}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Analyze Text</CardTitle>
              <CardDescription>Enter text to get its sentiment score.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste news headline or article snippet here..."
                value={textToAnalyze}
                onChange={(e) => setTextToAnalyze(e.target.value)}
                rows={6}
              />
              <Button onClick={handleAnalyze} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Analyze Sentiment
              </Button>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {analysisResult && (
                 <Card className={`mt-4 border-2 ${getSentimentColorClass(analysisResult.sentiment)}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getSentimentIcon(analysisResult.sentiment)}
                      Sentiment: <span className="capitalize">{analysisResult.sentiment || 'N/A'}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p><strong>Score:</strong> {analysisResult.score?.toFixed(2) || 'N/A'}</p>
                    <p><strong>Reason:</strong> {analysisResult.reason || 'No specific reason provided.'}</p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Recent News Sentiment</CardTitle>
              <CardDescription>Sentiment analysis for recent market news. Dates refresh daily.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentNewsWithSentiment.length > 0 ? (
                recentNewsWithSentiment.map(article => (
                  <NewsCard key={article.id} article={article} showSentimentBadge />
                ))
              ) : (
                 <ShadCnAlert>
                  <Sparkles className="h-4 w-4" />
                  <AlertTitle>No News Available</AlertTitle>
                  <AlertDescription>
                    Could not load recent news articles at this time.
                  </AlertDescription>
                </ShadCnAlert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
