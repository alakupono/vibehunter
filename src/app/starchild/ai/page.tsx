'use client'

import { useEffect, useRef, useState } from 'react'
import { ChartWheel } from '@/components/ChartWheel'
import s from './chat.module.css'
import { Planetarium } from '@/components/Planetarium'
import { AlienOrigins } from '@/components/AlienOrigins'

type Planet = { name: string; lon: number; sign: string }
type Aspect = { a: string; b: string; type: string; orb: number }

export default function AIPage() {
  const [messages, setMessages] = useState<{role:'user'|'assistant';content:string}[]>([])
  const [input, setInput] = useState('Show my birth chart for 1990-01-01 at noon in Sedona, AZ')
  const [chart, setChart] = useState<null | any>(null)
  const [interp, setInterp] = useState<null | any>(null)
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'wheel'|'planetary'|'origins'>('wheel')
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(()=>{
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  },[messages, loading])

  async function send() {
    const text = input.trim()
    if (!text) return
    setMessages(m => [...m, { role: 'user', content: text }])
    setLoading(true)
    try {
      const res = await fetch('/api/starchild/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, { role: 'user', content: text }], context: { chart } })
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Chat failed')
      if (j.chart) {
        setChart(j.chart)
        // auto-switch: if question mentions 'where', 'position', 'planets', prefer planetary view
        const q = text.toLowerCase()
        if (/(where|position|planets|3d|orbit|aligned)/.test(q)) setView('planetary')
      }
      if (j.interpretation) setInterp(j.interpretation)
      if (j.message) setMessages(m => [...m, j.message])
    } catch (e:any) {
      setMessages(m => [...m, { role: 'assistant', content: e?.message || 'Failed' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ padding: '24px 0', color:'#E5E7EB' }}>
      <div style={{ maxWidth: 1200, margin:'0 auto', padding:'0 24px', display:'grid', gap: 16, gridTemplateColumns:'420px 1fr' }}>
        <div className={s.panel}>
          <div className={s.header}>Starchild Assistant</div>
          <div className={s.messages} ref={listRef}>
            {messages.length === 0 && (
              <div className={s.placeholder}>
                Ask me in plain language. Examples:
                <div className={s.suggestions}>
                  <button className={s.sugg} onClick={()=>setInput('Make my chart: 1990-01-01 12:00 Sedona, AZ')}>Make my chart: 1990-01-01 12:00 Sedona, AZ</button>
                  <button className={s.sugg} onClick={()=>setInput('Do my Sun and Moon clash?')}>Do my Sun and Moon clash?</button>
                  <button className={s.sugg} onClick={()=>setInput('What does my Ascendant mean?')}>What does my Ascendant mean?</button>
                </div>
              </div>
            )}
            {messages.map((m,i)=> (
              <div key={i} className={`${s.row} ${m.role==='user'?s.rowYou:''}`}>
                {m.role==='assistant' && <div className={s.avatar}>TL</div>}
                <div className={`${s.bubble} ${m.role==='user'?s.bubbleUser:s.bubbleAssistant}`}>{m.content}</div>
                {m.role==='user' && <div className={s.avatar}>You</div>}
              </div>
            ))}
            {loading && (
              <div className={s.row}>
                <div className={s.avatar}>TL</div>
                <div className={`${s.bubble} ${s.bubbleAssistant}`}>
                  <span className={s.typing}><span></span><span></span><span></span></span>
                </div>
              </div>
            )}
          </div>
          <div className={s.inputBar}>
            <input
              className={s.input}
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); send() } }}
              placeholder="Ask anything: 'Do my Sun and Moon clash?' or '1990-01-01 12:00 Sedona, AZ'"
            />
            <button className={s.send} onClick={send} disabled={loading}>{loading?'Working…':'Send'}</button>
          </div>
        </div>
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:12, minHeight:'70vh' }}>
          {!chart ? <div style={{ color:'#9CA3AF' }}>Ask for a chart to see the wheel and interpretation here.</div> : (
            <div>
              <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                <button className={s.sugg} onClick={()=>setView('wheel')} style={{ padding:'6px 10px', background: view==='wheel' ? '#13202a' : undefined }}>Natal Chart</button>
                <button className={s.sugg} onClick={()=>setView('planetary')} style={{ padding:'6px 10px', background: view==='planetary' ? '#13202a' : undefined }}>Planetary Chart</button>
                <button className={s.sugg} onClick={()=>setView('origins')} style={{ padding:'6px 10px', background: view==='origins' ? '#13202a' : undefined }}>Alien Origins</button>
              </div>
              {view === 'wheel' ? (
                <ChartWheel data={chart} />
              ) : view === 'planetary' ? (
                <Planetarium planets={chart.planets} asc={chart.meta?.asc} mc={chart.meta?.mc} houses={chart.meta?.houses} rotationSpeed={0} zoom={1.15} tiltDeg={25} enableControls={true} />
              ) : (
                <AlienOrigins />
              )}
              {interp && (
                <div style={{ marginTop:16 }}>
                  <h3 style={{ fontSize:18, marginBottom:6 }}>Interpretation</h3>
                  {interp.answer ? (
                    <div>
                      <p style={{ color:'#A1A1AA' }}>{interp.answer}</p>
                      {Array.isArray(interp.bullets) && interp.bullets.length>0 && (
                        <ul style={{ marginLeft:18 }}>
                          {interp.bullets.map((b:string,i:number)=>(<li key={i} style={{ color:'#9CA3AF' }}>{b}</li>))}
                        </ul>
                      )}
                      {Array.isArray(interp.nextQuestions) && interp.nextQuestions.length>0 && (
                        <div style={{ marginTop:8, display:'flex', gap:8, flexWrap:'wrap' }}>
                          {interp.nextQuestions.map((q:string,i:number)=> (
                            <button key={i} className={s.sugg} onClick={()=>setInput(q)}>{q}</button>
                          ))}
                        </div>
                      )}
                      <div style={{ marginTop:10 }}>
                        <button className={s.sugg} onClick={()=>{
                          const text = `Answer\n${interp.answer}\n\nKey points\n- ${(interp.bullets||[]).join('\n- ')}\n\nSuggested questions\n- ${(interp.nextQuestions||[]).join('\n- ')}`
                          const blob = new Blob([text], { type: 'text/plain' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a'); a.href=url; a.download='interpretation.txt'; a.click(); URL.revokeObjectURL(url)
                        }}>Download report</button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ color:'#A1A1AA' }}>{interp.summary}</p>
                  )}
                  {Array.isArray(interp.planetInsights) && interp.planetInsights.length>0 && (
                    <div style={{ marginTop:10 }}>
                      <h4 style={{ fontSize:16, marginBottom:4 }}>Planet Insights</h4>
                      <ul style={{ marginLeft:18 }}>
                        {interp.planetInsights.map((p:any,i:number)=> <li key={i} style={{ color:'#9CA3AF' }}><b>{p.body}:</b> {p.note}</li>)}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(interp.aspectHighlights) && interp.aspectHighlights.length>0 && (
                    <div style={{ marginTop:10 }}>
                      <h4 style={{ fontSize:16, marginBottom:4 }}>Aspects</h4>
                      <ul style={{ marginLeft:18 }}>
                        {interp.aspectHighlights.map((a:any,i:number)=> <li key={i} style={{ color:'#9CA3AF' }}><b>{a.pair}:</b> {a.note}</li>)}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(interp.practicalReflection) && interp.practicalReflection.length>0 && (
                    <div style={{ marginTop:10 }}>
                      <h4 style={{ fontSize:16, marginBottom:4 }}>Reflection</h4>
                      <ul style={{ marginLeft:18 }}>
                        {interp.practicalReflection.map((s:string,i:number)=> <li key={i} style={{ color:'#9CA3AF' }}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}


