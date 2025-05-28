
'use server';
/**
 * @fileOverview Service for fetching news articles from an external API.
 */
import type { NewsArticle } from '@/lib/types';
import { generateMockNews } from '@/lib/mock-data';

const NEWS_API_KEY_FROM_ENV = process.env.NEWS_API_KEY;

export async function fetchRealNewsArticles(query: string = 'finance OR market OR business OR economy', pageSize: number = 6): Promise<NewsArticle[]> {
  console.log('[NewsService] fetchRealNewsArticles called.');
  console.log('[NewsService] Raw NEWS_API_KEY_FROM_ENV value:', NEWS_API_KEY_FROM_ENV);

  const isApiKeyAvailableAndNotPlaceholder = NEWS_API_KEY_FROM_ENV && NEWS_API_KEY_FROM_ENV !== "YOUR_NEWS_API_KEY_HERE";
  console.log('[NewsService] API Key check: isApiKeyAvailableAndNotPlaceholder =', isApiKeyAvailableAndNotPlaceholder);

  if (!isApiKeyAvailableAndNotPlaceholder) {
    console.warn("[NewsService] News API key is not configured or is a placeholder. Returning mock news data.");
    return generateMockNews(pageSize);
  }

  const newsApiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&pageSize=${pageSize}&apiKey=${NEWS_API_KEY_FROM_ENV}&language=en&sortBy=publishedAt`;
  
  console.log(`[NewsService] Fetching real news from: ${newsApiUrl.replace(NEWS_API_KEY_FROM_ENV, "***REDACTED_API_KEY***")}`);

  try {
    const response = await fetch(newsApiUrl, {
      cache: 'no-store'
    });

    console.log(`[NewsService] Response status: ${response.status}`);

    if (!response.ok) {
      let errorData;
      let responseText = '';
      try {
        // Try to clone the response to read it twice (once as JSON, once as text if JSON fails)
        const clonedResponse = response.clone();
        try {
            errorData = await clonedResponse.json();
        } catch (jsonError) {
            // If JSON parsing fails, read as text from the original response
            responseText = await response.text();
            console.warn("[NewsService] News API request failed. Could not parse error JSON. Response text:", responseText);
            errorData = { message: `News API request failed with status ${response.status}. Response: ${responseText}` };
        }
      } catch (e) {
        // This catch is for errors in cloning or initial text reading if JSON parsing itself failed
        console.warn("[NewsService] News API request failed. Error reading response body:", e);
        errorData = { message: `News API request failed with status ${response.status}. Could not read response body.` };
      }
      console.warn("[NewsService] News API call failed. Error:", errorData?.message || `Unknown API error with status ${response.status}`);
      console.warn("[NewsService] Returning mock news data as fallback due to API failure.");
      return generateMockNews(pageSize);
    }

    const data = await response.json();
    console.log("[NewsService] Successfully fetched data structure:", {status: data.status, totalResults: data.totalResults, articlesCount: data.articles?.length });
    
    // Explicitly check if data.articles is an array and has items.
    // Some APIs might return status "ok" but an empty articles array or no articles array at all.
    if (!data.articles || !Array.isArray(data.articles) || data.articles.length === 0) {
        console.warn("[NewsService] News API returned status OK but no articles or empty articles array. Query:", query, "Full response:", data);
        console.warn("[NewsService] Returning mock news data as fallback.");
        return generateMockNews(pageSize);
    }

    return data.articles.map((article: any): NewsArticle => ({
      id: article.url || `${article.source?.name}-${article.publishedAt}-${Math.random().toString(36).substring(7)}`,
      source: {
        id: article.source?.id,
        name: article.source?.name || "Unknown Source"
      },
      author: article.author,
      title: article.title || "Untitled Article",
      description: article.description,
      url: article.url,
      urlToImage: article.urlToImage,
      publishedAt: article.publishedAt,
      content: article.content,
      dataAiHint: 'news article image',
    })).filter(article => article.title && article.title !== "[Removed]" && article.description && article.description !== "[Removed]"); // Filter out removed articles

  } catch (error: any) {
    console.error("[NewsService] Error fetching real news articles:", error.message);
    console.warn("[NewsService] An unexpected error occurred. Returning mock news data as fallback.");
    return generateMockNews(pageSize);
  }
}
