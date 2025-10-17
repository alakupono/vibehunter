import { prisma } from '@/lib/db'
import { FetchNow } from '@/ui/FetchNow'
import { Card } from '@/ui/Card'
import styles from './home.module.css'
import { app } from '@/../config/app'

export default async function Home({ searchParams }: { searchParams?: { page?: string } }) {
  const PAGE_SIZE = 12
  const page = Math.max(1, parseInt(searchParams?.page ?? '1', 10) || 1)
  const skip = (page - 1) * PAGE_SIZE
  const [total, articles] = await Promise.all([
    prisma.article.count(),
    prisma.article.findMany({ orderBy: [{ publishedAt: 'desc' }], skip, take: PAGE_SIZE }),
  ])
  const [lead, ...rest] = (() => {
    const withImg = articles.find(a => a.imageUrl)
    if (withImg) {
      const rest = articles.filter(a => a.id !== withImg.id)
      return [withImg, ...rest]
    }
    return articles
  })()
  const featured = rest.slice(0, 2)
  const others = rest.slice(2)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const hasPrev = page > 1
  const hasNext = page < totalPages

  return (
    <main className={styles.page}>
      {/* Header banner with fetch button removed per request */}
      {lead && (
        <section className={`${styles.section} ${styles.container}`}>
          <div className={styles.featuredGrid}>
            <div className={styles.colStack}>
              <a href={`/${lead.slug}`} className={styles.hero}>
              {/* Use fallback when no image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" src={lead.imageUrl ?? app.assets.heroFallback} className={styles.heroImage} />
              <div className={styles.heroOverlay} />
              <div className={styles.heroContent}>
                <div className={styles.eyebrow}>{lead.tag.toUpperCase()}</div>
                <div className={`${styles.heroTitle} ${styles.clamp2}`}>{lead.title}</div>
                <div className={`${styles.heroDek} ${styles.clamp3}`}>{lead.dek}</div>
              </div>
              </a>
              {/* two-up lives under hero in same left column */}
              <div>
                <div className={styles.sectionTitle}>{app.sections.beginnerTitle}</div>
                <div className={styles.twoUpGrid}>
                  {featured.map(f => (
                    <a key={f.id} href={`/${f.slug}`} className={styles.twoUpCard}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f.imageUrl ?? app.assets.heroFallback} alt={f.title} className={styles.twoUpImg} />
                      <div className={styles.twoUpBody}>
                        <div className={styles.eyebrow}>{f.tag.toUpperCase()}</div>
                        <div className={styles.miniTitle}>{f.title}</div>
                        <div className={styles.miniDek}>{f.dek}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              {/* Sponsor placeholder above Radar */}
              <div className={styles.sponsorCard}>
                <div className={styles.sponsorTitle}>{app.assets.sponsorLabel}</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <a href={app.assets.sponsorHref} target="_blank" rel="noopener noreferrer">
                  <img src={app.assets.sponsorImage} alt={app.assets.sponsorLabel} className={styles.sponsorImg} />
                </a>
              </div>
              {/* Vibe Hunter Radar - mock ticker */}
              <div className={styles.tickerPanel}>
                <div className={styles.tickerTitle}>{app.sections.radarTitle}</div>
                <div className={styles.tickerViewport}>
                  <ul className={`${styles.tickerList} ${styles.tickerAuto}`}>
                    {app.radarItems.map((item, i) => (
                      <li key={i} className={styles.tickerItem}>
                        <a href={item.href} target="_blank" rel="noopener noreferrer">{item.label}</a>
                        {item.price ? <span className={styles.tickerPrice}>{item.price}</span> : null}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={styles.tickerMeta}>Mock data. Community listings coming soon.</div>
              </div>
            </div>
          </div>
        </section>
      )}
      <section className={`${styles.section} ${styles.container}`}>
        <div className={styles.cardsGrid}>
          {others.map(a => (
            <Card key={a.id} title={a.title} dek={a.dek} tag={a.tag} imageUrl={a.imageUrl ?? undefined} href={`/${a.slug}`} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
          <a
            href={hasPrev ? `/?page=${page - 1}` : '#'}
            aria-disabled={!hasPrev}
            style={{ color: hasPrev ? '#9CA3AF' : '#4B5563', pointerEvents: hasPrev ? 'auto' : 'none', textDecoration: 'none' }}
          >
            ← Prev
          </a>
          <div style={{ color: '#6B7280', fontSize: 12 }}>Page {page} of {totalPages}</div>
          <a
            href={hasNext ? `/?page=${page + 1}` : '#'}
            aria-disabled={!hasNext}
            style={{ color: hasNext ? '#9CA3AF' : '#4B5563', pointerEvents: hasNext ? 'auto' : 'none', textDecoration: 'none' }}
          >
            Next →
          </a>
        </div>
      </section>
    </main>
  )
}
