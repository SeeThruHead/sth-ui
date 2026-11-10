import { Array as Arr, Order } from "effect"

export type SankeyChartNode = { readonly name: string; readonly color?: string }

export type SankeyChartLink = { readonly source: number; readonly target: number; readonly value: number }

export type SankeyChartData = {
  readonly nodes: ReadonlyArray<SankeyChartNode>
  readonly links: ReadonlyArray<SankeyChartLink>
}

export type SankeyNode = {
  readonly index: number
  readonly name: string
  readonly color: string | undefined
  readonly value: number
  readonly depth: number
  readonly share: number
  readonly y: number
  readonly dy: number
  readonly isLeaf: boolean
}

export type SankeyLink = SankeyChartLink & {
  readonly index: number
  readonly dy: number
  readonly sy: number
  readonly ty: number
}

export type SankeyLayout = {
  readonly nodes: ReadonlyArray<SankeyNode>
  readonly links: ReadonlyArray<SankeyLink>
  readonly maxDepth: number
}

export type SankeyOptions = { readonly height: number; readonly nodePadding: number; readonly iterations: number }

type Graph = {
  readonly incoming: ReadonlyArray<ReadonlyArray<number>>
  readonly outgoing: ReadonlyArray<ReadonlyArray<number>>
  readonly links: ReadonlyArray<SankeyChartLink>
}

type Positions = { readonly ys: ReadonlyArray<number>; readonly columns: ReadonlyArray<ReadonlyArray<number>> }

const sum = (values: ReadonlyArray<number>) => values.reduce((total, value) => total + value, 0)

const linkAt = (graph: Graph, index: number) => Arr.getUnsafe(graph.links, index)

const valueOf = (graph: Graph, ids: ReadonlyArray<number>) => sum(ids.map((id) => linkAt(graph, id).value))

const walk = (
  graph: Graph,
  depths: ReadonlyMap<number, number>,
  node: number,
  path: ReadonlySet<number>
): ReadonlyMap<number, number> => {
  const onPath = new Set([...path, node])

  return Arr.getUnsafe(graph.outgoing, node).reduce((current, id) => {
    const target = linkAt(graph, id).target
    if (onPath.has(target)) return current
    const depth = (current.get(node) ?? 0) + 1
    if (depth <= (current.get(target) ?? 0)) return current

    return walk(graph, new Map([...current, [target, depth]]), target, onPath)
  }, depths)
}

const replaced = (ys: ReadonlyArray<number>, updates: ReadonlyMap<number, number>) =>
  ys.map((y, id) => updates.get(id) ?? y)

const resolveColumn = (
  ids: ReadonlyArray<number>,
  ys: ReadonlyArray<number>,
  dys: ReadonlyArray<number>,
  options: SankeyOptions
) => {
  const sorted = Arr.sortWith(ids, (id) => Arr.getUnsafe(ys, id), Order.Number)
  const down = sorted.reduce<{ readonly floor: number; readonly placed: ReadonlyArray<readonly [number, number]> }>(
    (state, id) => {
      const y = Math.max(Arr.getUnsafe(ys, id), state.floor)

      return { floor: y + Arr.getUnsafe(dys, id) + options.nodePadding, placed: [...state.placed, [id, y]] }
    },
    { floor: 0, placed: [] }
  )
  const up = down.placed.reduceRight<{
    readonly ceiling: number
    readonly stopped: boolean
    readonly placed: ReadonlyMap<number, number>
  }>(
    (state, [id, y]) => {
      const over = y + Arr.getUnsafe(dys, id) + options.nodePadding - state.ceiling
      if (state.stopped || over <= 0) return { ...state, stopped: true, placed: new Map([...state.placed, [id, y]]) }

      return { ...state, ceiling: y - over, placed: new Map([...state.placed, [id, y - over]]) }
    },
    { ceiling: options.height + options.nodePadding, stopped: false, placed: new Map() }
  )

  return { sorted, ys: replaced(ys, up.placed) }
}

const resolveCollisions = (positions: Positions, dys: ReadonlyArray<number>, options: SankeyOptions): Positions =>
  positions.columns.reduce<Positions>((state, ids, column) => {
    const resolved = resolveColumn(ids, state.ys, dys, options)

    return { ys: resolved.ys, columns: state.columns.map((old, index) => (index === column ? resolved.sorted : old)) }
  }, positions)

const relaxColumn = (
  graph: Graph,
  ids: ReadonlyArray<number>,
  ys: ReadonlyArray<number>,
  dys: ReadonlyArray<number>,
  alpha: number,
  toward: "source" | "target"
) => {
  const center = (id: number) => Arr.getUnsafe(ys, id) + Arr.getUnsafe(dys, id) / 2
  const updates = ids.flatMap((id): ReadonlyArray<readonly [number, number]> => {
    const linked = Arr.getUnsafe(toward === "source" ? graph.incoming : graph.outgoing, id)
    if (linked.length === 0) return []
    const total = valueOf(graph, linked)
    const weighted = sum(
      linked.map((link) => {
        const other = toward === "source" ? linkAt(graph, link).source : linkAt(graph, link).target

        return center(other) * linkAt(graph, link).value
      })
    )
    const target = total === 0 ? center(id) : weighted / total

    return [[id, Arr.getUnsafe(ys, id) + (target - center(id)) * alpha]]
  })

  return replaced(ys, new Map(updates))
}

const relax = (
  graph: Graph,
  positions: Positions,
  dys: ReadonlyArray<number>,
  alpha: number,
  toward: "source" | "target"
): Positions => {
  const step = (ys: ReadonlyArray<number>, ids: ReadonlyArray<number>) =>
    relaxColumn(graph, ids, ys, dys, alpha, toward)
  const ys =
    toward === "target"
      ? positions.columns.reduceRight(step, positions.ys)
      : positions.columns.reduce(step, positions.ys)

  return { ...positions, ys }
}

const otherEnd = (graph: Graph, id: number, side: "outgoing" | "incoming") =>
  side === "outgoing" ? linkAt(graph, id).target : linkAt(graph, id).source

const offset = (
  graph: Graph,
  ys: ReadonlyArray<number>,
  dys: ReadonlyArray<number>,
  link: number,
  side: "outgoing" | "incoming"
): number => {
  const owner = side === "outgoing" ? linkAt(graph, link).source : linkAt(graph, link).target
  const sorted = Arr.sortWith(
    Arr.getUnsafe(graph[side], owner),
    (id) => Arr.getUnsafe(ys, otherEnd(graph, id, side)),
    Order.Number
  )

  return sum(sorted.slice(0, sorted.indexOf(link)).map((before) => Arr.getUnsafe(dys, before)))
}

const linksWhere = (links: ReadonlyArray<SankeyChartLink>, test: (link: SankeyChartLink) => boolean) =>
  links.flatMap((link, id) => (test(link) ? [id] : []))

export const sankeyLayout = (data: SankeyChartData, options: SankeyOptions): SankeyLayout => {
  const graph: Graph = {
    links: data.links,
    incoming: data.nodes.map((_node, index) => linksWhere(data.links, (link) => link.target === index)),
    outgoing: data.nodes.map((_node, index) => linksWhere(data.links, (link) => link.source === index))
  }
  const incoming = (index: number) => Arr.getUnsafe(graph.incoming, index)
  const outgoing = (index: number) => Arr.getUnsafe(graph.outgoing, index)
  const values = data.nodes.map((_node, index) =>
    Math.max(valueOf(graph, incoming(index)), valueOf(graph, outgoing(index)))
  )
  const walked = data.nodes.reduce<ReadonlyMap<number, number>>(
    (depths, _node, index) => (incoming(index).length === 0 ? walk(graph, depths, index, new Set()) : depths),
    new Map()
  )
  const longest = data.nodes.map((_node, index) => walked.get(index) ?? 0)
  const maxDepth = Math.max(0, ...longest)
  const depths = longest.map((depth, index) => (maxDepth >= 1 && outgoing(index).length === 0 ? maxDepth : depth))
  const columns = Array.from({ length: maxDepth + 1 }, (_slot, depth) =>
    depths.flatMap((nodeDepth, index) => (nodeDepth === depth ? [index] : []))
  ).filter((ids) => ids.length > 0)
  const smallest = Math.min(
    ...columns.map((ids) => {
      const total = sum(ids.map((id) => Arr.getUnsafe(values, id)))

      return total === 0 ? Number.POSITIVE_INFINITY : (options.height - (ids.length - 1) * options.nodePadding) / total
    })
  )
  const ratio = smallest === Number.POSITIVE_INFINITY ? 0 : smallest
  const dys = values.map((value) => value * ratio)
  const start = resolveCollisions(
    { ys: depths.map((depth, index) => depths.slice(0, index).filter((other) => other === depth).length), columns },
    dys,
    options
  )
  const relaxed = Array.from({ length: options.iterations }, (_slot, index) => 0.99 ** (index + 1)).reduce(
    (positions, alpha) =>
      resolveCollisions(
        relax(
          graph,
          resolveCollisions(relax(graph, positions, dys, alpha, "target"), dys, options),
          dys,
          alpha,
          "source"
        ),
        dys,
        options
      ),
    start
  )
  const linkDys = data.links.map((link) => link.value * ratio)

  return {
    maxDepth,
    nodes: data.nodes.map((node, index) => ({
      index,
      name: node.name,
      color: node.color,
      value: Arr.getUnsafe(values, index),
      depth: Arr.getUnsafe(depths, index),
      share: maxDepth === 0 ? 0 : Arr.getUnsafe(depths, index) / maxDepth,
      y: Arr.getUnsafe(relaxed.ys, index),
      dy: Arr.getUnsafe(dys, index),
      isLeaf: outgoing(index).length === 0
    })),
    links: data.links.map((link, index) => ({
      ...link,
      index,
      dy: Arr.getUnsafe(linkDys, index),
      sy: offset(graph, relaxed.ys, linkDys, index, "outgoing"),
      ty: offset(graph, relaxed.ys, linkDys, index, "incoming")
    }))
  }
}
