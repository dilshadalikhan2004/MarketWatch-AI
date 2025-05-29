
"use client";
import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, TrendingUp, TrendingDown, MinusCircle, AlertCircle, Sparkles } from 'lucide-react';
import { analyzeNewsSentimentAction } from '@/lib/actions/sentiment';
import type { AnalyzeSentimentOutput, NewsArticle } from '@/lib/types';
import { NewsCard } from '@/components/common/NewsCard';
import { Alert as ShadCnAlert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { getNewsArticlesAction } from '@/lib/actions/news'; 

export default function SentimentPage() {
  const [textToAnalyze, setTextToAnalyze] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalyzeSentimentOutput | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  const [recentNewsWithSentiment, setRecentNewsWithSentiment] = useState<NewsArticle[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const fetchNews = async () => {
      setIsLoadingNews(true);
      setNewsError(null);
      const result = await getNewsArticlesAction('finance market OR economy OR stocks', 6); 
      if (result.error) {
        setNewsError(result.error);
        console.error("Error fetching news for sentiment page:", result.error);
      } else if (result.articles) {
        setRecentNewsWithSentiment(result.articles);
      }
      setIsLoadingNews(false);
    };
    fetchNews();
  }, []);

  const handleAnalyze = async () => {
    if (!textToAnalyze.trim()) {
      setAnalysisError("Please enter some text to analyze.");
      return;
    }
    if (textToAnalyze.length < 10) {
      setAnalysisError("Text must be at least 10 characters long for analysis.");
      return;
    }
    setIsLoadingAnalysis(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    const result = await analyzeNewsSentimentAction({ text: textToAnalyze });
    setIsLoadingAnalysis(false);
    if ('error' in result) {
      setAnalysisError(result.error);
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

  if (!isMounted) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="w-full">
      <PageHeader
        title="Sentiment Analysis"
        description="Analyze market sentiment from news articles or custom text using Genkit AI."
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
              <Button onClick={handleAnalyze} disabled={isLoadingAnalysis} className="w-full">
                {isLoadingAnalysis ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Analyze Sentiment
              </Button>
              {analysisError && <ShadCnAlert variant="destructive" className="mt-2"><AlertCircle className="h-4 w-4" /><AlertTitle>Analysis Error</AlertTitle><AlertDescription>{analysisError}</AlertDescription></ShadCnAlert>}
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
                    {analysisResult.keywords && analysisResult.keywords.length > 0 && (
                        <div>
                            <strong>Keywords:</strong>
                            <ul className="list-disc pl-5">
                                {analysisResult.keywords.map(kw => (
                                    <li key={kw.word} className={getSentimentColorClass(kw.sentiment).split(' ')[0] /* Get only text color part */}>
                                        {kw.word} (<span className="capitalize">{kw.sentiment}</span>)
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Recent News </CardTitle>
              <CardDescription>Recent news articles. Sentiment analysis can be performed on any text.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingNews && 
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" /> 
                  <p className="ml-2 text-muted-foreground">Loading news...</p>
                </div>
              }
              {newsError && <ShadCnAlert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>News Error</AlertTitle><AlertDescription>{newsError}</AlertDescription></ShadCnAlert>}
              {!isLoadingNews && !newsError && recentNewsWithSentiment.length === 0 && (
                 <ShadCnAlert>
                  <Sparkles className="h-4 w-4" />
                  <AlertTitle>No News Available</AlertTitle>
                  <AlertDescription>
                    Could not load recent news articles at this time or no articles matched the query.
                  </AlertDescription>
                </ShadCnAlert>
              )}
              {!isLoadingNews && !newsError && recentNewsWithSentiment.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recentNewsWithSentiment.map(article => (
                    <NewsCard key={article.id} article={article} showSentimentBadge={!!article.sentiment} />
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
