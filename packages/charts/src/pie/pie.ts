export type PieCell = { readonly name: string; readonly value: number; readonly color: string }

export type PieLayout = {
  readonly cx: number
  readonly cy: number
  readonly innerRadius: number
  readonly outerRadius: number
  readonly startAngle: number
  readonly endAngle: number
  readonly paddingAngle: number
}

export type Sector = {
  readonly index: number
  readonly cell: PieCell
  readonly startAngle: number
  readonly endAngle: number
  readonly percent: number
  readonly middle: number
  readonly path: string
  readonly label: { readonly x: number; readonly y: number; readonly anchor: "start" | "end" }
  readonly line: string
}

const radian = Math.PI / 180

export const polar = (cx: number, cy: number, radius: number, angle: number) => ({
  x: cx + Math.cos(-radian * angle) * radius,
  y: cy + Math.sin(-radian * angle) * radius
})

const round = (value: number) => Math.round(value * 1000) / 1000

export const sectorPath = (layout: PieLayout, startAngle: number, endAngle: number): string => {
  const angle = endAngle - startAngle
  const end = startAngle + Math.sign(angle) * Math.min(Math.abs(angle), 359.999)
  const outerStart = polar(layout.cx, layout.cy, layout.outerRadius, startAngle)
  const outerEnd = polar(layout.cx, layout.cy, layout.outerRadius, end)
  const large = Number(Math.abs(angle) > 180)
  const outer = `M${round(outerStart.x)},${round(outerStart.y)}A${layout.outerRadius},${layout.outerRadius},0,${large},${Number(startAngle > end)},${round(outerEnd.x)},${round(outerEnd.y)}`
  if (layout.innerRadius <= 0) return `${outer}L${layout.cx},${layout.cy}Z`
  const innerStart = polar(layout.cx, layout.cy, layout.innerRadius, startAngle)
  const innerEnd = polar(layout.cx, layout.cy, layout.innerRadius, end)

  return `${outer}L${round(innerEnd.x)},${round(innerEnd.y)}A${layout.innerRadius},${layout.innerRadius},0,${large},${Number(startAngle <= end)},${round(innerStart.x)},${round(innerStart.y)}Z`
}

export const sectors = (cells: ReadonlyArray<PieCell>, layout: PieLayout, labelOffset = 20): ReadonlyArray<Sector> => {
  const delta = layout.endAngle - layout.startAngle
  const total = cells.reduce((sum, cell) => sum + cell.value, 0)
  const nonZero = cells.filter((cell) => cell.value !== 0).length
  const paddings = (Math.abs(delta) >= 360 ? nonZero : nonZero - 1) * layout.paddingAngle
  const available = Math.abs(delta) - paddings
  const direction = Math.sign(delta)

  return cells.reduce<ReadonlyArray<Sector>>((done, cell, index) => {
    const previous = done.at(-1)
    const startAngle = previous === undefined ? layout.startAngle : previous.endAngle + direction * layout.paddingAngle
    const percent = total === 0 ? 0 : cell.value / total
    const endAngle = startAngle + direction * percent * available
    const middle = (startAngle + endAngle) / 2
    const edge = polar(layout.cx, layout.cy, layout.outerRadius, middle)
    const point = polar(layout.cx, layout.cy, layout.outerRadius + labelOffset, middle)

    return [
      ...done,
      {
        index,
        cell,
        startAngle,
        endAngle,
        percent,
        middle,
        path: sectorPath(layout, startAngle, endAngle),
        label: { x: round(point.x), y: round(point.y), anchor: point.x > layout.cx ? "start" : "end" },
        line: `M${round(edge.x)},${round(edge.y)}L${round(point.x)},${round(point.y)}`
      }
    ]
  }, [])
}

export type LabelsType = "value" | "percent" | "name"

export const labelText = (
  sector: Sector,
  type: LabelsType,
  format: ((value: number) => string) | undefined
): string => {
  if (type === "name") return sector.cell.name
  if (type === "percent") return `${(sector.percent * 100).toFixed(0)}%`
  if (format !== undefined) return format(sector.cell.value)

  return String(sector.cell.value)
}
