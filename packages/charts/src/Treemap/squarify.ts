import { Array as Arr } from "effect"

export type TreemapData = {
  readonly name: string
  readonly value?: number
  readonly color?: string
  readonly children?: ReadonlyArray<TreemapData>
}

export type Rect = { readonly x: number; readonly y: number; readonly width: number; readonly height: number }

export type TreemapNode = Rect & {
  readonly name: string
  readonly value: number
  readonly depth: number
  readonly index: number
  readonly color: string | undefined
}

type Sized = {
  readonly data: TreemapData
  readonly value: number
  readonly area: number
  readonly color: string | undefined
}

export const valueOf = (node: TreemapData): number =>
  node.children !== undefined && node.children.length > 0
    ? node.children.reduce((sum, child) => sum + valueOf(child), 0)
    : Math.max(0, node.value ?? 0)

const worst = (row: ReadonlyArray<Sized>, size: number, ratio: number): number => {
  const area = row.reduce((sum, item) => sum + item.area, 0)
  if (area === 0) return Number.POSITIVE_INFINITY
  const areas = row.map((item) => item.area)
  const squared = area * area
  const parent = size * size

  return Math.max((parent * Math.max(...areas) * ratio) / squared, squared / (parent * Math.min(...areas) * ratio))
}

type Placed = { readonly item: Sized; readonly rect: Rect }

const place = (row: ReadonlyArray<Sized>, size: number, rect: Rect, flush: boolean) => {
  const area = row.reduce((sum, item) => sum + item.area, 0)
  const horizontal = size === rect.width
  const across = horizontal ? rect.height : rect.width
  const raw = size === 0 ? 0 : Math.round(area / size)
  const thickness = flush || raw > across ? across : raw
  const start = horizontal ? rect.x : rect.y
  const span = horizontal ? rect.width : rect.height
  const lengths = row.reduce<ReadonlyArray<number>>((done, item) => {
    const used = done.reduce((sum, length) => sum + length, 0)

    return [...done, Math.min(thickness === 0 ? 0 : Math.round(item.area / thickness), span - used)]
  }, [])
  const used = lengths.reduce((sum, length) => sum + length, 0)
  const fitted = lengths.map((length, index) => (index === lengths.length - 1 ? length + span - used : length))
  const placed = Arr.zip(row, fitted).map(([item, length], index): Placed => {
    const offset = start + fitted.slice(0, index).reduce((sum, value) => sum + value, 0)

    return {
      item,
      rect: horizontal
        ? { x: offset, y: rect.y, width: length, height: thickness }
        : { x: rect.x, y: offset, width: thickness, height: length }
    }
  })
  const rest: Rect = horizontal
    ? { ...rect, y: rect.y + thickness, height: rect.height - thickness }
    : { ...rect, x: rect.x + thickness, width: rect.width - thickness }

  return { placed, rest }
}

type State = {
  readonly rect: Rect
  readonly row: ReadonlyArray<Sized>
  readonly best: number
  readonly placed: ReadonlyArray<Placed>
}

const step = (state: State, item: Sized, ratio: number): State => {
  const size = Math.min(state.rect.width, state.rect.height)
  const row = [...state.row, item]
  const score = worst(row, size, ratio)
  if (score <= state.best) return { ...state, row, best: score }
  const { placed, rest } = place(state.row, size, state.rect, false)

  return step(
    { rect: rest, row: [], best: Number.POSITIVE_INFINITY, placed: [...state.placed, ...placed] },
    item,
    ratio
  )
}

const layoutChildren = (children: ReadonlyArray<Sized>, rect: Rect, ratio: number): ReadonlyArray<Placed> => {
  const state = children.reduce<State>((current, item) => step(current, item, ratio), {
    rect,
    row: [],
    best: Number.POSITIVE_INFINITY,
    placed: []
  })
  if (state.row.length === 0) return state.placed

  return [...state.placed, ...place(state.row, Math.min(state.rect.width, state.rect.height), state.rect, true).placed]
}

const nodesOf = (
  children: ReadonlyArray<TreemapData>,
  rect: Rect,
  value: number,
  ratio: number,
  depth: number,
  parentColor: string | undefined
): ReadonlyArray<TreemapNode> => {
  const scale = value === 0 ? 0 : (rect.width * rect.height) / value
  const sized = children.map((data): Sized => {
    const childValue = valueOf(data)

    return { data, value: childValue, area: childValue * scale, color: data.color ?? parentColor }
  })

  return layoutChildren(sized, rect, ratio).flatMap(({ item, rect: box }, index) => [
    { ...box, name: item.data.name, value: item.value, depth, index, color: item.color },
    ...nodesOf(item.data.children ?? [], box, item.value, ratio, depth + 1, item.color)
  ])
}

export const golden = 0.5 * (1 + Math.sqrt(5))

export const treemapNodes = (
  data: ReadonlyArray<TreemapData>,
  width: number,
  height: number,
  ratio = golden
): ReadonlyArray<TreemapNode> =>
  nodesOf(
    data,
    { x: 0, y: 0, width, height },
    data.reduce((sum, item) => sum + valueOf(item), 0),
    ratio,
    1,
    undefined
  )
