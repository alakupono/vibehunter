import ReactMarkdown from 'react-markdown'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

function loadEncyclopedia(): string {
  const candidates = [
    path.join(process.cwd(), 'Universal_Alien_Encyclopedia.md'),
    path.join(process.cwd(), 'Alien_Origins_Encyclopedia.md')
  ]
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8')
    } catch {}
  }
  return '# Encyclopedia Not Found\n\nNo encyclopedia markdown file was found in the project root.'
}

export default function OriginsEncyclopediaPage() {
  const md = loadEncyclopedia()
  return (
    <main style={{ padding: '24px 0', color:'#E5E7EB' }}>
      <div style={{ maxWidth: 1000, margin:'0 auto', padding:'0 24px' }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Universal Alien Encyclopedia</h1>
        <p style={{ color:'#9CA3AF', marginBottom: 16 }}>Compiled cultural claims and star references used by the Origins map. These entries are not scientific facts.</p>
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:16 }}>
          <ReactMarkdown>{md}</ReactMarkdown>
        </div>
      </div>
    </main>
  )
}


