'use client'

import { useMemo } from 'react'

// Deterministic Minecraft-style face from a username (8x8, no external images)

const SKINS = ['#f5c99b', '#e8b088', '#d29b6e', '#c4885b', '#a06a42', '#8a5a38']
const HAIRS = ['#3b2a1a', '#5a3d1e', '#2b2b2b', '#835c2b', '#a56b3a', '#c9a25b', '#6b3320']
const PUPILS = ['#3d5a9e', '#4a6fa5', '#5d4a7e', '#3e6b4f', '#4d4d4d', '#7e4a4a']
const MOUTHS = ['#8a5a38', '#6b3320', '#7a4a2e']

function hash(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildFace(name: string): string[] {
  const rand = mulberry32(hash(name))
  const skin = SKINS[Math.floor(rand() * SKINS.length)]
  const hair = HAIRS[Math.floor(rand() * HAIRS.length)]
  const pupil = PUPILS[Math.floor(rand() * PUPILS.length)]
  const mouth = MOUTHS[Math.floor(rand() * MOUTHS.length)]
  const nose = '#d19a6b'

  const g: string[][] = Array.from({ length: 8 }, () => Array(8).fill(skin))

  // hair: top 2 rows (+ random fringe on row 2)
  for (let c = 0; c < 8; c++) {
    g[0][c] = hair
    g[1][c] = hair
    if (rand() > 0.45) g[2][c] = hair
  }
  // eyes on row 4: white, pupil, pupil, white (cols 2-5)
  g[4][2] = '#ffffff'; g[4][3] = pupil
  g[4][5] = '#ffffff'; g[4][4] = pupil
  // brows hint row 3
  g[3][2] = hair; g[3][5] = hair
  // nose row 5
  g[5][3] = nose; g[5][4] = nose
  // mouth row 6
  g[6][3] = mouth; g[6][4] = mouth

  return g.flat()
}

export function PixelAvatar({ name, size = 28, className = '' }: { name: string; size?: number; className?: string }) {
  const cells = useMemo(() => buildFace(name), [name])
  return (
    <div
      className={`grid shrink-0 rounded-[3px] overflow-hidden ring-1 ring-white/10 ${className}`}
      style={{ width: size, height: size, gridTemplateColumns: 'repeat(8, 1fr)', gap: 0 }}
      title={name}
      role="img"
      aria-label={`${name} avatar`}
    >
      {cells.map((color, i) => (
        <div key={i} style={{ background: color }} />
      ))}
    </div>
  )
}
