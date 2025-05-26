
'use server';
/**
 * @fileOverview Service for fetching news articles from an external API.
 */
import type { NewsArticle } from '@/lib/types';
import { generateMockNews } from '@/lib/mock-data'; // Keep for placeholder

const NEWS_API_KEY = process.env.NEWS_API_KEY;

// Helper function to transform mock data to new NewsArticle structure
// This can be removed once real API integration is complete.
const transformMockToNewsArticle = (mock: any): NewsArticle => ({
  id: mock.id || `${mock.source}-${new Date(mock.date).getTime()}`,
  source: { name: mock.source || "Mock Source" },
  author: "Mock Author",
  title: mock.headline || "Mock Headline",
  description: mock.summary || "Mock summary of the article.",
  url: mock.url || "#",
  urlToImage: mock.imageUrl, // Assuming imageUrl from mockData matches urlToImage
  publishedAt: mock.date ? new Date(mock.date).toISOString() : new Date().toISOString(),
  content: mock.summary ? mock.summary.substring(0, 100) + "..." : "Mock content snippet...",
  dataAiHint: mock.dataAiHint,
  sentiment: mock.sentiment,
  sentimentScore: mock.sentimentScore,
  sentimentReason: mock.sentimentReason,
});


export async function fetchRealNewsArticles(query: string = 'market', pageSize: number = 6): Promise<NewsArticle[]> {
  if (!NEWS_API_KEY || NEWS_API_KEY === "YOUR_NEWS_API_KEY_HERE") {
    console.warn("News API key is not configured. Returning mock news data.");
    // Fallback to a transformed version of mock news
    const mockNewsData = generateMockNews(pageSize);
    return mockNewsData.map(transformMockToNewsArticle);
  }

  // TODO: Replace with actual News API call
  // Example using a hypothetical NewsAPI.org structure:
  // const newsApiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}&language=en&sortBy=publishedAt`;
  //
  // try {
  //   const response = await fetch(newsApiUrl, { cache: 'no-store' }); // Add cache control if needed
  //   if (!response.ok) {
  //     const errorData = await response.json();
  //     console.error("News API request failed:", response.status, errorData);
  //     throw new Error(errorData.message || `News API request failed with status ${response.status}`);
  //   }
  //   const data = await response.json();
  //   console.log("Fetched real news data:", data.articles?.length);
  //
  //   return data.articles.map((article: any) => ({
  //     id: article.source?.id ? `${article.source.id}-${article.publishedAt}` : article.url,
  //     source: { id: article.source?.id, name: article.source?.name || "Unknown Source" },
  //     author: article.author,
  //     title: article.title,
  //     description: article.description,
  //     url: article.url,
  //     urlToImage: article.urlToImage,
  //     publishedAt: article.publishedAt,
  //     content: article.content,
  //     dataAiHint: 'news image', // Default hint, can be more specific
  //   })) as NewsArticle[];
  //
  // } catch (error) {
  //   console.error("Error fetching real news articles:", error);
  //   // Fallback to mock data in case of API error
  //   const mockNewsData = generateMockNews(pageSize);
  //   return mockNewsData.map(transformMockToNewsArticle);
  // }

  // Current placeholder: returns mock data
  console.log("News API service called, returning mock data as placeholder for real API.");
  const mockNewsData = generateMockNews(pageSize);
  return mockNewsData.map(transformMockToNewsArticle);
}
