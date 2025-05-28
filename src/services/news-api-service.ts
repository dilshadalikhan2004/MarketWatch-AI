
'use server';
/**
 * @fileOverview Service for fetching news articles from an external API.
 */
import type { NewsArticle } from '@/lib/types';
import { generateMockNews } from '@/lib/mock-data'; // Keep for fallback

const NEWS_API_KEY = process.env.NEWS_API_KEY;

export async function fetchRealNewsArticles(query: string = 'finance OR market OR business OR economy', pageSize: number = 6): Promise<NewsArticle[]> {
  if (!NEWS_API_KEY || NEWS_API_KEY === "YOUR_NEWS_API_KEY_HERE") {
    console.warn("News API key is not configured. Returning mock news data.");
    return generateMockNews(pageSize); // Use the mock data generator directly
  }

  // --- START: TODO - Implement your actual News API call here ---
  // The following is an EXAMPLE for NewsAPI.org.
  // If you use a different provider, you MUST adjust the URL, headers, and response mapping.

  // For NewsAPI.org, common endpoints are 'everything' or 'top-headlines'
  // 'everything' is good for general queries, 'top-headlines' for major news.
  // We'll use 'everything' here for broader results based on the query.
  const newsApiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}&language=en&sortBy=publishedAt`;
  
  // For other APIs like GNews, the URL might be:
  // const gnewsApiUrl = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&max=${pageSize}&token=${NEWS_API_KEY}&lang=en&sortby=publishedAt`;


  console.log(`[NewsService] Fetching real news from: ${newsApiUrl.replace(NEWS_API_KEY, "YOUR_API_KEY")}`);

  try {
    const response = await fetch(newsApiUrl, {
      // NewsAPI.org typically uses an API key in the URL or an X-Api-Key header.
      // If your provider requires an Authorization header (e.g., Bearer token), add it here:
      // headers: {
      //   'Authorization': `Bearer ${NEWS_API_KEY}` // Example for some APIs
      //   'X-Api-Key': NEWS_API_KEY // Example for NewsAPI.org if not in URL
      // },
      cache: 'no-store' // Fetches fresh data on each request; consider 'force-cache' or revalidation strategies for production
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `News API request failed with status ${response.status}` }));
      console.error("News API request failed:", response.status, errorData);
      // Fallback to mock data in case of API error
      console.warn("News API call failed. Returning mock news data as fallback.");
      return generateMockNews(pageSize);
    }

    const data = await response.json();
    
    if (!data.articles || data.articles.length === 0) {
        console.warn("News API returned no articles for the query. Returning mock news.");
        return generateMockNews(pageSize);
    }

    // Map the API response to our NewsArticle type
    // This mapping is SPECIFIC to NewsAPI.org's response structure.
    // Adjust it if your API provider has different field names.
    return data.articles.map((article: any): NewsArticle => ({
      id: article.url || `${article.source?.name}-${article.publishedAt}-${Math.random()}`, // Create a unique ID
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
      dataAiHint: 'news article image', // Generic hint, can be improved
    }));

  // --- END: TODO ---

  } catch (error: any) {
    console.error("Error fetching real news articles:", error.message);
    // Fallback to mock data in case of any other error (network, parsing, etc.)
    console.warn("An unexpected error occurred while fetching news. Returning mock news data as fallback.");
    return generateMockNews(pageSize);
  }
}
