import origins from '@/data/alien-origins.json'
import ReactMarkdown from 'react-markdown'
import fs from 'fs'
import path from 'path'

type Params = { params: { slug: string } }

export default function OriginPage({ params }: Params) {
  const item = (origins as any[]).find(o => (o.slug || o.id) === params.slug)
  if (!item) return <main style={{padding:24}}><h1 style={{color:'#e5e7eb'}}>Not found</h1></main>

  // Attempt to load long-form article file first
  let fileMd: string | null = null
  try {
    const fp = path.join(process.cwd(), 'src', 'content', 'origins', `${params.slug}.md`)
    if (fs.existsSync(fp)) fileMd = fs.readFileSync(fp, 'utf8')
  } catch {}

  // Attempt to load long-form article from encyclopedia by matching heading names
  let encyclopediaMd: string | null = null
  try {
    const p = path.join(process.cwd(), 'Alien_Origins_Encyclopedia.md')
    if (fs.existsSync(p)) encyclopediaMd = fs.readFileSync(p, 'utf8')
  } catch {}

  function extractSection(md: string, names: string[]): string | null {
    const candidates = names.map(n => n.toLowerCase())
    const parts = md.split('\n## ').slice(1) // drop title
    for (const part of parts) {
      const headerLine = part.split('\n', 1)[0]
      const header = headerLine.trim().toLowerCase()
      const matches = candidates.some(n => header.includes(n))
      if (matches) {
        const body = part.slice(headerLine.length).trim()
        // cut at next separator '---' if present
        const sep = body.indexOf('\n---')
        return (sep >= 0 ? body.slice(0, sep) : body).trim()
      }
    }
    return null
  }

  const aliasNames: string[] = [item.name, ...(item.aliases || []), (item.id || '').replace(/[-_]/g,' ')]
  const encyclopediaSection = !fileMd && encyclopediaMd ? extractSection(encyclopediaMd, aliasNames) : null
  const article = fileMd || encyclopediaSection || item.article_md || item.overview_md || ''

  return (
    <main style={{ padding:'24px 0', color:'#E5E7EB' }}>
      <div style={{ maxWidth:960, margin:'0 auto', padding:'0 24px' }}>
        <h1 style={{ fontSize:28, margin:'8px 0' }}>{item.name}</h1>
        <p style={{ color:'#9CA3AF' }}>Home: {item.home} — {item.constellation || '—'} — {item.distance_ly} ly</p>
        {item.first_claim?.by && (
          <p style={{ color:'#9CA3AF' }}>First noted in: {item.first_claim.by}{item.first_claim.year ? ` (${item.first_claim.year})` : ''}</p>
        )}
        {item.image && (
          <div style={{ marginTop:16 }}>
            <img src={item.image} alt={item.name} style={{ maxWidth:'100%', borderRadius:8, border:'1px solid rgba(255,255,255,0.08)' }} />
          </div>
        )}
        <div style={{ marginTop:16 }}>
          <ReactMarkdown>{article || 'No overview provided.'}</ReactMarkdown>
        </div>
        {Array.isArray(item.links) && item.links.length > 0 && (
          <div style={{ marginTop:16 }}>
            <h3 style={{ fontSize:18, marginBottom:6 }}>Links</h3>
            <ul>
              {item.links.map((u:string,i:number)=>(<li key={i}><a href={u} target="_blank" style={{color:'#22D3EE'}}>{u}</a></li>))}
            </ul>
          </div>
        )}
        <p style={{ marginTop:16, color:'#a1a1aa' }}>Disclaimer: These are cultural claims, not scientific facts.</p>
      </div>
    </main>
  )
}


