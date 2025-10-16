import { prisma } from '@/lib/db'
import { FetchNow } from '@/ui/FetchNow'
import { Card } from '@/ui/Card'
import styles from './home.module.css'

export default async function Home() {
  const articles = await prisma.article.findMany({
    orderBy: [{ publishedAt: 'desc' }],
    take: 12,
  })
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
              <img alt="" src={lead.imageUrl ?? '/fallback.png'} className={styles.heroImage} />
              <div className={styles.heroOverlay} />
              <div className={styles.heroContent}>
                <div className={styles.eyebrow}>{lead.tag.toUpperCase()}</div>
                <div className={`${styles.heroTitle} ${styles.clamp2}`}>{lead.title}</div>
                <div className={`${styles.heroDek} ${styles.clamp3}`}>{lead.dek}</div>
              </div>
              </a>
              {/* two-up lives under hero in same left column */}
              <div>
                <div className={styles.sectionTitle}>Starter Guides for Vibe Coders</div>
                <div className={styles.twoUpGrid}>
                  <a href="#" className={styles.twoUpCard}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/fallback.png" alt="Beginner guide" className={styles.twoUpImg} />
                    <div className={styles.twoUpBody}>
                      <div className={styles.eyebrow}>Beginner</div>
                      <div className={styles.miniTitle}>Build a One‑Page Landing with Lovable + Custom CSS</div>
                      <div className={styles.miniDek}>A gentle walkthrough to ship your first site: prompts, tweaks, and how to add your own styles.</div>
                    </div>
                  </a>
                  <a href="#" className={styles.twoUpCard}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/fallback.png" alt="Beginner guide" className={styles.twoUpImg} />
                    <div className={styles.twoUpBody}>
                      <div className={styles.eyebrow}>Beginner</div>
                      <div className={styles.miniTitle}>Connect Supabase Auth and a Simple Contact Form</div>
                      <div className={styles.miniDek}>Step‑by‑step: add auth, store form submissions, and deploy—no backend needed.</div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              {/* Sponsor placeholder above Radar */}
              <div className={styles.sponsorCard}>
                <div className={styles.sponsorTitle}>Sponsored Ad</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/sponsor1.png" alt="Sponsored Ad" className={styles.sponsorImg} />
              </div>
              {/* Vibe Hunter Radar - mock ticker */}
              <div className={styles.tickerPanel}>
                <div className={styles.tickerTitle}>Vibe Hunter Radar</div>
                <div className={styles.tickerViewport}>
                  <ul className={`${styles.tickerList} ${styles.tickerAuto}`}>
                    {[
                      ['Domain: vibeapps.io', '$4.2k'],
                      ['Newsletter: Cursor Weekly (3.4k subs)', '$7.8k'],
                      ['SaaS: AI Prompt Cards', '$12k'],
                      ['Community: Builders in v0 (Discord)', '$2.1k'],
                      ['App: Prompt Graph', '$8.4k'],
                      ['Blog: AI Daily (11k uniques/mo)', '$6.2k'],
                      ['Tool: Repo Summarizer', '$3.3k'],
                      ['Domain: vibeengine.dev', '$2.4k'],
                      ['Newsletter: LLM Hacks (9.1k)', '$6.9k'],
                      ['Course IP: Next.js AI Starter', '$5.0k'],
                      ['Community: Indie AI (Slack)', '$1.9k'],
                      ['SaaS: Ghost CMS Theme', '$2.5k'],
                      ['Template: Dev Agency Kit', '$1.1k'],
                      ['Chrome Ext: Tab Annotator', '$0.9k'],
                      ['App: Clip2Docs', '$1.7k'],
                      // duplicate a few to create seamless scroll illusion
                      ['Domain: vibeapps.io', '$4.2k'],
                      ['Newsletter: Cursor Weekly (3.4k subs)', '$7.8k'],
                      ['SaaS: AI Prompt Cards', '$12k'],
                    ].map(([label, price], i) => (
                      <li key={i} className={styles.tickerItem}>
                        <a href="#">{label}</a>
                        <span className={styles.tickerPrice}>{price}</span>
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
      </section>
    </main>
  )
}
