import { prisma } from '@/lib/db'
import { FetchNow } from '@/ui/FetchNow'
import { Card } from '@/ui/Card'
import styles from './home.module.css'

export default async function Home() {
  const articles = await prisma.article.findMany({
    orderBy: [{ publishedAt: 'desc' }],
    take: 12,
  })
  const [lead, ...rest] = articles
  const featured = rest.slice(0, 2)
  const others = rest.slice(2)
  return (
    <main className={styles.page}>
      <section className={styles.headerRow}>
        <div>
          <h1 style={{ fontSize: 28, margin: 0, textShadow: '0 0 24px rgba(34,211,238,0.25)' }}>Vibe Hunter</h1>
          <p style={{ color: '#9CA3AF', marginTop: 8 }}>Auto‑curated updates for Cursor, Copilot, Replit, v0 and more.</p>
        </div>
        <FetchNow />
      </section>
      {lead && (
        <section className={styles.section}>
          <div className={styles.featuredGrid}>
            <a href={`/${lead.slug}`} className={styles.hero}>
              {lead.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" src={lead.imageUrl} className={styles.heroImage} />
              )}
              <div className={styles.heroOverlay} />
              <div className={styles.heroContent}>
                <div className={styles.eyebrow}>{lead.tag.toUpperCase()}</div>
                <div className={styles.heroTitle}>{lead.title}</div>
                <div className={styles.heroDek}>{lead.dek}</div>
              </div>
            </a>
            <div style={{ display: 'grid', gap: 16 }}>
              {featured.map(f => (
                <a key={f.id} href={`/${f.slug}`} className={styles.miniCard}>
                  {f.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="" src={f.imageUrl} className={styles.miniImg} />
                  )}
                  <div className={styles.miniBody}>
                    <div className={styles.eyebrow}>{f.tag.toUpperCase()}</div>
                    <div className={styles.miniTitle}>{f.title}</div>
                    <div className={styles.miniDek}>{f.dek}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}
      <section className={`${styles.section}`}>
        <div className={styles.cardsGrid}>
          {others.map(a => (
            <Card key={a.id} title={a.title} dek={a.dek} tag={a.tag} imageUrl={a.imageUrl ?? undefined} href={`/${a.slug}`} />
          ))}
        </div>
      </section>
    </main>
  )
}
