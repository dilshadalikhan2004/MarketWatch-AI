
"use client";
import React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Sparkles } from 'lucide-react';

// import { useState, useEffect } from 'react';
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Textarea } from '@/components/ui/textarea';
// import { Loader2, TrendingUp, TrendingDown, MinusCircle, AlertCircle } from 'lucide-react';
// import { analyzeNewsSentimentAction } from '@/lib/actions/sentiment';
// import type { AnalyzeSentimentOutput, NewsArticle } from '@/lib/types';
// import { NewsCard } from '@/components/common/NewsCard';
// import { Alert as ShadCnAlert, AlertTitle, AlertDescription } from '@/components/ui/alert';
// import { getNewsArticlesAction } from '@/lib/actions/news'; 


export default function SentimentPage() {
  // const [textToAnalyze, setTextToAnalyze] = useState('');
  // const [analysisResult, setAnalysisResult] = useState<AnalyzeSentimentOutput | null>(null);
  // const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  // const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  // const [recentNewsWithSentiment, setRecentNewsWithSentiment] = useState<NewsArticle[]>([]);
  // const [isLoadingNews, setIsLoadingNews] = useState(true);
  // const [newsError, setNewsError] = useState<string | null>(null);

  // useEffect(() => {
  //   const fetchNews = async () => {
  //     setIsLoadingNews(true);
  //     setNewsError(null);
  //     const result = await getNewsArticlesAction('finance market', 6); 
  //     if (result.error) {
  //       setNewsError(result.error);
  //       console.error("Error fetching news for sentiment page:", result.error);
  //     } else if (result.articles) {
  //       setRecentNewsWithSentiment(result.articles);
  //     }
  //     setIsLoadingNews(false);
  //   };
  //   fetchNews();
  // }, []);

  // const handleAnalyze = async () => {
  //   if (!textToAnalyze.trim()) {
  //     setAnalysisError("Please enter some text to analyze.");
  //     return;
  //   }
  //   if (textToAnalyze.length < 10) {
  //     setAnalysisError("Text must be at least 10 characters long for analysis.");
  //     return;
  //   }
  //   setIsLoadingAnalysis(true);
  //   setAnalysisError(null);
  //   setAnalysisResult(null);
  //   const result = await analyzeNewsSentimentAction({ text: textToAnalyze });
  //   setIsLoadingAnalysis(false);
  //   if ('error' in result) {
  //     setAnalysisError(result.error);
  //   } else {
  //     setAnalysisResult(result);
  //   }
  // };

  // const getSentimentIcon = (sentiment?: 'positive' | 'negative' | 'neutral') => {
  //   if (sentiment === 'positive') return <TrendingUp className="h-5 w-5 text-green-500" />;
  //   if (sentiment === 'negative') return <TrendingDown className="h-5 w-5 text-red-500" />;
  //   return <MinusCircle className="h-5 w-5 text-gray-500" />;
  // };
  
  // const getSentimentColorClass = (sentiment?: 'positive' | 'negative' | 'neutral') => {
  //   if (sentiment === 'positive') return 'text-green-600 border-green-500';
  //   if (sentiment === 'negative') return 'text-red-600 border-red-500';
  //   return 'text-gray-600 border-gray-500';
  // };

  console.log("SentimentPage (Simplified) rendered");

  return (
    <div className="w-full">
      <PageHeader
        title="Sentiment Analysis (Simplified for Debug)"
        description="Analyze market sentiment from news articles or custom text."
        icon={Sparkles}
      />
       <p className="mt-4">If you see this, the Sentiment Analysis page component itself is loading!</p>
       <p className="mt-2">The issue might be in the original content or hooks of this page.</p>

      {/*
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
              {analysisError && <p className="text-sm text-destructive">{analysisError}</p>}
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
              <CardTitle>Recent News </CardTitle>
              <CardDescription>Recent news articles. Sentiment analysis can be performed on any text.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingNews && <p className="text-muted-foreground text-center py-4">Loading news...</p>}
              {newsError && <ShadCnAlert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>News Error</AlertTitle><AlertDescription>{newsError}</AlertDescription></ShadCnAlert>}
              {!isLoadingNews && !newsError && recentNewsWithSentiment.length === 0 && (
                 <ShadCnAlert>
                  <Sparkles className="h-4 w-4" />
                  <AlertTitle>No News Available</AlertTitle>
                  <AlertDescription>
                    Could not load recent news articles at this time.
                  </AlertDescription>
                </ShadCnAlert>
              )}
              {!isLoadingNews && !newsError && recentNewsWithSentiment.length > 0 && (
                recentNewsWithSentiment.map(article => (
                  <NewsCard key={article.id} article={article} showSentimentBadge={!!article.sentiment} />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      */}
    </div>
  );
}
