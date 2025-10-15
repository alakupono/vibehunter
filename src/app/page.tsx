import { prisma } from '@/lib/db'
import { FetchNow } from '@/ui/FetchNow'
import { Card } from '@/ui/Card'

export default async function Home() {
  const articles = await prisma.article.findMany({
    orderBy: [{ publishedAt: 'desc' }],
    take: 12,
  })
  return (
    <main style={{ minHeight: '100vh', background: '#0B0F14', color: '#E5E7EB', fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, Apple Color Emoji, Segoe UI Emoji' }}>
      <section style={{ padding: '48px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 28, margin: 0, textShadow: '0 0 24px rgba(34,211,238,0.25)' }}>Vibe Hunter</h1>
          <p style={{ color: '#9CA3AF', marginTop: 8 }}>Auto‑curated updates for Cursor, Copilot, Replit, v0 and more.</p>
        </div>
        <FetchNow />
      </section>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, padding: '0 24px 48px' }}>
        {articles.map(a => (
          <Card key={a.id} title={a.title} dek={a.dek} tag={a.tag} imageUrl={a.imageUrl ?? undefined} href={`/${a.slug}`} />
        ))}
      </section>
    </main>
  )
}
