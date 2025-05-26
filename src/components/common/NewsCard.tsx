
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { NewsArticle } from '@/lib/types';
import { formatDate } from '@/lib/formatters';
import { ArrowRight, TrendingUp, TrendingDown, MinusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewsCardProps {
  article: NewsArticle;
  className?: string;
  showSentimentBadge?: boolean;
}

export function NewsCard({ article, className, showSentimentBadge = false }: NewsCardProps) {

  const getSentimentBadgeVariant = (sentiment?: 'positive' | 'negative' | 'neutral') => {
    if (sentiment === 'positive') return 'default';
    if (sentiment === 'negative') return 'destructive';
    return 'secondary';
  };
  
  const getSentimentIcon = (sentiment?: 'positive' | 'negative' | 'neutral') => {
    if (sentiment === 'positive') return <TrendingUp className="mr-1 h-3 w-3" />;
    if (sentiment === 'negative') return <TrendingDown className="mr-1 h-3 w-3" />;
    return <MinusCircle className="mr-1 h-3 w-3" />;
  };

  const imageSrc = article.urlToImage || `https://placehold.co/600x400.png`;
  const imageHint = article.urlToImage ? 'article image' : (article.dataAiHint || 'news image');

  return (
    <Card className={cn("shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col", className)}>
      {imageSrc && (
        <div className="relative w-full h-40">
          <Image
            src={imageSrc}
            alt={article.title}
            layout="fill"
            objectFit="cover"
            className="rounded-t-lg"
            data-ai-hint={imageHint}
            onError={(e) => {
              // Fallback if the API image fails to load
              const target = e.target as HTMLImageElement;
              target.src = `https://placehold.co/600x400.png`;
              target.dataset.aiHint = article.dataAiHint || 'news image fallback';
            }}
          />
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-md leading-tight h-12 overflow-hidden" title={article.title}>
          <Link href={article.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {article.title || "Untitled Article"}
          </Link>
        </CardTitle>
        <CardDescription className="text-xs">
          {article.source?.name || "Unknown Source"} - {formatDate(article.publishedAt)}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground flex-grow pt-0">
        <p className="line-clamp-3">{article.description || "No description available."}</p>
      </CardContent>
      <CardFooter className="pt-2 pb-4 flex justify-between items-center">
        {showSentimentBadge && article.sentiment && (
          <Badge variant={getSentimentBadgeVariant(article.sentiment)} className="text-xs capitalize">
            {getSentimentIcon(article.sentiment)}
            {article.sentiment}
          </Badge>
        )}
        <Link 
          href={article.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className={cn(
            "text-xs font-medium text-primary hover:underline flex items-center",
            !(showSentimentBadge && article.sentiment) && "ml-auto" 
          )}
        >
          Read More <ArrowRight className="ml-1 h-3 w-3" />
        </Link>
      </CardFooter>
    </Card>
  );
}
