
'use server';
/**
 * @fileOverview Server Action for fetching news articles.
 */
import { fetchRealNewsArticles } from '@/services/news-api-service';
import type { NewsArticle } from '@/lib/types';

export async function getNewsArticlesAction(
  query: string = 'market',
  pageSize: number = 6
): Promise<{ articles?: NewsArticle[]; error?: string }> {
  try {
    const articles = await fetchRealNewsArticles(query, pageSize);
    return { articles };
  } catch (error: any) {
    console.error("Error in getNewsArticlesAction:", error);
    return { error: error.message || "Failed to fetch news articles." };
  }
}
