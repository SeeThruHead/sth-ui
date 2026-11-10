export type Point = { readonly x: number; readonly y: number }

export const polarToCartesian = (cx: number, cy: number, r: number, angle: number): Point => {
  const rad = ((angle - 90) * Math.PI) / 180

  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

export const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number): string => {
  const delta = endAngle - startAngle
  const sweep = delta >= 0 ? 1 : 0
  const start = polarToCartesian(cx, cy, r, startAngle)
  if (Math.abs(delta) >= 360) {
    const mid = polarToCartesian(cx, cy, r, startAngle + (delta >= 0 ? 180 : -180))

    return `M ${start.x} ${start.y} A ${r} ${r} 0 0 ${sweep} ${mid.x} ${mid.y} A ${r} ${r} 0 0 ${sweep} ${start.x} ${start.y}`
  }
  const end = polarToCartesian(cx, cy, r, endAngle)

  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${Math.abs(delta) > 180 ? 1 : 0} ${sweep} ${end.x} ${end.y}`
}

export const valueToAngle = (value: number, min: number, max: number, startAngle: number, endAngle: number): number => {
  if (max === min) return startAngle
  const clamped = Math.max(min, Math.min(max, value))

  return startAngle + ((clamped - min) / (max - min)) * (endAngle - startAngle)
}

export const isAngleInArc = (angle: number, start: number, end: number): boolean => {
  const delta = end - start
  if (Math.abs(delta) >= 360) return true
  const distance = delta >= 0 ? angle - start : start - angle

  return ((distance % 360) + 360) % 360 <= Math.abs(delta)
}

export type Box = { readonly x: number; readonly y: number; readonly width: number; readonly height: number }

export const arcBoundingBox = (
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
  padding: number,
  labelReserve: number
): Box => {
  const cardinals = [
    { angle: 0, x: cx, y: cy - r },
    { angle: 90, x: cx + r, y: cy },
    { angle: 180, x: cx, y: cy + r },
    { angle: 270, x: cx - r, y: cy }
  ].filter((cardinal) => isAngleInArc(cardinal.angle, startAngle, endAngle))
  const points = [
    polarToCartesian(cx, cy, r, startAngle),
    polarToCartesian(cx, cy, r, endAngle),
    { x: cx - labelReserve, y: cy - labelReserve },
    { x: cx + labelReserve, y: cy + labelReserve },
    ...cardinals
  ]
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)

  return {
    x: minX - padding,
    y: minY - padding,
    width: Math.max(...xs) - minX + padding * 2,
    height: Math.max(...ys) - minY + padding * 2
  }
}

export type GaugeSection = { readonly value: number; readonly color: string }

export type PlacedSection = { readonly path: string; readonly color: string }

export const placeSections = (
  sections: ReadonlyArray<GaugeSection>,
  geometry: {
    readonly cx: number
    readonly cy: number
    readonly r: number
    readonly min: number
    readonly max: number
  },
  startAngle: number,
  endAngle: number
): ReadonlyArray<PlacedSection> => {
  const direction = endAngle >= startAngle ? 1 : -1

  return sections
    .toSorted((a, b) => a.value - b.value)
    .reduce<{ readonly previous: number; readonly placed: ReadonlyArray<PlacedSection> }>(
      (state, section) => {
        const angle = valueToAngle(section.value, geometry.min, geometry.max, startAngle, endAngle)
        if ((angle - state.previous) * direction <= 0) return state

        return {
          previous: angle,
          placed: [
            ...state.placed,
            { path: describeArc(geometry.cx, geometry.cy, geometry.r, state.previous, angle), color: section.color }
          ]
        }
      },
      { previous: startAngle, placed: [] }
    ).placed
}

export const capSections = (placed: ReadonlyArray<PlacedSection>): ReadonlyArray<PlacedSection> => {
  const first = placed[0]
  const last = placed.at(-1)
  if (first === undefined || last === undefined) return []
  if (placed.length === 1) return [first]

  return [first, last]
}
