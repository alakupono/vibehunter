'use client'

import { useMemo, useState } from 'react'

type Planet = { name: string; lon: number; sign: string }
type Aspect = { a: string; b: string; type: string; orb: number }

type ChartData = { meta: { asc:number; mc:number; houses:number[]; place:string; datetimeLocal:string; tz:string }; planets: Planet[]; aspects: Aspect[] }

const glyph: Record<string,string> = {
  Sun:'\u2609', Moon:'\u263D', Mercury:'\u263F', Venus:'\u2640', Mars:'\u2642',
  Jupiter:'\u2643', Saturn:'\u2644', Uranus:'\u2645', Neptune:'\u2646', Pluto:'\u2647'
}
const signGlyph = ['\u2648','\u2649','\u264A','\u264B','\u264C','\u264D','\u264E','\u264F','\u2650','\u2651','\u2652','\u2653']

export default function ChartPage() {
  const [date,setDate] = useState('1990-01-01')
  const [time,setTime] = useState('12:00')
  const [place,setPlace] = useState('Sedona, AZ')
  const [data,setData] = useState<ChartData | null>(null)
  const [loading,setLoading] = useState(false)
  const [error,setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/charts/natal', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ date, time, place }) })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Failed')
      setData(j)
    } catch (err:any) {
      setError(err?.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ padding: '32px 0', color: '#E5E7EB' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display:'grid', gap: 24, gridTemplateColumns:'380px 1fr' }}>
        <form onSubmit={submit} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:16 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Natal Chart</h1>
          <label style={{ display:'block', fontSize:12, color:'#9CA3AF' }}>Date</label>
          <input value={date} onChange={e=>setDate(e.target.value)} type="date" required style={{ width:'100%', marginBottom:10, background:'#0B0F14', color:'#E5E7EB', border:'1px solid #1F2937', borderRadius:8, padding:'8px 10px' }} />
          <label style={{ display:'block', fontSize:12, color:'#9CA3AF' }}>Time (local)</label>
          <input value={time} onChange={e=>setTime(e.target.value)} type="time" required style={{ width:'100%', marginBottom:10, background:'#0B0F14', color:'#E5E7EB', border:'1px solid #1F2937', borderRadius:8, padding:'8px 10px' }} />
          <label style={{ display:'block', fontSize:12, color:'#9CA3AF' }}>Place</label>
          <input value={place} onChange={e=>setPlace(e.target.value)} type="text" placeholder="City, Country" required style={{ width:'100%', marginBottom:16, background:'#0B0F14', color:'#E5E7EB', border:'1px solid #1F2937', borderRadius:8, padding:'8px 10px' }} />
          <button type="submit" disabled={loading} style={{ width:'100%', padding:'10px 12px', background:'#22D3EE', color:'#0B0F14', fontWeight:700, border:'none', borderRadius:8 }}>{loading ? 'Calculating…' : 'Generate Chart'}</button>
          {error && <div style={{ marginTop:10, color:'#FCA5A5' }}>{error}</div>}
        </form>

        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:16, minHeight:600 }}>
          {!data ? (
            <div style={{ color:'#9CA3AF' }}>Enter date, time, and place to render a chart.</div>
          ) : (
            <Wheel data={data} />
          )}
        </div>
      </div>
    </main>
  )
}

function Wheel({ data }: { data: ChartData }) {
  const size = 680
  const rOuter = size/2 - 10
  const rSigns = rOuter - 36
  const rHouses = rSigns - 20
  const rPlanets = rHouses - 46
  const cx = size/2, cy = size/2

  const planetPos = useMemo(() => {
    const map: Record<string,{ x:number; y:number; ang:number }> = {}
    for (const p of data.planets) {
      const ang = ((-p.lon + 90) * Math.PI) / 180 // 0 Aries at right, clockwise
      const x = cx + Math.cos(ang) * rPlanets
      const y = cy - Math.sin(ang) * rPlanets
      map[p.name] = { x, y, ang }
    }
    return map
  }, [data, cx, cy, rPlanets])

  function arcPath(r:number, startDeg:number, endDeg:number) {
    const s = ((-startDeg + 90) * Math.PI)/180
    const e = ((-endDeg + 90) * Math.PI)/180
    const x1 = cx + Math.cos(s)*r, y1 = cy - Math.sin(s)*r
    const x2 = cx + Math.cos(e)*r, y2 = cy - Math.sin(e)*r
    const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 0 ${x2} ${y2}`
  }

  const aspectColor = (t:string) => t==='Conjunction' ? '#e5e7eb' : t==='Sextile' ? '#22c55e' : t==='Square' ? '#ef4444' : t==='Trine' ? '#22d3ee' : '#a78bfa'

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="auto" style={{ display:'block' }}>
      <defs>
        <radialGradient id="g" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#0B0F14" />
          <stop offset="100%" stopColor="#0F141A" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={rOuter} fill="url(#g)" stroke="rgba(255,255,255,0.08)" />

      {/* Zodiac sectors */}
      {Array.from({ length: 12 }).map((_,i) => (
        <path key={i} d={arcPath(rSigns, i*30, (i+1)*30)} stroke="rgba(255,255,255,0.08)" fill="none" strokeWidth={18} />
      ))}

      {/* Sign glyphs */}
      {Array.from({ length: 12 }).map((_,i) => {
        const mid = i*30 + 15
        const a = ((-mid + 90) * Math.PI)/180
        const x = cx + Math.cos(a)*(rSigns)
        const y = cy - Math.sin(a)*(rSigns)
        return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="#A1A1AA" style={{ fontSize: 18 }}>{signGlyph[i]}</text>
      })}

      {/* House cusps */}
      {data.meta.houses?.map((deg,i) => {
        const a = ((-deg + 90) * Math.PI)/180
        const x1 = cx + Math.cos(a)*(rHouses-18)
        const y1 = cy - Math.sin(a)*(rHouses-18)
        const x2 = cx + Math.cos(a)*(rHouses+18)
        const y2 = cy - Math.sin(a)*(rHouses+18)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i===0||i===9?'#22D3EE':'rgba(255,255,255,0.2)'} strokeWidth={i===0||i===9?2:1} />
      })}

      {/* Aspect lines */}
      {data.aspects.map((as,i) => {
        const A = planetPos[as.a], B = planetPos[as.b]
        if (!A || !B) return null
        return <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={aspectColor(as.type)} strokeOpacity={0.7} strokeWidth={1.5} />
      })}

      {/* Planet glyphs */}
      {data.planets.map((p,i) => {
        const pos = planetPos[p.name]
        if (!pos) return null
        return (
          <g key={i} transform={`translate(${pos.x},${pos.y})`}>
            <circle r={12} fill="rgba(34,211,238,0.15)" stroke="#22D3EE" strokeWidth={1} />
            <text x={0} y={1} textAnchor="middle" dominantBaseline="middle" fill="#E5E7EB" style={{ fontSize: 12 }}>{glyph[p.name]}</text>
          </g>
        )
      })}

      {/* Title */}
      <text x={cx} y={size-18} textAnchor="middle" fill="#9CA3AF" style={{ fontSize: 12 }}>
        {data.meta.place} — {new Date(data.meta.datetimeLocal).toLocaleString()} ({data.meta.tz})
      </text>
    </svg>
  )
}
