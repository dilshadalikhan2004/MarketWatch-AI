
'use server';
/**
 * @fileOverview Server Action for fetching news articles.
 */
import { fetchRealNewsArticles } from '@/services/news-api-service';
import type { NewsArticle } from '@/lib/types';

export async function getNewsArticlesAction(
  query: string = 'finance market',
  pageSize: number = 6
): Promise<{ articles?: NewsArticle[]; error?: string }> {
  console.log('[NewsAction] getNewsArticlesAction called with query:', query, 'pageSize:', pageSize);
  try {
    const articles = await fetchRealNewsArticles(query, pageSize);
    console.log('[NewsAction] Fetched articles successfully:', articles?.length);
    return { articles };
  } catch (error: any) {
    console.error("[NewsAction] Error in getNewsArticlesAction:", error);
    return { error: error.message || "Failed to fetch news articles." };
  }
}
