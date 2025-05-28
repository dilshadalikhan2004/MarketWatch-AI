
'use server';
/**
 * @fileOverview Service for fetching news articles from an external API.
 */
import type { NewsArticle } from '@/lib/types';
import { generateMockNews } from '@/lib/mock-data'; 

const NEWS_API_KEY = process.env.NEWS_API_KEY;

export async function fetchRealNewsArticles(query: string = 'finance OR market OR business OR economy', pageSize: number = 6): Promise<NewsArticle[]> {
  console.log('[NewsService] Attempting to fetch real news. API Key available:', !!NEWS_API_KEY && NEWS_API_KEY !== "YOUR_NEWS_API_KEY_HERE");
  
  if (!NEWS_API_KEY || NEWS_API_KEY === "YOUR_NEWS_API_KEY_HERE") {
    console.warn("[NewsService] News API key is not configured or is a placeholder. Returning mock news data.");
    return generateMockNews(pageSize);
  }

  // --- START: NewsAPI.org Implementation ---
  const newsApiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}&language=en&sortBy=publishedAt`;
  
  console.log(`[NewsService] Fetching real news from: ${newsApiUrl.replace(NEWS_API_KEY, "YOUR_API_KEY_REDACTED")}`);

  try {
    const response = await fetch(newsApiUrl, {
      // NewsAPI.org uses API key in the URL, but some APIs might require it in headers:
      // headers: { 'X-Api-Key': NEWS_API_KEY }, 
      cache: 'no-store' 
    });

    console.log(`[NewsService] Response status: ${response.status}`);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.error("[NewsService] News API request failed with status:", response.status, "Error data:", errorData);
      } catch (e) {
        const textError = await response.text();
        console.error("[NewsService] News API request failed with status:", response.status, "Could not parse error JSON. Response text:", textError);
        errorData = { message: `News API request failed with status ${response.status}. Response: ${textError}` };
      }
      // Fallback to mock data in case of API error
      console.warn("[NewsService] News API call failed. Returning mock news data as fallback. Error:", errorData?.message || 'Unknown API error');
      return generateMockNews(pageSize);
    }

    const data = await response.json();
    console.log("[NewsService] Successfully fetched data:", data);
    
    if (!data.articles || data.articles.length === 0) {
        console.warn("[NewsService] News API returned no articles for the query. Returning mock news.");
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
    }));
  // --- END: NewsAPI.org Implementation ---

  } catch (error: any) {
    console.error("[NewsService] Error fetching real news articles:", error.message);
    console.warn("[NewsService] An unexpected error occurred while fetching news. Returning mock news data as fallback.");
    return generateMockNews(pageSize);
  }
}
