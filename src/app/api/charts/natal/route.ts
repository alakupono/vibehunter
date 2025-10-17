import { NextResponse } from 'next/server'
import { DateTime } from 'luxon'
import tzLookup from 'tz-lookup'
import * as Astronomy from 'astronomy-engine'

const PLANETS = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'] as const
const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']

function signOf(lon: number) {
  const idx = Math.floor((((lon % 360)+360)%360)/30)
  return SIGNS[idx]
}

export async function POST(req: Request) {
  try {
    const { date, time, place } = await req.json()
    if (!date || !time || !place) return NextResponse.json({ error: 'date, time, place required' }, { status: 400 })

    const gkey = process.env.GOOGLE_GEOCODING_API_KEY
    if (!gkey) return NextResponse.json({ error: 'Missing GOOGLE_GEOCODING_API_KEY' }, { status: 500 })

    const geo = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(place)}&key=${gkey}`).then(r => r.json())
    const loc = geo?.results?.[0]?.geometry?.location
    if (!loc) return NextResponse.json({ error: 'Could not geocode place' }, { status: 400 })
    const lat = loc.lat as number
    const lng = loc.lng as number

    const tz = tzLookup(lat, lng)
    const local = DateTime.fromISO(`${date}T${time}`, { zone: tz })
    if (!local.isValid) return NextResponse.json({ error: 'Invalid date/time' }, { status: 400 })
    const instant = new Astronomy.AstroTime(local.toUTC().toJSDate())

    const planets = PLANETS.map(name => {
      // Derive Sun geocentric ecliptic longitude from Earth's heliocentric longitude + 180
      const lon = name === 'Sun'
        ? (Astronomy.EclipticLongitude((Astronomy as any).Body?.Earth ?? ('Earth' as any), instant) + 180)
        : Astronomy.EclipticLongitude(name as any, instant)
      const norm = ((lon % 360) + 360) % 360
      return { name, lon: norm, sign: signOf(norm) }
    })

    // Retrograde flag by comparing position over small delta (1 day)
    try {
      const t2 = new Astronomy.AstroTime(new Date(local.plus({ days: 1 }).toUTC().toJSDate()))
      for (const p of planets) {
        const lon2 = (p.name === 'Sun'
          ? (Astronomy.EclipticLongitude((Astronomy as any).Body?.Earth ?? ('Earth' as any), t2) + 180)
          : Astronomy.EclipticLongitude(p.name as any, t2))
        const d = (((lon2 - p.lon + 540) % 360) - 180)
        ;(p as any).retrograde = d < 0
      }
    } catch {}

    // Ascendant and MC
    const gstHours = Astronomy.SiderealTime(instant) // Greenwich sidereal hours
    const theta = (((gstHours * 15) + lng) % 360 + 360) % 360 // local sidereal degrees
    const eps = Astronomy.e_tilt(instant).tobl // true obliquity (deg)
    const θ = (Math.PI / 180) * theta
    const ε = (Math.PI / 180) * eps
    const φ = (Math.PI / 180) * lat
    let asc = Math.atan2(Math.sin(θ) * Math.cos(ε) - Math.tan(φ) * Math.sin(ε), Math.cos(θ))
    asc = ((asc * 180 / Math.PI) + 360) % 360
    let mc = Math.atan2(Math.sin(θ) * Math.cos(ε), Math.cos(θ))
    mc = ((mc * 180 / Math.PI) + 360) % 360

    // Equal 30° houses starting at ascendant (simple Whole Sign-like layout)
    const houses = Array.from({ length: 12 }, (_, i) => ((asc + i * 30) % 360))

    const aspects: Array<{a:string;b:string;type:string;orb:number}> = []
    const byName = Object.fromEntries(planets.map(p => [p.name, p.lon])) as Record<string, number>
    const defs = [
      { type: 'Conjunction', angle: 0,   orb: 6 },
      { type: 'Sextile',     angle: 60,  orb: 4 },
      { type: 'Square',      angle: 90,  orb: 5 },
      { type: 'Trine',       angle: 120, orb: 5 },
      { type: 'Opposition',  angle: 180, orb: 6 },
    ] as const

    for (let i = 0; i < PLANETS.length; i++) {
      for (let j = i + 1; j < PLANETS.length; j++) {
        const a = PLANETS[i], b = PLANETS[j]
        const d = Math.abs((((byName[a] - byName[b]) + 540) % 360) - 180)
        for (const def of defs) {
          const diff = Math.abs(d - def.angle)
          if (diff <= def.orb) { aspects.push({ a, b, type: def.type, orb: +diff.toFixed(2) }); break }
        }
      }
    }

    // Aspects to angles (Asc, MC)
    const angleList = [ { key: 'Asc', lon: asc }, { key: 'MC', lon: mc } ]
    for (const angle of angleList) {
      for (const p of planets) {
        const d = Math.abs((((p.lon - angle.lon) + 540) % 360) - 180)
        for (const def of defs) {
          const diff = Math.abs(d - def.angle)
          if (diff <= def.orb) { aspects.push({ a: p.name, b: angle.key, type: def.type, orb: +diff.toFixed(2) }); break }
        }
      }
    }

    return NextResponse.json({ meta: { place, tz, datetimeLocal: local.toISO(), lat, lng, asc, mc, houses }, planets, aspects })
  } catch (e: any) {
    const msg = typeof e === 'string' ? e : (e?.message ?? 'unexpected')
    console.error('natal route error', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
