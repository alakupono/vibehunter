import origins from '@/data/alien-origins.json'
import ReactMarkdown from 'react-markdown'

type Params = { params: { slug: string } }

export default function OriginPage({ params }: Params) {
  const item = (origins as any[]).find(o => (o.slug || o.id) === params.slug)
  if (!item) return <main style={{padding:24}}><h1 style={{color:'#e5e7eb'}}>Not found</h1></main>

  return (
    <main style={{ padding:'24px 0', color:'#E5E7EB' }}>
      <div style={{ maxWidth:960, margin:'0 auto', padding:'0 24px' }}>
        <h1 style={{ fontSize:28, margin:'8px 0' }}>{item.name}</h1>
        <p style={{ color:'#9CA3AF' }}>Home: {item.home} — {item.constellation || '—'} — {item.distance_ly} ly</p>
        {item.first_claim?.by && (
          <p style={{ color:'#9CA3AF' }}>First noted in: {item.first_claim.by}{item.first_claim.year ? ` (${item.first_claim.year})` : ''}</p>
        )}
        <div style={{ marginTop:16 }}>
          <ReactMarkdown>{item.overview_md || 'No overview provided.'}</ReactMarkdown>
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


