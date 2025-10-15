import { prisma } from '@/lib/db'
import type { Metadata } from 'next'

type Props = { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await prisma.article.findUnique({ where: { slug: params.slug } })
  if (!a) return { title: 'Not found' }
  return {
    title: a.title,
    description: a.dek,
    alternates: { canonical: `/${a.slug}` },
    openGraph: { title: a.title, description: a.dek, type: 'article', url: `/${a.slug}` },
  }
}

export default async function ArticlePage({ params }: Props) {
  const a = await prisma.article.findUnique({ where: { slug: params.slug } })
  if (!a) return <main style={{ padding: 24, color: '#E5E7EB' }}>Not found</main>
  return (
    <main style={{ minHeight: '100vh', background: '#0B0F14', color: '#E5E7EB', fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, Apple Color Emoji, Segoe UI Emoji' }}>
      <article style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ color: '#A78BFA', fontSize: 12 }}>{a.tag.toUpperCase()}</div>
        <h1 style={{ fontSize: 32, margin: '8px 0 12px' }}>{a.title}</h1>
        <p style={{ color: '#9CA3AF', fontSize: 18, marginBottom: 24 }}>{a.dek}</p>
        <div style={{ lineHeight: 1.7, fontSize: 16, color: '#D1D5DB', whiteSpace: 'pre-wrap' }}>{a.body}</div>
        <a href={a.url} target="_blank" style={{ display: 'inline-block', marginTop: 24, color: '#22D3EE' }}>Source →</a>
      </article>
    </main>
  )
}


