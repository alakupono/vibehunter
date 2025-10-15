"use client"
import { useState } from 'react'

export function FetchNow() {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  return (
    <div style={{ display: 'inline-flex', gap: 12, alignItems: 'center' }}>
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          try {
            const r = await fetch('/api/cron/ingest', { method: 'POST' })
            const d = await r.json()
            setMsg(`Fetched ${d.created} new, ${d.updated} updated`)
          } catch (e) {
            setMsg('Fetch failed')
          } finally {
            setBusy(false)
          }
        }}
        style={{ padding: '8px 14px', background: '#22D3EE', color: '#0B0F14', borderRadius: 8, fontWeight: 600 }}
      >
        {busy ? 'Fetching…' : 'Fetch now'}
      </button>
      {msg && <span style={{ color: '#9CA3AF' }}>{msg}</span>}
    </div>
  )
}


