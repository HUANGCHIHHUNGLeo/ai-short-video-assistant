/**
 * Serper API 服務
 * 用於 Google 搜尋即時資訊
 */

interface SerperSearchResult {
  title: string
  link: string
  snippet: string
  position: number
}

interface SerperResponse {
  organic: SerperSearchResult[]
  searchParameters?: {
    q: string
  }
}

interface TrendSearchResult {
  query: string
  results: {
    title: string
    snippet: string
    link: string
  }[]
  error?: string
}

/**
 * 使用 Serper API 搜尋 Google
 */
export async function searchGoogle(query: string, num: number = 5): Promise<SerperSearchResult[]> {
  const apiKey = process.env.SERPER_API_KEY

  if (!apiKey) {
    console.warn('SERPER_API_KEY not found, skipping search')
    return []
  }

  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: query,
        gl: 'tw', // Taiwan
        hl: 'zh-TW', // Traditional Chinese
        num: num
      })
    })

    if (!response.ok) {
      console.error('Serper API error:', response.status)
      return []
    }

    const data: SerperResponse = await response.json()
    return data.organic || []
  } catch (error) {
    console.error('Serper search error:', error)
    return []
  }
}

/**
 * 搜尋特定領域的最新趨勢
 */
export async function searchTrends(niche: string): Promise<TrendSearchResult[]> {
  const queries = [
    `${niche} 2025 趨勢`,
    `${niche} 熱門話題`,
    `${niche} 短影音 爆款`,
    `${niche} IG 熱門內容`
  ]

  const results: TrendSearchResult[] = []

  for (const query of queries) {
    const searchResults = await searchGoogle(query, 3)
    results.push({
      query,
      results: searchResults.map(r => ({
        title: r.title,
        snippet: r.snippet,
        link: r.link
      }))
    })
  }

  return results
}

/**
 * 搜尋競品/參考帳號資訊
 */
export async function searchCompetitor(accountName: string): Promise<SerperSearchResult[]> {
  const query = `${accountName} IG 帳號 追蹤數 內容`
  return searchGoogle(query, 5)
}

/**
 * 搜尋產業最新動態（用於定位報告）
 */
export async function searchIndustryInsights(industry: string): Promise<{
  trends: string[]
  news: string[]
  competitors: string[]
}> {
  const apiKey = process.env.SERPER_API_KEY

  if (!apiKey) {
    return { trends: [], news: [], competitors: [] }
  }

  try {
    // 並行搜尋多個維度
    const [trendsResults, newsResults, competitorsResults] = await Promise.all([
      searchGoogle(`${industry} 2025 2026 趨勢 預測`, 3),
      searchGoogle(`${industry} 最新消息 新聞`, 3),
      searchGoogle(`${industry} KOL 網紅 排名`, 3)
    ])

    return {
      trends: trendsResults.map(r => r.snippet).filter(Boolean),
      news: newsResults.map(r => `${r.title}: ${r.snippet}`).filter(Boolean),
      competitors: competitorsResults.map(r => r.title).filter(Boolean)
    }
  } catch (error) {
    console.error('Industry insights search error:', error)
    return { trends: [], news: [], competitors: [] }
  }
}

/**
 * 格式化搜尋結果為 AI prompt 可用的格式
 */
export function formatSearchResultsForPrompt(results: TrendSearchResult[]): string {
  if (results.length === 0) return ''

  let formatted = '\n\n## 即時搜尋結果（來自 Google）\n'

  for (const result of results) {
    if (result.results.length > 0) {
      formatted += `\n【${result.query}】\n`
      for (const r of result.results) {
        formatted += `- ${r.title}\n  ${r.snippet}\n`
      }
    }
  }

  return formatted
}
