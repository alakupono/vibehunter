import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { summarizeArticle } from '@/lib/llm'
import { resolveAffiliate } from '@/lib/affiliates'
import slugify from 'slugify'

export const runtime = 'nodejs'

async function fetchPage(url: string): Promise<{ title: string; description: string }> {
  const res = await fetch(url, { headers: { 'user-agent': 'VibeHunterBot/1.0' } })
  const html = await res.text()
  const ogTitle = (html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] || '').trim()
  const twTitle = (html.match(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i)?.[1] || '').trim()
  const docTitle = (html.match(/<title>([^<]+)<\/title>/i)?.[1] || '').trim()
  const h1 = (html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1] || '').trim()
  const title = ogTitle || twTitle || h1 || docTitle
  const desc = (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] || '').trim()
  return { title, description: desc }
}

export async function POST(req: Request) {
  const { url, tag = 'lovable' } = await req.json()
  if (!url) return new NextResponse('Missing url', { status: 400 })
  const page = await fetchPage(url)
  let summaryTitle = page.title || url
  let summaryDek = page.description || 'Summary pending'
  let summaryBody = page.description || 'Summary pending'
  try {
    const s = await summarizeArticle({ sourceName: 'Lovable', url, title: summaryTitle, summary: summaryDek })
    summaryTitle = s.title
    summaryDek = s.dek
    summaryBody = s.body
  } catch {}
  // Prevent raw URLs as titles
  if (/^https?:\/\//i.test(summaryTitle)) {
    try {
      const d = new URL(url).hostname.replace(/^www\./, '')
      summaryTitle = `Lovable Review: An Engineer's Take (${d})`
    } catch {
      summaryTitle = "Lovable Review: An Engineer's Take"
    }
  }
  const slug = slugify(`${tag}-${summaryTitle}`.slice(0, 80), { lower: true, strict: true })
  const affiliate = await resolveAffiliate('https://lovable.dev')
  const src = await prisma.source.upsert({ where: { url }, create: { name: 'Lovable', url, type: 'blog' }, update: {} })
  const article = await prisma.article.upsert({
    where: { slug },
    update: { title: summaryTitle, dek: summaryDek, body: summaryBody, tag, url: affiliate || url },
    create: { slug, title: summaryTitle, dek: summaryDek, body: summaryBody, tag, url: affiliate || url, sourceId: src.id, publishedAt: new Date() },
  })
  return NextResponse.json({ articleId: article.id, slug: article.slug })
}


