import origins from '@/data/alien-origins.json'

export const dynamic = 'force-dynamic'

export default function OriginsRacesPage() {
  const items = (origins as any[])
    .slice()
    .sort((a,b) => (a.name || '').localeCompare(b.name || ''))

  return (
    <main style={{ padding: '24px 0', color:'#E5E7EB' }}>
      <div style={{ maxWidth: 1200, margin:'0 auto', padding:'0 24px' }}>
        <h1 style={{ fontSize: 22, marginBottom: 12 }}>Claimed Alien Races (Index)</h1>
        <p style={{ color:'#9CA3AF', marginBottom: 16 }}>Browse all entries from our encyclopedia. These are cultural claims, not scientific facts.</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:16 }}>
          {items.map((it:any) => (
            <a key={it.slug || it.id}
               href={`/origins/${it.slug || it.id}`}
               style={{
                 display:'block',
                 background:'rgba(255,255,255,0.03)',
                 border:'1px solid rgba(255,255,255,0.06)',
                 borderRadius:12,
                 padding:12,
                 textDecoration:'none',
                 color:'#E5E7EB'
               }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:56, height:56, borderRadius:8, overflow:'hidden', background:'#0b0f14', border:'1px solid rgba(255,255,255,0.06)' }}>
                  {it.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.image} alt={it.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  ) : (
                    <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontSize:12 }}>No image</div>
                  )}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{it.name}</div>
                  <div style={{ color:'#9CA3AF', fontSize:12, marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{it.home || '—'}{it.constellation ? ` — ${it.constellation}` : ''}</div>
                  {it.exclude_from_map && (
                    <span style={{ display:'inline-block', marginTop:6, fontSize:11, color:'#f59e0b', background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.25)', padding:'2px 6px', borderRadius:6 }}>Not mapped</span>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}


