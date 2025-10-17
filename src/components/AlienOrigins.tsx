'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import origins from '@/data/alien-origins.json'
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

    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const dir = new THREE.DirectionalLight(0xffffff, 0.8)
    dir.position.set(2,3,4); scene.add(dir)

    const group = new THREE.Group()
    scene.add(group)

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
    const stars = new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0x334155, size: 0.6, sizeAttenuation: true }))
    scene.add(stars)

    // Sun reference at origin
    const sun = new THREE.Mesh(new THREE.SphereGeometry(0.18, 32, 32), new THREE.MeshStandardMaterial({ color: 0xffcc55 }))
    group.add(sun)

    // Simple solar-system scale markers (circles)
    const radii = [0.5, 0.9, 1.2, 1.5, 2.2] // inner to outer markers
    const ringMat = new THREE.LineBasicMaterial({ color: 0x1f2937, transparent: true, opacity: 0.5 })
    for (const r of radii) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(r-0.002, r+0.002, 64), new THREE.MeshBasicMaterial({ color: 0x1f2937, side: THREE.DoubleSide, transparent: true, opacity: 0.35 }))
      ring.rotation.x = Math.PI/2
      group.add(ring)
    }

    const geometry = new THREE.SphereGeometry(0.06, 16, 16)
    const picker: Array<{ mesh: any; label: string; info: string; slug?: string }> = []

    const positionsAll: any[] = []
    for (const o of origins as any[]) {
      const scaleR = compareScale ? (Math.log(1 + Math.max(0, o.distance_ly)) * 0.8) : (o.distance_ly * 0.02)
      const pos = raDecToVec(o.ra_deg, o.dec_deg, scaleR, 1)
      positionsAll.push(pos)
      const mat = new THREE.MeshStandardMaterial({ color: 0x9ccfd8, emissive: 0x0a1014 })
      const m = new THREE.Mesh(geometry, mat)
      m.position.copy(pos)
      group.add(m)
      const info = `${o.name}\n${o.home} — ${o.distance_ly} ly\nConstellation: ${o.constellation || '—'}\nSources: ${(o.sources||[]).join('; ')}\nConfidence: ${o.confidence}`
      picker.push({ mesh: m, label: o.name, info, slug: (o as any).slug || o.id } as any)

      // label sprite
      const cvs = document.createElement('canvas'); cvs.width=256; cvs.height=128
      const ctx = cvs.getContext('2d')!; ctx.fillStyle = '#e5e7eb'; ctx.font='28px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle'
      ctx.fillText(o.name, 128, 64)
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cvs), transparent: true }))
      spr.scale.set(0.8, 0.4, 1)
      spr.position.copy(pos.clone().add(new THREE.Vector3(0, 0.2, 0)))
      group.add(spr)
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

    // orbit controls for rotate/zoom
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.enablePan = true
    controls.minDistance = 0.5
    controls.maxDistance = 500

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
  }, [width, height, compareScale, showSolar, dateISO])

  return (
    <div style={{ position:'relative', width:'100%', height }}>
      <div style={{ position:'absolute', right: 8, top: 8, zIndex: 2, display:'flex', gap:8 }}>
        <select value={compareScale ? 'compare':'ly'} onChange={e=>setCompareScale(e.target.value === 'compare')} style={{ background:'#0b0f14', color:'#e5e7eb', border:'1px solid #1f2937', borderRadius:6, padding:'6px 8px' }}>
          <option value="compare">Scale: Compare</option>
          <option value="ly">Scale: Interstellar (ly)</option>
        </select>
        <label style={{ display:'flex', alignItems:'center', gap:6, background:'#0b0f14', color:'#e5e7eb', border:'1px solid #1f2937', borderRadius:6, padding:'6px 8px' }}>
          <input type="checkbox" checked={showSolar} onChange={e=>setShowSolar(e.target.checked)} />
          Solar System
        </label>
        <input type="date" value={dateISO} onChange={e=>setDateISO(e.target.value)} style={{ background:'#0b0f14', color:'#e5e7eb', border:'1px solid #1f2937', borderRadius:6, padding:'6px 8px' }} />
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


