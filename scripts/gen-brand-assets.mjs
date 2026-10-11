// Generates src/app/icon.svg (favicon) and public/logo.svg from the same
// 8×8 andesite grid used by src/components/AndesiteMark.tsx.
import { writeFileSync } from 'node:fs'

const STROKE = '#1c1b1e'
const EMBER = '#e8763a'
const EMBER_HOT = '#f28a4c'
const LIGHT = '#8f8d87'
const MID = '#7e7c76'
const DARK = '#5c5a54'

const GRID = [
  MID, LIGHT, DARK, LIGHT, MID, LIGHT, DARK, MID,
  LIGHT, DARK, STROKE, STROKE, STROKE, STROKE, DARK, LIGHT,
  DARK, STROKE, LIGHT, MID, LIGHT, MID, STROKE, LIGHT,
  MID, STROKE, LIGHT, LIGHT, MID, LIGHT, STROKE, LIGHT,
  LIGHT, STROKE, EMBER, EMBER_HOT, EMBER_HOT, EMBER, STROKE, DARK,
  MID, STROKE, LIGHT, MID, LIGHT, DARK, STROKE, MID,
  LIGHT, STROKE, MID, DARK, LIGHT, LIGHT, STROKE, DARK,
  MID, LIGHT, MID, LIGHT, DARK, LIGHT, MID, DARK,
]

function cells(size, cell, rx = 0) {
  return GRID.map((color, i) => {
    const x = (i % 8) * cell
    const y = Math.floor(i / 8) * cell
    return `  <rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${color}"${rx ? ` rx="${rx}"` : ''}/>`
  }).join('\n')
}

// Favicon — full-bleed 64×64 block
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
<rect width="64" height="64" fill="${MID}"/>
${cells(64, 8)}
</svg>
`

// Public logo — 64×64 block with a 2px ember underline, padded on transparent bg
const logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
${cells(64, 8, 1)}
</svg>
`

writeFileSync('src/app/icon.svg', icon)
writeFileSync('public/logo.svg', logo)
console.log('wrote src/app/icon.svg + public/logo.svg')
