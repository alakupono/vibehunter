import Parser from 'rss-parser'
import { prisma } from './db'
import { SOURCES, type Source } from './sources'
import slugify from 'slugify'
import { summarizeArticle } from './llm'

type ParsedItem = { title: string; link: string; isoDate?: string; contentSnippet?: string; enclosure?: { url?: string }; content?: string }

const parser = new Parser({
  customFields: {
    item: [
      ['media:thumbnail', 'mediaThumbnail'],
      ['media:content', 'mediaContent', { keepArray: true }],
      ['content:encoded', 'contentEncoded'],
    ],
  },
})

async function fetchOgImage(pageUrl: string): Promise<string | undefined> {
  try {
    const res = await fetch(pageUrl, { headers: { 'user-agent': 'VibeHunterBot/1.0' }, next: { revalidate: 3600 } as any })
    const html = await res.text()
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    if (ogMatch?.[1]) return ogMatch[1]
    const twMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    if (twMatch?.[1]) return twMatch[1]
    const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i)
    if (imgMatch?.[1]) return imgMatch[1]
  } catch {}
  return undefined
}

function firstDefined<T>(...vals: (T | undefined | null)[]): T | undefined {
  for (const v of vals) if (v != null) return v as T
  return undefined
}

export async function fetchSource(source: Source) {
  let items: ParsedItem[] = []
  try {
    const feed = await parser.parseURL(source.url)
    items = (feed.items || []) as ParsedItem[]
  } catch (e) {
    return { created: 0, updated: 0 }
  }
  let created = 0, updated = 0
  for (const it of items.slice(0, 20)) {
    if (!it.link || !it.title) continue
    const url = it.link
    const publishedAt = it.isoDate ? new Date(it.isoDate) : new Date()
    const slug = slugify(`${source.tag}-${it.title}`.slice(0, 80), { lower: true, strict: true })
    const dek = it.contentSnippet?.slice(0, 200) || ''
    const body = it.contentSnippet || it.content || it.title
    const mediaContent = (it as any).mediaContent as any[] | undefined
    const mediaThumb = (it as any).mediaThumbnail as any | undefined
    const contentEncoded = (it as any).contentEncoded as string | undefined
    let imageUrl = firstDefined<string>(
      it.enclosure?.url,
      (mediaContent && mediaContent[0]?.['$']?.url) || (mediaContent && (mediaContent as any)[0]?.url),
      mediaThumb?.url,
      (contentEncoded && (contentEncoded.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] as string | undefined))
    )
    const existing = await prisma.article.findUnique({ where: { slug } })
    if (existing) {
      await prisma.article.update({ where: { slug }, data: { dek, body, updatedAt: new Date() } })
      updated++
    } else {
      const src = await prisma.source.upsert({
        where: { url: source.url },
        create: { name: source.name, url: source.url, type: source.type },
        update: {},
      })
      // Summarize via LLM
      let finalTitle = it.title
      let finalDek = dek
      let finalBody = body
      try {
        const s = await summarizeArticle({ sourceName: source.name, url, title: it.title, summary: it.contentSnippet, date: it.isoDate ?? undefined, tagGuess: source.tag })
        finalTitle = s.title
        finalDek = s.dek
        finalBody = s.body
      } catch {}
      if (!imageUrl) {
        imageUrl = await fetchOgImage(url)
      }
      await prisma.article.create({ data: {
        slug, title: finalTitle, dek: finalDek, body: finalBody, tag: source.tag, url, imageUrl, sourceId: src.id, publishedAt,
      } })
      created++
    }
  }
  return { created, updated }
}

export async function ingestAllSources() {
  let created = 0, updated = 0
  for (const s of SOURCES) {
    const r = await fetchSource(s)
    created += r.created
    updated += r.updated
  }
  return { created, updated }
}


