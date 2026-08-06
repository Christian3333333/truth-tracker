import type { SearchHit } from "@/lib/verification/types";

export interface SearchClient {
  search(query: string): Promise<SearchHit[]>;
}

interface TavilyResult {
  title?: string;
  url?: string;
  content?: string;
}

interface TavilyResponse {
  results?: TavilyResult[];
}

export function createTavilySearchClient(apiKey: string): SearchClient {
  return {
    async search(query) {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          search_depth: "basic",
          include_answer: false,
          max_results: 5,
        }),
      });

      if (!response.ok) {
        throw new Error(`Tavily search failed with status ${response.status}`);
      }

      const data = (await response.json()) as TavilyResponse;

      return (data.results ?? [])
        .filter((result) => result.title && result.url && result.content)
        .map((result) => ({
          title: result.title!,
          url: result.url!,
          content: result.content!,
        }));
    },
  };
}
