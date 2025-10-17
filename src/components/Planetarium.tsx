'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
// Orbit controls for rotate/zoom
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

type Planet = { name: string; lon: number }

export function Planetarium({ planets, width=520, height=520, tiltDeg=25, showAspects=true, rotationSpeed=0, zoom=1.35, enableControls=true, signs=true, showLabels=true, asc, mc, houses }: { planets: Planet[]; width?: number; height?: number; tiltDeg?: number; showAspects?: boolean; rotationSpeed?: number; zoom?: number; enableControls?: boolean; signs?: boolean; showLabels?: boolean; asc?: number; mc?: number; houses?: number[] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: true })
    renderer.setPixelRatio(typeof window !== 'undefined' ? window.devicePixelRatio : 1)
    renderer.setSize(width, height)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, width/height, 0.1, 100)
    // Auto-fit camera distance to fit outer ring comfortably
    const rOut = 3.6
    const dist = (rOut * zoom) / Math.tan(THREE.MathUtils.degToRad(45/2))
    camera.position.set(0, 0.35, dist)
    camera.lookAt(0, 0, 0)

    const light = new THREE.DirectionalLight(0xffffff, 1)
    light.position.set(2, 3, 4)
    scene.add(light)

    const ambient = new THREE.AmbientLight(0x557799, 0.5)
    scene.add(ambient)

    // Ecliptic root so we can tilt plane for perspective
    const ecliptic = new THREE.Group()
    ecliptic.rotation.x = THREE.MathUtils.degToRad(tiltDeg)
    scene.add(ecliptic)

    // Solar disc
    const sunGeo = new THREE.SphereGeometry(0.35, 32, 32)
    const sunMat = new THREE.MeshStandardMaterial({ color: 0xffcc55, emissive: 0x332200, metalness: 0.2, roughness: 0.6 })
    const sun = new THREE.Mesh(sunGeo, sunMat)
    ecliptic.add(sun)

    const ringMat = new THREE.MeshBasicMaterial({ color: 0x27424d, wireframe: true, transparent: true, opacity: 0.35 })
    const planetMeshes: any[] = []
    const radii = [0.8, 1.0, 1.2, 1.45, 1.8, 2.2, 2.6, 3.0, 3.3, 3.6]
    planets.slice(0, 10).forEach((p, idx) => {
      // orbital ring
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radii[idx], 0.002, 8, 128), ringMat)
      ring.rotation.x = Math.PI/2
      ecliptic.add(ring)

      const geo = new THREE.SphereGeometry(0.06 + idx*0.01, 24, 24)
      const mat = new THREE.MeshStandardMaterial({ color: 0x88ccee - idx*0x050505 })
      const m = new THREE.Mesh(geo, mat)
      ecliptic.add(m)
      planetMeshes.push(m)
    })

    // Zodiac ticks to mirror 2D wheel (drawn on ecliptic plane)
    const ticks = new THREE.Group()
    for (let i=0;i<12;i++) {
      const ang = (i*30) * Math.PI/180
      const inner = 0.6, outer = 3.65
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(Math.cos(ang)*inner, 0, Math.sin(ang)*inner),
        new THREE.Vector3(Math.cos(ang)*outer, 0, Math.sin(ang)*outer),
      ])
      const ln = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x3a5563 }))
      ticks.add(ln)
    }
    ecliptic.add(ticks)

    // Optional house cusps and axes
    if (Array.isArray(houses) && houses.length === 12) {
      const houseGroup = new THREE.Group()
      for (let i=0;i<12;i++) {
        const a = houses[i] * Math.PI/180
        const g = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(Math.cos(a)*0.6, 0, Math.sin(a)*0.6),
          new THREE.Vector3(Math.cos(a)*3.65, 0, Math.sin(a)*3.65),
        ])
        houseGroup.add(new THREE.Line(g, new THREE.LineDashedMaterial({ color: 0x24424f, dashSize: 0.1, gapSize: 0.08 })))
      }
      ecliptic.add(houseGroup)
    }
    if (typeof asc === 'number') {
      const a = asc * Math.PI/180
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0,0,0), new THREE.Vector3(Math.cos(a)*3.7, 0, Math.sin(a)*3.7)
      ])
      const ln = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x22d3ee }))
      ecliptic.add(ln)
    }
    if (typeof mc === 'number') {
      const a = mc * Math.PI/180
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0,0,0), new THREE.Vector3(Math.cos(a)*3.7, 0, Math.sin(a)*3.7)
      ])
      const ln = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xa78bfa }))
      ecliptic.add(ln)
    }

    // canvas-based sprite text factory
    const makeText = (txt: string, opts?: { size?: number; color?: string; scale?: number }) => {
      const size = (opts?.size ?? 28) * 4
      const cvs = document.createElement('canvas')
      cvs.width = size; cvs.height = size
      const ctx = cvs.getContext('2d')!
      const pixel = size / 4
      ctx.clearRect(0,0,size,size)
      ctx.fillStyle = opts?.color ?? '#E5E7EB'
      ctx.font = `${pixel}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(txt, size/2, size/2)
      const tex = new THREE.CanvasTexture(cvs)
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true })
      const spr = new THREE.Sprite(mat)
      const s = opts?.scale ?? 0.35
      spr.scale.set(s, s, 1)
      return spr
    }

    // Zodiac sign sprites
    if (signs) {
      const glyphs = ['\u2648','\u2649','\u264A','\u264B','\u264C','\u264D','\u264E','\u264F','\u2650','\u2651','\u2652','\u2653']
      const group = new THREE.Group()
      for (let i=0;i<12;i++) {
        const a = (i*30) * Math.PI/180
        const spr = makeText(glyphs[i], { size: 28, color: '#C4B5FD', scale: 0.35 })
        spr.position.set(Math.cos(a)*4.05, 0, Math.sin(a)*4.05)
        group.add(spr)
      }
      ecliptic.add(group)
    }

    const aspectGroup = new THREE.Group()
    if (showAspects) ecliptic.add(aspectGroup)
    const defAngles = [
      { angle: 0, orb: 6, color: 0xff7aa2 },
      { angle: 60, orb: 4, color: 0x74c7ec },
      { angle: 90, orb: 6, color: 0x94a3b8 },
      { angle: 120, orb: 6, color: 0xa6e3a1 },
      { angle: 180, orb: 8, color: 0xf38ba8 },
    ]

    // Planet label sprites
    let planetLabels: any[] = []
    let labelGroupInitialized = false
    function initPlanetLabels() {
      if (labelGroupInitialized || !showLabels) return
      const group = new THREE.Group()
      const n = Math.min(planets.length, 10)
      for (let i=0;i<n;i++) {
        const spr = makeText(planets[i].name, { size: 18, color: '#E5E7EB', scale: 0.22 })
        group.add(spr)
        planetLabels.push(spr)
      }
      ecliptic.add(group)
      labelGroupInitialized = true
    }

    let t = 0
    const animate = () => {
      t += rotationSpeed
      planets.slice(0, 10).forEach((p, idx) => {
        const a = (p.lon + t*15) * Math.PI/180
        const r = radii[idx]
        const m = planetMeshes[idx] as any
        m.position.set(Math.cos(a)*r, 0, Math.sin(a)*r)
      })
      // planet labels that follow the bodies
      if (showLabels) {
        if (!labelGroupInitialized) initPlanetLabels()
        for (let i=0;i<Math.min(planetMeshes.length, planetLabels.length); i++) {
          const m = planetMeshes[i] as any
          const spr = planetLabels[i]
          spr.position.set(m.position.x, m.position.y + 0.12, m.position.z)
        }
      }
      if (showAspects) {
        while (aspectGroup.children.length) aspectGroup.remove(aspectGroup.children[0])
        const n = Math.min(planets.length, 10)
        for (let i=0;i<n;i++) {
          for (let j=i+1;j<n;j++) {
            const lon1 = planets[i].lon, lon2 = planets[j].lon
            const d = Math.abs((((lon2 - lon1) + 540) % 360) - 180)
            const match = defAngles.find(dfn => Math.abs(d - dfn.angle) <= dfn.orb)
            if (!match) continue
            const a1 = (lon1 + t*15) * Math.PI/180
            const a2 = (lon2 + t*15) * Math.PI/180
            const v1 = new THREE.Vector3(Math.cos(a1)*radii[i], 0, Math.sin(a1)*radii[i])
            const v2 = new THREE.Vector3(Math.cos(a2)*radii[j], 0, Math.sin(a2)*radii[j])
            const geo = new THREE.BufferGeometry().setFromPoints([v1, v2])
            const mat = new THREE.LineBasicMaterial({ color: match.color, transparent: true, opacity: 0.6 })
            aspectGroup.add(new THREE.Line(geo, mat))
          }
        }
      }
      renderer.render(scene, camera)
      raf = requestAnimationFrame(animate)
    }
    let raf = requestAnimationFrame(animate)

    // Optional user controls
    let controls: any = null
    if (enableControls) {
      controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.enablePan = false
      controls.minDistance = dist * 0.6
      controls.maxDistance = dist * 2.0
      controls.update()
    }

    // Resize handling to keep centered and in-frame
    let ro: any = null
    if (typeof window !== 'undefined') {
      const RO = (window as any).ResizeObserver
      if (RO) {
        ro = new RO(() => {
          const el = containerRef.current
          if (!el) return
          const w = Math.max(320, el.clientWidth)
          const h = Math.max(320, Math.min(el.clientHeight || w, w))
          renderer.setSize(w, h, false)
          camera.aspect = w / h
          camera.updateProjectionMatrix()
          controls?.update()
        })
      }
    }
    if (ro && containerRef.current) ro.observe(containerRef.current)

    return () => { cancelAnimationFrame(raf); renderer.dispose(); controls?.dispose?.(); ro?.disconnect() }
  }, [planets, width, height])

  return <div ref={containerRef} style={{ width: '100%', height: height }}><canvas ref={canvasRef} style={{ width: '100%', height: '100%', display:'block' }} /></div>
}


