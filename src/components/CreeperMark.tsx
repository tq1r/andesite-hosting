'use client'

import { useMemo } from 'react'

const GREENS = ['#4faa3d', '#3d8b2f', '#62c04a', '#2d6b22', '#57b544', '#3f9433']

// Classic creeper face on an 8x8 grid
const PATTERN = [
  '00000000',
  '00000000',
  '01100110',
  '01100110',
  '00111100',
  '00111100',
  '00100100',
  '00000000',
]

function hash(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function CreeperMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  const cells = useMemo(() => {
    const seed = hash('creeper')
    const out: string[] = []
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const dark = PATTERN[r][c] === '1'
        out.push(dark ? '#10140c' : GREENS[(seed >> ((r * 8 + c) % 24)) % GREENS.length])
      }
    }
    return out
  }, [])

  return (
    <div
      className={`grid ${className}`}
      style={{ width: size, height: size, gridTemplateColumns: 'repeat(8, 1fr)', gap: 0 }}
      role="img"
      aria-label="CraftHost creeper logo"
    >
      {cells.map((color, i) => (
        <div key={i} style={{ background: color }} />
      ))}
    </div>
  )
}
