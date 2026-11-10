export type SunburstChartData = {
  readonly name: string
  readonly value?: number
  readonly color?: string
  readonly children?: ReadonlyArray<SunburstChartData>
}

export type SunburstArc = {
  readonly name: string
  readonly value: number
  readonly depth: number
  readonly color: string | undefined
  readonly startAngle: number
  readonly endAngle: number
  readonly innerRadius: number
  readonly outerRadius: number
}

export type SunburstLayout = {
  readonly radius: number
  readonly innerRadius: number
  readonly startAngle: number
  readonly endAngle: number
}

const leafTotal = (node: SunburstChartData): number =>
  node.children === undefined ? (node.value ?? 0) : node.children.reduce((sum, child) => sum + leafTotal(child), 0)

export const arcValue = (node: SunburstChartData): number => node.value ?? leafTotal(node)

export const treeDepth = (nodes: ReadonlyArray<SunburstChartData>): number =>
  nodes.length === 0 ? 1 : 1 + Math.max(...nodes.map((node) => treeDepth(node.children ?? [])))

type Ring = {
  readonly scale: number
  readonly thickness: number
  readonly innerRadius: number
  readonly startAngle: number
  readonly depth: number
  readonly color: string | undefined
}

const ringArcs = (nodes: ReadonlyArray<SunburstChartData>, ring: Ring): ReadonlyArray<SunburstArc> =>
  nodes.reduce<{ readonly angle: number; readonly arcs: ReadonlyArray<SunburstArc> }>(
    (done, node) => {
      const value = arcValue(node)
      const color = node.color ?? ring.color
      const endAngle = done.angle + value * ring.scale
      const arc: SunburstArc = {
        name: node.name,
        value,
        depth: ring.depth,
        color,
        startAngle: done.angle,
        endAngle,
        innerRadius: ring.innerRadius,
        outerRadius: ring.innerRadius + ring.thickness
      }
      const children = ringArcs(node.children ?? [], {
        ...ring,
        innerRadius: ring.innerRadius + ring.thickness,
        startAngle: done.angle,
        depth: ring.depth + 1,
        color
      })

      return { angle: endAngle, arcs: [...done.arcs, arc, ...children] }
    },
    { angle: ring.startAngle, arcs: [] }
  ).arcs

export const sunburstArcs = (
  data: ReadonlyArray<SunburstChartData>,
  layout: SunburstLayout
): ReadonlyArray<SunburstArc> => {
  const total = data.reduce((sum, node) => sum + leafTotal(node), 0)

  return ringArcs(data, {
    scale: total === 0 ? 0 : (layout.endAngle - layout.startAngle) / total,
    thickness: (layout.radius - layout.innerRadius) / treeDepth(data),
    innerRadius: layout.innerRadius,
    startAngle: layout.startAngle,
    depth: 1,
    color: undefined
  })
}
