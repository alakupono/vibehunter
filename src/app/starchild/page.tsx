import { app } from '@/../config/app'

export const metadata = {
  title: 'StarChild',
  description: 'Exploring multi‑dimensional consciousness, contact, and the evolving human story.',
}

export default function StarChildPage() {
  return (
    <main style={{ padding: '32px 0', color: '#E5E7EB' }}>
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '0 24px' }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: 0.2, marginBottom: 8 }}>StarChild</h1>
        <p style={{ color: '#9CA3AF', marginBottom: 28 }}>
          A {app.brandName} micro‑hub for seekers exploring contact phenomena, higher‑self work, and
          the intersection of science and metaphysics.
        </p>

        <section style={{ display: 'grid', gap: 16 }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 18 }}>
            <h2 style={{ fontSize: 18, marginBottom: 6 }}>Focus Areas</h2>
            <ul style={{ marginLeft: 18, color: '#A1A1AA' }}>
              <li>Bashar, Seth Material, channeling methodologies</li>
              <li>Consciousness research: psi, non‑locality, mind‑body correlates</li>
              <li>UAP/UFO updates with a grounded, non‑sensational lens</li>
              <li>Practice: meditation, coherence, and integrative tools</li>
            </ul>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 18 }}>
            <h2 style={{ fontSize: 18, marginBottom: 6 }}>What to expect</h2>
            <p style={{ color: '#A1A1AA' }}>
              Curated articles, explainers, and community resources updated continuously by our ingest
              pipeline. Events and meetups will surface on the Events map.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}



