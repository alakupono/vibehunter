import { prisma } from '@/lib/db'
import { FetchNow } from '@/ui/FetchNow'

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
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, padding: '0 24px 48px' }}>
        {articles.map(a => (
          <a key={a.id} href={`/${a.slug}`} style={{ background: '#111827', padding: 16, borderRadius: 12, textDecoration: 'none', color: '#E5E7EB', boxShadow: '0 0 0 1px rgba(255,255,255,0.02)' }}>
            <div style={{ fontSize: 12, color: '#A78BFA', marginBottom: 6 }}>{a.tag.toUpperCase()}</div>
            <div style={{ fontWeight: 700, lineHeight: 1.3 }}>{a.title}</div>
            <div style={{ color: '#9CA3AF', marginTop: 8, fontSize: 14 }}>{a.dek}</div>
          </a>
        ))}
      </section>
    </main>
  )
}
