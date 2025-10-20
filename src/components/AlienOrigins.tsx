'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import origins from '@/data/alien-origins.json'
import starsBright from '@/data/stars_bright.json'
import deepsky from '@/data/deepsky.json'
import constellationLines from '@/data/constellation_lines.json'
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useRouter } from 'next/navigation'

function raDecToVec(ra_deg: number, dec_deg: number, dist_ly: number, scale = 0.8) {
  const ra = (Math.PI/180) * ra_deg
  const dec = (Math.PI/180) * dec_deg
  // log compression so far objects remain visible while preserving radial order
  const r = Math.log(1 + Math.max(0, dist_ly)) * scale
  return new THREE.Vector3(
    r * Math.cos(dec) * Math.cos(ra),
    r * Math.sin(dec),
    r * Math.cos(dec) * Math.sin(ra)
  )
}

export function AlienOrigins({ width=520, height=520 }: { width?: number; height?: number }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [tooltip, setTooltip] = useState<null | { x: number; y: number; text: string }>(null)
  const [compareScale, setCompareScale] = useState(true)
  const [showSolar, setShowSolar] = useState(true)
  const [dateISO, setDateISO] = useState<string>(new Date().toISOString().slice(0,10))
  const [showStars, setShowStars] = useState(true)
  const [showDSO, setShowDSO] = useState(true)
  const [showLines, setShowLines] = useState(true)
  const [starMode, setStarMode] = useState<'dome'|'distance'>('dome')
  const router = useRouter()

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(typeof window !== 'undefined' ? window.devicePixelRatio : 1)
    el.innerHTML = ''
    el.appendChild(renderer.domElement)

    // camera with dynamic aspect; size set below
    const camera = new THREE.PerspectiveCamera(55, 1, 0.01, 10000)
    camera.position.set(0, 1.2, 12); camera.lookAt(0,0,0)

    scene.add(new THREE.AmbientLight(0xffffff, 1.2))
    const dir = new THREE.DirectionalLight(0xffffff, 1.4)
    dir.position.set(2,3,4); scene.add(dir)

    const group = new THREE.Group()
    scene.add(group)

    // orbit controls for rotate/zoom (defined early to avoid TDZ in listeners below)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.enablePan = true
    controls.minDistance = 0.5
    controls.maxDistance = 500

    // Starfield backdrop
    const starsGeo = new THREE.BufferGeometry()
    const starCount = 1500
    const positions = new Float32Array(starCount * 3)
    for (let i=0;i<starCount;i++) {
      const r = 200 + Math.random()*200
      const theta = Math.random()*Math.PI*2
      const phi = Math.acos(2*Math.random()-1)
      positions[i*3+0] = r * Math.sin(phi) * Math.cos(theta)
      positions[i*3+1] = r * Math.cos(phi)
      positions[i*3+2] = r * Math.sin(phi) * Math.sin(theta)
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const stars = new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0x7f8ea3, size: 1.0, sizeAttenuation: true, transparent: true, opacity: 0.9 }))
    scene.add(stars)

    // Sun reference at origin
    const sun = new THREE.Mesh(new THREE.SphereGeometry(0.1, 32, 32), new THREE.MeshStandardMaterial({ color: 0xffcc55, emissive: 0x332200, emissiveIntensity: 0.35 }))
    group.add(sun)

    // Simple solar-system scale markers (circles)
    const radii = [0.5, 0.9, 1.2, 1.5, 2.2] // inner to outer markers
    const ringMat = new THREE.LineBasicMaterial({ color: 0x0b1220, transparent: true, opacity: 0.2 })
    for (const r of radii) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(r-0.002, r+0.002, 64), new THREE.MeshBasicMaterial({ color: 0x0b1220, side: THREE.DoubleSide, transparent: true, opacity: 0.18 }))
      ring.rotation.x = Math.PI/2
      group.add(ring)
    }

    const geometry = new THREE.SphereGeometry(0.06, 16, 16)
    const picker: Array<{ mesh: any; label: string; info: string; slug?: string }> = []

    const positionsAll: any[] = []
    for (const o of origins as any[]) {
      if ((o as any).exclude_from_map) continue
      const scaleR = compareScale ? (Math.log(1 + Math.max(0, o.distance_ly)) * 0.8) : (o.distance_ly * 0.02)
      const pos = raDecToVec(o.ra_deg, o.dec_deg, scaleR, 1)
      positionsAll.push(pos)
      const mat = new THREE.MeshStandardMaterial({ color: 0xbfe7ef, emissive: 0x5cc3d6, emissiveIntensity: 1.2 })
      const m = new THREE.Mesh(geometry, mat)
      m.position.copy(pos)
      group.add(m)
      const info = `${o.name}\n${o.home} — ${o.distance_ly} ly\nConstellation: ${o.constellation || '—'}\nSources: ${(o.sources||[]).join('; ')}\nConfidence: ${o.confidence}`
      picker.push({ mesh: m, label: o.name, info, slug: (o as any).slug || o.id } as any)

      // label sprite
      const cvs = document.createElement('canvas'); cvs.width=256; cvs.height=128
      const ctx = cvs.getContext('2d')!; ctx.fillStyle = '#cbd5e1'; ctx.font='20px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle'
      ctx.fillText(o.name, 128, 64)
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cvs), transparent: true }))
      spr.scale.set(0.6, 0.3, 1)
      spr.position.copy(pos.clone().add(new THREE.Vector3(0, 0.2, 0)))
      group.add(spr)
    }

    // ===== Stars & Celestial Layers =====
    const layersGroup = new THREE.Group()
    group.add(layersGroup)

    const domeRadius = 20

    function makeRadialTexture(color: number, size = 128, inner = 1.0, outer = 0.0) {
      const cvs = document.createElement('canvas'); cvs.width = size; cvs.height = size
      const ctx = cvs.getContext('2d')!
      const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2)
      const c = new THREE.Color(color)
      const rgb = `rgb(${Math.round(c.r*255)},${Math.round(c.g*255)},${Math.round(c.b*255)})`
      g.addColorStop(0, rgb)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.fillRect(0,0,size,size)
      const tex = new THREE.CanvasTexture(cvs)
      tex.anisotropy = 4
      tex.needsUpdate = true
      return tex
    }

    // Stars (bright catalog)
    if (showStars) {
      const ra = (starsBright as any).ra_deg as number[]
      const dec = (starsBright as any).dec_deg as number[]
      const mag = (starsBright as any).mag as number[]
      const bv = (starsBright as any).bv as number[]
      const plx = (starsBright as any).plx_mas as number[]
      const names = (starsBright as any).name as string[]

      const N = Math.min(ra.length, dec.length, mag.length)

      // Sort by magnitude (brightest first) for LOD via drawRange
      const idx = Array.from({ length: N }, (_, i) => i).sort((a,b) => mag[a] - mag[b])

      const positions = new Float32Array(N * 3)
      const colors = new Float32Array(N * 3)
      const sizeByMag = (m: number) => Math.max(0.6, 2.2 - 0.35 * (m || 6))

      // simple color from B-V (blue to red)
      function bvToColor(val: number) {
        const t = Math.max(-0.3, Math.min(1.8, val || 0.65))
        // map to blue->white->red
        const r = t > 0.65 ? 1 : t / 0.65
        const b = t < 0.65 ? 1 : (1 - (t - 0.65) / 1.15)
        const g = (r + b) * 0.5
        return new THREE.Color(r, g, b)
      }

      // build ordered buffers
      const orderedNames: Array<{ name: string; pos: THREE.Vector3; m: number }> = []
      for (let j = 0; j < N; j++) {
        const i = idx[j]
        const raRad = (Math.PI/180) * ra[i]
        const decRad = (Math.PI/180) * dec[i]
        const unit = new THREE.Vector3(
          Math.cos(decRad) * Math.cos(raRad),
          Math.sin(decRad),
          Math.cos(decRad) * Math.sin(raRad)
        )
        let pos: THREE.Vector3
        if (starMode === 'distance' && plx && plx[i] > 0) {
          const distPc = 1000 / plx[i]
          const distLy = distPc * 3.26156
          const r = Math.min(50, Math.max(0.1, distLy)) * 0.2 // compress scale for scene
          pos = unit.clone().multiplyScalar(r)
        } else {
          pos = unit.clone().multiplyScalar(domeRadius)
        }
        positions[j*3+0] = pos.x
        positions[j*3+1] = pos.y
        positions[j*3+2] = pos.z
        const c = bvToColor(bv ? bv[i] : 0.65)
        colors[j*3+0] = c.r
        colors[j*3+1] = c.g
        colors[j*3+2] = c.b
        if (names && names[i] && (mag[i] ?? 99) <= 1.5) orderedNames.push({ name: names[i], pos, m: mag[i] })
      }

      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      const starTex = makeRadialTexture(0xffffff, 128)
      const mat = new THREE.PointsMaterial({
        vertexColors: true,
        map: starTex,
        size: 2.2,
        sizeAttenuation: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        alphaTest: 0.15
      })
      const starsPoints = new THREE.Points(geo, mat)
      layersGroup.add(starsPoints)

      // simple LOD by camera distance -> adjust drawRange
      function updateStarLOD() {
        const dist = camera.position.length()
        const frac = Math.max(0.2, Math.min(1.0, 0.25 + 50 / Math.max(10, dist)))
        const count = Math.floor(N * frac)
        geo.setDrawRange(0, count)
        ;(mat as any).size = 1.2 + 2.6 * frac
      }

      // initial
      updateStarLOD()

      // labels for brightest
      orderedNames.sort((a,b)=>a.m-b.m)
      const top = orderedNames.slice(0, 12)
      for (const s of top) {
        const cvs = document.createElement('canvas'); cvs.width=256; cvs.height=128
        const ctx = cvs.getContext('2d')!; ctx.fillStyle = '#cbd5e1'; ctx.font='24px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle'
        ctx.fillText(s.name, 128, 64)
        const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cvs), transparent: true }))
        spr.scale.set(0.7, 0.35, 1)
        spr.position.copy(s.pos.clone().add(new THREE.Vector3(0, 0.15, 0)))
        layersGroup.add(spr)
      }

      // respond to control changes
      const onChange = () => updateStarLOD()
      controls.addEventListener('change', onChange)
    }

    // Deep-sky objects
    if (showDSO) {
      const typeColor: Record<string, number> = {
        galaxy: 0x60a5fa,
        nebula: 0x86efac,
        cluster: 0xfacc15,
        globular: 0xf8fafc
      }
      for (const d of (deepsky as any[])) {
        const raRad = (Math.PI/180) * (d as any).ra_deg
        const decRad = (Math.PI/180) * (d as any).dec_deg
        const unit = new THREE.Vector3(
          Math.cos(decRad) * Math.cos(raRad),
          Math.sin(decRad),
          Math.cos(decRad) * Math.sin(raRad)
        )
        const pos = unit.clone().multiplyScalar(domeRadius)
        const col = typeColor[(d as any).type] || 0x93c5fd
        const glow = makeRadialTexture(col, 128)
        const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xffffff, transparent: true, depthWrite:false, blending: THREE.AdditiveBlending, opacity: 1.0, alphaTest: 0.05 }))
        const scale = Math.max(0.3, Math.min(0.9, ((d as any).size_arcmin || 10) / 120))
        spr.scale.set(scale, scale, 1)
        spr.position.copy(pos)
        layersGroup.add(spr)

        // label only for the very brightest DSOs to reduce clutter
        if ((d as any).mag !== undefined && (d as any).mag <= 4.0) {
          const lcv = document.createElement('canvas'); lcv.width=256; lcv.height=128
          const lctx = lcv.getContext('2d')!; lctx.fillStyle = '#94a3b8'; lctx.font='18px system-ui'; lctx.textAlign='center'; lctx.textBaseline='middle'
          lctx.fillText((d as any).name || (d as any).id, 128, 64)
          const lsp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(lcv), transparent: true }))
          lsp.scale.set(0.55, 0.28, 1)
          lsp.position.copy(pos.clone().add(new THREE.Vector3(0, 0.14, 0)))
          layersGroup.add(lsp)
        }
      }
    }

    // Constellation linework
    if (showLines) {
      const linePositions: number[] = []
      for (const c of (constellationLines as any[])) {
        for (const seg of (c as any).segments as any[]) {
          const a = seg[0], b = seg[1]
          const raA = (Math.PI/180) * a.ra_deg, decA = (Math.PI/180) * a.dec_deg
          const raB = (Math.PI/180) * b.ra_deg, decB = (Math.PI/180) * b.dec_deg
          const uA = new THREE.Vector3(Math.cos(decA)*Math.cos(raA), Math.sin(decA), Math.cos(decA)*Math.sin(raA)).multiplyScalar(domeRadius)
          const uB = new THREE.Vector3(Math.cos(decB)*Math.cos(raB), Math.sin(decB), Math.cos(decB)*Math.sin(raB)).multiplyScalar(domeRadius)
          linePositions.push(uA.x, uA.y, uA.z, uB.x, uB.y, uB.z)
        }
      }
      const lgeo = new THREE.BufferGeometry()
      lgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3))
      const lmat = new THREE.LineBasicMaterial({ color: 0x8aa0b8, transparent: true, opacity: 0.95 })
      const lines = new THREE.LineSegments(lgeo, lmat)
      layersGroup.add(lines)
    }

    // fit camera to contain all points
    if (positionsAll.length) {
      const bbox = new THREE.Box3().setFromPoints(positionsAll)
      const sphere = bbox.getBoundingSphere(new THREE.Sphere())
      const fov = (camera.fov * Math.PI) / 180
      const dist = (sphere.radius / Math.sin(fov / 2)) * 1.2
      camera.position.set(sphere.center.x, sphere.center.y + sphere.radius * 0.2, dist)
      camera.lookAt(sphere.center)
    }

    // controls already initialized above

    const ray = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    function onMove(ev: MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
      ray.setFromCamera(mouse, camera)
      const objs = picker.map(p => p.mesh)
      const hit = ray.intersectObjects(objs, false)[0]
      if (hit) {
        const item = picker.find(p => p.mesh === hit.object) as any
        setTooltip({ x: ev.clientX - rect.left + 8, y: ev.clientY - rect.top + 8, text: `${item.label}\n${item.info}\n(Claims; not scientific)` })
      } else {
        setTooltip(null)
      }
    }
    renderer.domElement.addEventListener('mousemove', onMove)

    function onClick(ev: MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
      ray.setFromCamera(mouse, camera)
      const hit = ray.intersectObjects(picker.map(p => p.mesh), false)[0]
      if (hit) {
        const item = picker.find(p => p.mesh === hit.object) as any
        if (item?.slug) router.push(`/origins/${item.slug}`)
      }
    }
    renderer.domElement.addEventListener('click', onClick)

    function animate() { controls.update(); renderer.render(scene, camera); requestAnimationFrame(animate) }
    animate()

    // resize observer to fill container (no optional chaining on constructor)
    let ro: any = null
    if (typeof window !== 'undefined') {
      const RO = (window as any).ResizeObserver
      if (RO) {
        ro = new RO(() => {
          const w = el.clientWidth || width
          const h = el.clientHeight || height
          renderer.setSize(w, h, false)
          camera.aspect = w / h
          camera.updateProjectionMatrix()
        })
      }
    }
    const w0 = el.clientWidth || width, h0 = el.clientHeight || height
    renderer.setSize(w0, h0, false)
    camera.aspect = w0 / h0
    camera.updateProjectionMatrix()
    if (ro) ro.observe(el)

    return () => { renderer.dispose(); renderer.domElement.removeEventListener('mousemove', onMove); renderer.domElement.removeEventListener('click', onClick); ro && ro.disconnect && ro.disconnect(); controls.dispose() }
  }, [width, height, compareScale, showSolar, dateISO, showStars, showDSO, showLines, starMode])

  return (
    <div style={{ position:'relative', width:'100%', height }}>
      <div style={{ position:'absolute', left: 8, top: 8, zIndex: 100, display:'flex', gap:8, flexWrap:'wrap' }}>
        <select aria-label="Scale mode" title="Scale mode" value={compareScale ? 'compare':'ly'} onChange={e=>setCompareScale(e.target.value === 'compare')} style={{ background:'#0b0f14', color:'#e5e7eb', border:'1px solid #1f2937', borderRadius:6, padding:'6px 8px' }}>
          <option value="compare">Scale: Compare</option>
          <option value="ly">Scale: Interstellar (ly)</option>
        </select>
        <label style={{ display:'flex', alignItems:'center', gap:6, background:'#0b0f14', color:'#e5e7eb', border:'1px solid #1f2937', borderRadius:6, padding:'6px 8px' }}>
          <input type="checkbox" checked={showSolar} onChange={e=>setShowSolar(e.target.checked)} />
          Solar System
        </label>
        <input aria-label="Date" title="Date" type="date" value={dateISO} onChange={e=>setDateISO(e.target.value)} style={{ background:'#0b0f14', color:'#e5e7eb', border:'1px solid #1f2937', borderRadius:6, padding:'6px 8px' }} />

        <label style={{ display:'flex', alignItems:'center', gap:6, background:'#0b0f14', color:'#e5e7eb', border:'1px solid #1f2937', borderRadius:6, padding:'6px 8px' }}>
          <input type="checkbox" checked={showStars} onChange={e=>setShowStars(e.target.checked)} />
          Stars
        </label>
        <label style={{ display:'flex', alignItems:'center', gap:6, background:'#0b0f14', color:'#e5e7eb', border:'1px solid #1f2937', borderRadius:6, padding:'6px 8px' }}>
          <input type="checkbox" checked={showDSO} onChange={e=>setShowDSO(e.target.checked)} />
          DSOs
        </label>
        <label style={{ display:'flex', alignItems:'center', gap:6, background:'#0b0f14', color:'#e5e7eb', border:'1px solid #1f2937', borderRadius:6, padding:'6px 8px' }}>
          <input type="checkbox" checked={showLines} onChange={e=>setShowLines(e.target.checked)} />
          Constellations
        </label>
        <select aria-label="Star rendering mode" title="Star rendering mode" value={starMode} onChange={e=>setStarMode(e.target.value as any)} style={{ background:'#0b0f14', color:'#e5e7eb', border:'1px solid #1f2937', borderRadius:6, padding:'6px 8px' }}>
          <option value="dome">Stars: Sky Dome</option>
          <option value="distance">Stars: True Distance (≤50 ly)</option>
        </select>
      </div>
      <div ref={ref} style={{ width:'100%', height:'100%' }} />
      {tooltip && (
        <div style={{ position:'absolute', left: tooltip.x, top: tooltip.y, background:'rgba(0,0,0,0.7)', color:'#e5e7eb', padding:'6px 8px', borderRadius:8, whiteSpace:'pre-wrap', maxWidth: 320, pointerEvents:'none', fontSize:12 }}>
          {tooltip.text}
        </div>
      )}
    </div>
  )
}


