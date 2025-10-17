export const dynamic = 'force-dynamic'

import { AlienOrigins } from '@/components/AlienOrigins'

export default function OriginsPage() {
  return (
    <main style={{ padding: '24px 0', color:'#E5E7EB' }}>
      <div style={{ maxWidth: 1200, margin:'0 auto', padding:'0 24px' }}>
        <h1 style={{ fontSize: 22, marginBottom: 12 }}>Alien Origins (claimed)</h1>
        <p style={{ color:'#9CA3AF', marginBottom: 12 }}>This view plots claimed origins mapped to real stars/galaxies. These are cultural claims, not scientific facts.</p>
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:12, minHeight: '70vh' }}>
          <AlienOrigins />
        </div>
      </div>
    </main>
  )
}


