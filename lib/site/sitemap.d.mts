export type ChangeFrequency = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'

export type SitemapEntry = {
  url: string
  path: string
  lastModified: string | null
  changeFrequency: ChangeFrequency
  priority: number
  type: 'home' | 'editorial' | 'state' | 'county' | 'city' | 'filter' | 'venue'
}

export const ORIGIN: string
export function sitemapEntries(): SitemapEntry[]
export function publishedPaths(): Set<string>
