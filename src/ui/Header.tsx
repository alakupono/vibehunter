export function Header() {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 20,
      backdropFilter: 'saturate(140%) blur(8px)',
      background: 'rgba(11,15,20,0.7)',
      borderBottom: '1px solid rgba(255,255,255,0.06)'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#E5E7EB' }}>
        <a href="/" style={{ textDecoration: 'none', color: 'inherit', fontWeight: 800, letterSpacing: 0.3, textShadow: '0 0 18px rgba(34,211,238,0.25)' }}>Vibe Hunter</a>
        <nav style={{ display: 'flex', gap: 16 }}>
          <a href="/" style={{ color: '#9CA3AF', textDecoration: 'none' }}>News</a>
          <a href="/learn" style={{ color: '#9CA3AF', textDecoration: 'none' }}>Learn</a>
          <a href="/prompts" style={{ color: '#9CA3AF', textDecoration: 'none' }}>Prompts</a>
        </nav>
      </div>
    </header>
  )
}



