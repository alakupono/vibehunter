import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import OpenAI from 'openai'
import { resolveAffiliate, decorateAffiliateMentions } from '@/lib/affiliates'

export const runtime = 'nodejs'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || process.env.LLM_API_KEY })

function normalizeText(t: string): string[] {
  return (t || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function jaccardSimilarity(a: string, b: string): number {
  const A = new Set(normalizeText(a))
  const B = new Set(normalizeText(b))
  const inter = new Set([...A].filter((x) => B.has(x)))
  const union = new Set([...A, ...B])
  return union.size ? inter.size / union.size : 0
}

export async function POST() {
  const jobs = await prisma.rewriteJob.findMany({ where: { status: 'pending' }, take: 3, orderBy: { createdAt: 'asc' }, include: { originalArticle: true } })
  let completed = 0
  for (const j of jobs) {
    try {
      let prompt = `Rewrite the following article as a 500-word engineering-forward review that leans into 'vibe coding' evolution. Keep it factual, mention practical implications, and include a subtle callout that readers can try the referenced tool via the provided link if it suits their needs (no hype). Return plain markdown only.\n\nTITLE: ${j.originalArticle.title}\nDEK: ${j.originalArticle.dek}\nBODY:\n${j.originalArticle.body}`
      let tries = 0
      let md = ''
      while (tries < 2) {
        const r = await client.chat.completions.create({ model: 'gpt-4o-mini', temperature: 0.4, messages: [ { role: 'system', content: 'You are a senior software engineer and editor.' }, { role: 'user', content: prompt } ] })
        md = r.choices[0]?.message?.content || ''
        const sim = jaccardSimilarity(md, j.originalArticle.body)
        if (sim < 0.6) break
        tries += 1
        // Ask for more novelty
        prompt = prompt + '\n\nIncrease linguistic novelty by 30% and avoid reusing phrasing from the original.'
      }

      // Generate a unique headline
      const titleResp = await client.chat.completions.create({
        model: 'gpt-4o-mini', temperature: 0.5,
        messages: [
          { role: 'system', content: 'You are a headline writer.' },
          { role: 'user', content: 'Write a short, punchy, unique headline (<= 70 chars) for the following engineer POV review. Output only the headline text.\n\n' + md }
        ]
      })
      const newTitle = (titleResp.choices[0]?.message?.content || '').trim().replace(/^"|"$/g, '') || (j.originalArticle.title + ' — Engineer Review')
      const aff = await resolveAffiliate(j.sourceUrl)
      if (aff) {
        md = decorateAffiliateMentions(md, { keywordVariants: ['Lovable', 'lovable', 'Lovable.dev', 'lovable.dev'], href: aff, maxLinks: 5 })
      }
      // ensure unique slug
      const baseSlug = j.originalArticle.slug + '-review'
      let finalSlug = baseSlug
      const exists = await prisma.article.findUnique({ where: { slug: finalSlug } })
      if (exists) finalSlug = baseSlug + '-' + Math.floor(Date.now() / 1000)

      const rewritten = await prisma.article.create({ data: {
        slug: finalSlug,
        title: newTitle,
        dek: j.originalArticle.dek,
        body: md,
        tag: j.originalArticle.tag,
        url: j.originalArticle.url, // keep source canonical; affiliate is embedded in body mentions
        sourceId: j.originalArticle.sourceId,
        publishedAt: new Date(),
      } })
      await prisma.rewriteJob.update({ where: { id: j.id }, data: { status: 'completed', rewrittenArticleId: rewritten.id } })
      completed++
    } catch (e: any) {
      await prisma.rewriteJob.update({ where: { id: j.id }, data: { status: 'failed', error: String(e?.message || e) } })
    }
  }
  return NextResponse.json({ completed })
}

export async function GET() { return POST() }


