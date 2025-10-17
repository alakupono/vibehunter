import * as Astronomy from 'astronomy-engine'
import { DateTime } from 'luxon'
import tzLookup from 'tz-lookup'

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']
function signOf(lon: number) { const idx = Math.floor((((lon % 360)+360)%360)/30); return SIGNS[idx] }

export type PlanetPoint = { name: string; lon: number; sign: string; retrograde?: boolean }
export type AspectLink = { a: string; b: string; type: string; orb: number }
export type NatalResult = { meta: { place: string; tz: string; datetimeLocal: string; lat: number; lng: number; asc: number; mc: number; houses: number[] }, planets: PlanetPoint[], aspects: AspectLink[] }

export async function computeNatal(params: { date: string; time: string; place: string; geocode: (addr: string) => Promise<{ lat: number; lng: number }> }): Promise<NatalResult> {
  const { date, time, place, geocode } = params
  const { lat, lng } = await geocode(place)
  const tz = tzLookup(lat, lng)
  const local = DateTime.fromISO(`${date}T${time}`, { zone: tz })
  if (!local.isValid) throw new Error('Invalid date/time')
  const instant = new Astronomy.AstroTime(local.toUTC().toJSDate())

  const PLANETS = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'] as const
  const planets: PlanetPoint[] = PLANETS.map(name => {
    const lon = name === 'Sun'
      ? (Astronomy.EclipticLongitude((Astronomy as any).Body?.Earth ?? ('Earth' as any), instant) + 180)
      : Astronomy.EclipticLongitude(name as any, instant)
    const norm = ((lon % 360) + 360) % 360
    return { name, lon: norm, sign: signOf(norm) }
  })

  // Retrograde flag
  try {
    const t2 = new Astronomy.AstroTime(new Date(local.plus({ days: 1 }).toUTC().toJSDate()))
    for (const p of planets as PlanetPoint[]) {
      const lon2 = (p.name === 'Sun'
        ? (Astronomy.EclipticLongitude((Astronomy as any).Body?.Earth ?? ('Earth' as any), t2) + 180)
        : Astronomy.EclipticLongitude(p.name as any, t2))
      const d = (((lon2 - p.lon + 540) % 360) - 180)
      p.retrograde = d < 0
    }
  } catch {}

  // Asc/MC
  const gstHours = Astronomy.SiderealTime(instant)
  const theta = (((gstHours * 15) + lng) % 360 + 360) % 360
  const eps = Astronomy.e_tilt(instant).tobl
  const θ = (Math.PI/180)*theta, ε = (Math.PI/180)*eps, φ = (Math.PI/180)*lat
  let asc = Math.atan2(Math.sin(θ)*Math.cos(ε) - Math.tan(φ)*Math.sin(ε), Math.cos(θ)); asc = ((asc*180/Math.PI)+360)%360
  let mc  = Math.atan2(Math.sin(θ)*Math.cos(ε), Math.cos(θ)); mc = ((mc*180/Math.PI)+360)%360
  const houses = Array.from({length:12},(_,i)=>((asc + i*30)%360))

  // Aspects
  const defs = [
    { type: 'Conjunction', angle: 0,   orb: 6 },
    { type: 'Sextile',     angle: 60,  orb: 4 },
    { type: 'Square',      angle: 90,  orb: 5 },
    { type: 'Trine',       angle: 120, orb: 5 },
    { type: 'Opposition',  angle: 180, orb: 6 },
  ] as const
  const aspects: AspectLink[] = []
  const byName = Object.fromEntries(planets.map(p=>[p.name,p.lon])) as Record<string,number>
  for (let i=0;i<PLANETS.length;i++){
    for (let j=i+1;j<PLANETS.length;j++){
      const a = PLANETS[i], b = PLANETS[j]
      const d = Math.abs((((byName[a]-byName[b])+540)%360)-180)
      for (const def of defs){ const diff=Math.abs(d-def.angle); if (diff<=def.orb){ aspects.push({a,b,type:def.type,orb:+diff.toFixed(2)}); break } }
    }
  }
  for (const angle of [{key:'Asc',lon:asc},{key:'MC',lon:mc}]){
    for (const p of planets){
      const d = Math.abs((((p.lon-angle.lon)+540)%360)-180)
      for (const def of defs){ const diff=Math.abs(d-def.angle); if (diff<=def.orb){ aspects.push({a:p.name,b:angle.key,type:def.type,orb:+diff.toFixed(2)}); break } }
    }
  }

  return { meta: { place, tz, datetimeLocal: local.toISO()!, lat, lng, asc, mc, houses }, planets, aspects }
}


