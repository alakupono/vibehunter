import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { analyzeArticle } from '@/lib/llm'

export const runtime = 'nodejs'

export async function POST() {
  try {
    const recent = await prisma.article.findMany({
      where: { opinion: { equals: null } },
      orderBy: { publishedAt: 'desc' },
      take: 5,
    })
    let updated = 0
    for (const a of recent) {
      try {
        const r = await analyzeArticle({ title: a.title, dek: a.dek, body: a.body, tag: a.tag })
        await prisma.article.update({ where: { id: a.id }, data: { opinion: r.opinion, exercises: r.exercises as any } })
        updated++
      } catch (e) {
        console.error('Analyze failed for', a.slug, e)
      }
    }
    return NextResponse.json({ updated })
  } catch (e: any) {
    console.error('Analyze route error', e)
    return new NextResponse(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: { 'content-type': 'application/json' } })
  }
}

export async function GET() { return POST() }


