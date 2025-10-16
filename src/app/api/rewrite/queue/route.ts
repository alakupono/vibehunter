import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const { articleId } = await req.json()
  if (!articleId) return new NextResponse('Missing articleId', { status: 400 })
  const a = await prisma.article.findUnique({ where: { id: articleId } })
  if (!a) return new NextResponse('Not found', { status: 404 })
  const job = await prisma.rewriteJob.create({ data: { sourceUrl: a.url, originalArticleId: a.id } })
  return NextResponse.json({ jobId: job.id })
}


