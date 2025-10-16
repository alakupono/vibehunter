import { prisma } from '@/lib/db'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import { decorateAffiliateMentions } from '@/lib/affiliates'
import styles from './article.module.css'
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
    <main className={styles.page}>
      <article className={styles.article}>
        <div className={styles.header}>
          <div className={styles.tag}>{a.tag.toUpperCase()}</div>
          <h1 className={styles.title}>{a.title}</h1>
          <p className={styles.dek}>{a.dek}</p>
          {/* meta row intentionally minimal; source moved to bottom */}
        </div>
        <div className={styles.body}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]}>
            {decorateAffiliateMentions(a.body, { keywordVariants: ['Lovable','lovable','Lovable.dev','lovable.dev'], href: 'https://lovable.dev/?via=vibehunter', maxLinks: 5 })}
          </ReactMarkdown>
        </div>
        <div className={styles.sourceSmall}>Read more at the original source: <a href={a.url} target="_blank" rel="noreferrer">{a.url}</a></div>
        <a href={a.url} target="_blank" style={{ display: 'inline-block', marginTop: 24, color: '#22D3EE' }}>Source →</a>

        {(a as any).opinion && (
          <section style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 8 }}>Our Take</h2>
            <p style={{ color: '#D1D5DB' }}>{(a as any).opinion}</p>
          </section>
        )}
        {Array.isArray(a as any) && (a as any).implications && (a as any).implications.length > 0 && (
          <section style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 20, marginBottom: 8 }}>Implications</h2>
            <ul style={{ marginLeft: 18, color: '#9CA3AF' }}>
              {((a as any).implications as string[]).map((s, i) => (
                <li key={i} style={{ marginBottom: 6 }}>{s}</li>
              ))}
            </ul>
          </section>
        )}
        {/* exercises intentionally removed per editorial policy */}
      </article>
    </main>
  )
}


