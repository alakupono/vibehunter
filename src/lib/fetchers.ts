import Parser from 'rss-parser'
import { prisma } from './db'
import { SOURCES, type Source } from './sources'
import slugify from 'slugify'
import { summarizeArticle } from './llm'

type ParsedItem = { title: string; link: string; isoDate?: string; contentSnippet?: string }

const parser = new Parser()

export async function fetchSource(source: Source) {
  const feed = await parser.parseURL(source.url)
  const items = (feed.items || []) as ParsedItem[]
  let created = 0, updated = 0
  for (const it of items.slice(0, 20)) {
    if (!it.link || !it.title) continue
    const url = it.link
    const publishedAt = it.isoDate ? new Date(it.isoDate) : new Date()
    const slug = slugify(`${source.tag}-${it.title}`.slice(0, 80), { lower: true, strict: true })
    const dek = it.contentSnippet?.slice(0, 200) || ''
    const body = it.contentSnippet || it.title
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
      await prisma.article.create({ data: {
        slug, title: finalTitle, dek: finalDek, body: finalBody, tag: source.tag, url, sourceId: src.id, publishedAt,
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


