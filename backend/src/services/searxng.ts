import axios from "axios";

export interface SearxngResult {
  title: string;
  url: string;
  content?: string;
  img_src?: string;
  thumbnail?: string;
  iframe_src?: string;
}

export interface SearxngOptions {
  language?: string;
  engines?: string[];
  categories?: string[];
}

export async function searchSearxng(
  query: string,
  options: SearxngOptions = {}
): Promise<SearxngResult[]> {
  const base = process.env.SEARXNG_URL || "http://localhost:4000";

  const params: Record<string, string> = {
    q: query,
    format: "json",
  };
  if (options.language) params.language = options.language;
  if (options.engines?.length) params.engines = options.engines.join(",");
  if (options.categories?.length) params.categories = options.categories.join(",");

  const res = await axios.get(`${base}/search`, { params });
  return (res.data?.results as SearxngResult[]) || [];
}
