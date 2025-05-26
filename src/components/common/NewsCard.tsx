import type { NewsArticle } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { formatDate } from '@/lib/formatters';
import { ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '../ui/button';

interface NewsCardProps {
  article: NewsArticle;
  onAnalyzeSentiment?: (article: NewsArticle) => void;
  isAnalyzing?: boolean;
}

export function NewsCard({ article, onAnalyzeSentiment, isAnalyzing }: NewsCardProps) {
  const sentimentColor = 
    article.sentiment === 'positive' ? 'bg-green-100 text-green-800 border-green-300' :
    article.sentiment === 'negative' ? 'bg-red-100 text-red-800 border-red-300' :
    article.sentiment === 'neutral' ? 'bg-blue-100 text-blue-800 border-blue-300' :
    'bg-secondary text-secondary-foreground';
  
  const SentimentIcon = 
    article.sentiment === 'positive' ? TrendingUp :
    article.sentiment === 'negative' ? TrendingDown :
    Minus;

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      {article.imageUrl && (
        <div className="relative w-full h-48">
          <Image 
            src={article.imageUrl} 
            alt={article.headline} 
            layout="fill" 
            objectFit="cover" 
            data-ai-hint={article.dataAiHint || "news business"} />
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-lg leading-tight">{article.headline}</CardTitle>
        <CardDescription>
          {article.source} - {formatDate(article.date)}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {article.summary && <p className="text-sm text-muted-foreground mb-2">{article.summary}</p>}
        {article.sentiment && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-xs ${sentimentColor}`}>
              <SentimentIcon className="h-3.5 w-3.5 mr-1" />
              {article.sentiment.charAt(0).toUpperCase() + article.sentiment.slice(1)}
              {article.sentimentScore && ` (${article.sentimentScore.toFixed(2)})`}
            </Badge>
          </div>
        )}
        {article.sentimentReason && <p className="text-xs text-muted-foreground mt-1 italic">Reason: {article.sentimentReason}</p>}
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        {article.url && (
          <Button variant="link" asChild className="p-0 h-auto">
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              Read More <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </Button>
        )}
        {onAnalyzeSentiment && !article.sentiment && (
          <Button size="sm" onClick={() => onAnalyzeSentiment(article)} disabled={isAnalyzing}>
            {isAnalyzing ? 'Analyzing...' : 'Analyze Sentiment'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
