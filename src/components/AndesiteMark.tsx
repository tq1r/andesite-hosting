'use client'

import { useMemo } from 'react'

// ── Andesite mark ────────────────────────────────────────────────────────────
// A chiseled blocky "A" carved into an 8×8 andesite block — salt-and-pepper
// stone grain with a molten ember seam running through the crossbar.

const STROKE = '#1c1b1e' // chiseled dark cut
const EMBER = '#e8763a' // ember seam
const EMBER_HOT = '#f28a4c' // hotter core of the seam
const LIGHT = '#8f8d87' // andesite light grain
const MID = '#7e7c76' // mid grain
const DARK = '#5c5a54' // dark speck

// 8×8 grid — background cells form the speckled andesite texture,
// STROKE cells form the "A", EMBER cells are its crossbar.
const GRID: string[] = [
  MID, LIGHT, DARK, LIGHT, MID, LIGHT, DARK, MID,
  LIGHT, DARK, STROKE, STROKE, STROKE, STROKE, DARK, LIGHT,
  DARK, STROKE, LIGHT, MID, LIGHT, MID, STROKE, LIGHT,
  MID, STROKE, LIGHT, LIGHT, MID, LIGHT, STROKE, LIGHT,
  LIGHT, STROKE, EMBER, EMBER_HOT, EMBER_HOT, EMBER, STROKE, DARK,
  MID, STROKE, LIGHT, MID, LIGHT, DARK, STROKE, MID,
  LIGHT, STROKE, MID, DARK, LIGHT, LIGHT, STROKE, DARK,
  MID, LIGHT, MID, LIGHT, DARK, LIGHT, MID, DARK,
]

export function AndesiteMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  const cells = useMemo(() => GRID, [])
  return (
    <div
      className={`grid ${className}`}
      style={{ width: size, height: size, gridTemplateColumns: 'repeat(8, 1fr)', gap: 0 }}
      role="img"
      aria-label="Andesite Hosting logo"
    >
      {cells.map((color, i) => (
        <div key={i} style={{ background: color }} />
      ))}
    </div>
  )
}
