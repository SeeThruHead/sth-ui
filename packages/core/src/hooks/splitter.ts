import { Array as Arr, Option, Predicate, Schema } from "effect"

export const PaneSize = Schema.Union([
  Schema.Finite,
  Schema.TemplateLiteral([Schema.Finite, "%"]),
  Schema.TemplateLiteral([Schema.Finite, "px"]),
  Schema.TemplateLiteral([Schema.Finite, "rem"])
])
export type PaneSize = typeof PaneSize.Type

export const Panel = Schema.Struct({
  defaultSize: PaneSize,
  min: Schema.optionalKey(PaneSize),
  max: Schema.optionalKey(PaneSize),
  collapsible: Schema.optionalKey(Schema.Boolean),
  collapseThreshold: Schema.optionalKey(PaneSize)
})
export type Panel = typeof Panel.Type

export type ResolvedPanel = {
  readonly defaultSize: number
  readonly min: number
  readonly max: number
  readonly collapsible: boolean
  readonly collapseThreshold: number
}

export type RedistributeInput = {
  readonly sizes: ReadonlyArray<number>
  readonly panels: ReadonlyArray<ResolvedPanel>
  readonly handleIndex: number
  readonly delta: number
}

export type RedistributeFn = (input: RedistributeInput) => ReadonlyArray<number>

export type Redistribute = "nearest" | "equal" | RedistributeFn

export type Frame = { readonly pixel: boolean; readonly container: number; readonly rootFont: number }

export type CollapseChange = { readonly panel: number; readonly collapsed: boolean }

export type Change = {
  readonly sizes: ReadonlyArray<PaneSize>
  readonly preCollapse: ReadonlyArray<PaneSize>
  readonly collapses: ReadonlyArray<CollapseChange>
}

type Unit = "number" | "%" | "px" | "rem"

const unitOf = (size: PaneSize): Unit => {
  if (Predicate.isNumber(size)) return "number"
  if (size.endsWith("px")) return "px"
  if (size.endsWith("rem")) return "rem"

  return "%"
}

export const magnitude = (size: PaneSize): number => (Predicate.isNumber(size) ? size : Number.parseFloat(size))

export const isFixed = (size: PaneSize | undefined): boolean => {
  if (size === undefined) return false
  const unit = unitOf(size)

  return unit === "px" || unit === "rem"
}

export const isPixelMode = (
  panels: ReadonlyArray<Panel>,
  sizes: ReadonlyArray<PaneSize>,
  steps: ReadonlyArray<PaneSize>
): boolean =>
  [
    ...panels.flatMap((panel) => [panel.defaultSize, panel.min, panel.max, panel.collapseThreshold]),
    ...steps,
    ...sizes
  ].some(isFixed)

export const resolve = (size: PaneSize, frame: Frame): number => {
  if (!frame.pixel) return magnitude(size)
  const unit = unitOf(size)
  if (unit === "px") return magnitude(size)
  if (unit === "rem") return magnitude(size) * frame.rootFont

  return (magnitude(size) / 100) * frame.container
}

const sum = (values: ReadonlyArray<number>): number => values.reduce((total, value) => total + value, 0)

const at = (values: ReadonlyArray<number>, index: number): number => Arr.getUnsafe(values, index)

const setAt = (values: ReadonlyArray<number>, index: number, value: number): ReadonlyArray<number> =>
  values.map((current, position) => (position === index ? value : current))

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max)

const fixedTotal = (sizes: ReadonlyArray<PaneSize>, frame: Frame): number =>
  sum(sizes.filter(isFixed).map((size) => resolve(size, frame)))

const fixedScale = (sizes: ReadonlyArray<PaneSize>, frame: Frame): number => {
  const total = fixedTotal(sizes, frame)

  return total > frame.container ? frame.container / total : 1
}

const share = (size: PaneSize, weight: number, leftover: number): number =>
  weight > 0 ? (magnitude(size) / weight) * leftover : 0

export const working = (sizes: ReadonlyArray<PaneSize>, frame: Frame): ReadonlyArray<number> => {
  if (!frame.pixel) return sizes.map(magnitude)
  const weight = sum(sizes.filter((size) => !isFixed(size)).map(magnitude))
  const leftover = Math.max(0, frame.container - fixedTotal(sizes, frame))
  const scale = fixedScale(sizes, frame)

  return sizes.map((size) => (isFixed(size) ? resolve(size, frame) * scale : share(size, weight, leftover)))
}

export const encode = (value: number, original: PaneSize, frame: Frame, scale = 1): PaneSize => {
  const unit = unitOf(original)
  if (!frame.pixel) return unit === "%" ? `${value}%` : value
  if (unit === "number") return (value / frame.container) * 100
  if (unit === "%") return `${(value / frame.container) * 100}%`
  if (unit === "rem") return `${value / scale / frame.rootFont}rem`

  return `${value / scale}px`
}

export const encodeWorking = (
  next: ReadonlyArray<number>,
  base: ReadonlyArray<number>,
  raw: ReadonlyArray<PaneSize>,
  frame: Frame
): ReadonlyArray<PaneSize> => {
  const scale = fixedScale(raw, frame)
  const fixedSum = sum(next.filter((_, index) => isFixed(raw[index])))
  const cleared = scale < 1 && fixedSum < frame.container - 1e-6
  const encodeScale = cleared ? 1 : scale

  return raw.map((original, index) => {
    const value = at(next, index)
    const moved = Math.abs(value - at(base, index)) > 1e-6

    return cleared || moved ? encode(value, original, frame, encodeScale) : original
  })
}

const resolveOptional = (size: PaneSize | undefined, frame: Frame, fallback: number): number =>
  size === undefined ? fallback : resolve(size, frame)

export const resolvePanel = (panel: Panel, frame: Frame): ResolvedPanel => {
  const min = resolveOptional(panel.min, frame, 0)

  return {
    defaultSize: resolve(panel.defaultSize, frame),
    min,
    max: resolveOptional(panel.max, frame, frame.pixel ? frame.container : 100),
    collapsible: panel.collapsible === true,
    collapseThreshold: resolveOptional(panel.collapseThreshold, frame, min)
  }
}

const panelAt = (panels: ReadonlyArray<ResolvedPanel>, index: number): ResolvedPanel => Arr.getUnsafe(panels, index)

const collapses = (panel: ResolvedPanel, next: number, current: number): boolean => {
  if (!panel.collapsible) return false
  if (next >= panel.collapseThreshold) return false

  return next < current
}

const moveAll = (sizes: ReadonlyArray<number>, from: number, into: number): ReadonlyArray<number> =>
  setAt(setAt(sizes, into, at(sizes, into) + at(sizes, from)), from, 0)

const checkCollapse = (
  sizes: ReadonlyArray<number>,
  panels: ReadonlyArray<ResolvedPanel>,
  handle: number,
  delta: number
): Option.Option<ReadonlyArray<number>> => {
  const after = handle + 1
  if (collapses(panelAt(panels, handle), at(sizes, handle) + delta, at(sizes, handle)))
    return Option.some(moveAll(sizes, handle, after))
  if (collapses(panelAt(panels, after), at(sizes, after) - delta, at(sizes, after)))
    return Option.some(moveAll(sizes, after, handle))

  return Option.none()
}

export const adjacentOnly = (
  sizes: ReadonlyArray<number>,
  panels: ReadonlyArray<ResolvedPanel>,
  handle: number,
  delta: number
): ReadonlyArray<number> => {
  const after = handle + 1
  const total = at(sizes, handle) + at(sizes, after)
  const before = panelAt(panels, handle)
  const next = panelAt(panels, after)
  const largest = Math.min(before.max, total - next.min)
  const smallest = Math.max(before.min, total - next.max)
  const size = clamp(at(sizes, handle) + delta, smallest, largest)

  return setAt(setAt(sizes, handle, size), after, total - size)
}

type Growth = { readonly grow: number; readonly donors: ReadonlyArray<number>; readonly wanted: number }

const growth = (
  sizes: ReadonlyArray<number>,
  panels: ReadonlyArray<ResolvedPanel>,
  handle: number,
  delta: number
): Growth => {
  const grow = delta > 0 ? handle : handle + 1
  const donors = delta > 0 ? Arr.range(handle + 1, sizes.length - 1) : Arr.range(0, handle).toReversed()

  return { grow, donors, wanted: Math.min(Math.abs(delta), panelAt(panels, grow).max - at(sizes, grow)) }
}

type Taken = { readonly sizes: ReadonlyArray<number>; readonly taken: number }

const takeInTurn = (sizes: ReadonlyArray<number>, panels: ReadonlyArray<ResolvedPanel>, plan: Growth): Taken =>
  plan.donors.reduce<Taken>(
    (state, index) => {
      if (state.taken >= plan.wanted) return state
      const take = Math.min(at(state.sizes, index) - panelAt(panels, index).min, plan.wanted - state.taken)

      return { sizes: setAt(state.sizes, index, at(state.sizes, index) - take), taken: state.taken + take }
    },
    { sizes, taken: 0 }
  )

export const redistributeNearest = (
  sizes: ReadonlyArray<number>,
  panels: ReadonlyArray<ResolvedPanel>,
  handle: number,
  delta: number
): ReadonlyArray<number> => {
  if (delta === 0) return sizes
  const plan = growth(sizes, panels, handle, delta)
  const result = takeInTurn(sizes, panels, plan)

  return setAt(result.sizes, plan.grow, at(result.sizes, plan.grow) + result.taken)
}

type Round = { readonly sizes: ReadonlyArray<number>; readonly remaining: number; readonly left: ReadonlyArray<number> }

const shareEqually = (
  sizes: ReadonlyArray<number>,
  panels: ReadonlyArray<ResolvedPanel>,
  donors: ReadonlyArray<number>,
  remaining: number
): Round => {
  if (remaining <= 0.001) return { sizes, remaining, left: donors }
  if (donors.length === 0) return { sizes, remaining, left: donors }
  const each = remaining / donors.length
  const round = donors.reduce<Round>(
    (state, index) => {
      const canGive = at(state.sizes, index) - panelAt(panels, index).min
      const take = Math.min(canGive, each)

      return {
        sizes: setAt(state.sizes, index, at(state.sizes, index) - take),
        remaining: state.remaining - take,
        left: canGive <= each + 0.001 ? state.left : [...state.left, index]
      }
    },
    { sizes, remaining, left: [] }
  )
  if (round.left.length === donors.length) return round

  return shareEqually(round.sizes, panels, round.left, round.remaining)
}

export const redistributeEqual = (
  sizes: ReadonlyArray<number>,
  panels: ReadonlyArray<ResolvedPanel>,
  handle: number,
  delta: number
): ReadonlyArray<number> => {
  if (delta === 0) return sizes
  const plan = growth(sizes, panels, handle, delta)
  const donors = plan.donors.filter((index) => at(sizes, index) > panelAt(panels, index).min)
  const result = shareEqually(sizes, panels, donors, Math.max(plan.wanted, 0))

  return setAt(result.sizes, plan.grow, at(result.sizes, plan.grow) + Math.max(plan.wanted, 0) - result.remaining)
}

const collapseAfterSharing = (
  before: ReadonlyArray<number>,
  result: ReadonlyArray<number>,
  panels: ReadonlyArray<ResolvedPanel>,
  handle: number
): ReadonlyArray<number> => {
  const after = handle + 1
  if (collapses(panelAt(panels, handle), at(result, handle), at(before, handle))) return moveAll(result, handle, after)
  if (collapses(panelAt(panels, after), at(result, after), at(before, after))) return moveAll(result, after, handle)

  return result
}

export const applyConstraints = (
  sizes: ReadonlyArray<number>,
  panels: ReadonlyArray<ResolvedPanel>,
  handle: number,
  delta: number,
  redistribute: Redistribute | undefined
): ReadonlyArray<number> => {
  if (Predicate.isFunction(redistribute)) return redistribute({ sizes, panels, handleIndex: handle, delta })
  if (redistribute === "nearest")
    return collapseAfterSharing(sizes, redistributeNearest(sizes, panels, handle, delta), panels, handle)
  if (redistribute === "equal")
    return collapseAfterSharing(sizes, redistributeEqual(sizes, panels, handle, delta), panels, handle)

  return Option.getOrElse(checkCollapse(sizes, panels, handle, delta), () => adjacentOnly(sizes, panels, handle, delta))
}

export const collapseChanges = (
  previous: ReadonlyArray<PaneSize>,
  next: ReadonlyArray<number>,
  indices: ReadonlyArray<number>
): ReadonlyArray<CollapseChange> =>
  indices.flatMap((panel): ReadonlyArray<CollapseChange> => {
    const was = magnitude(Arr.getUnsafe(previous, panel)) === 0
    const now = at(next, panel) === 0
    if (was === now) return []

    return [{ panel, collapsed: now }]
  })

export type Splitting = {
  readonly panels: ReadonlyArray<Panel>
  readonly sizes: ReadonlyArray<PaneSize>
  readonly preCollapse: ReadonlyArray<PaneSize>
  readonly redistribute?: Redistribute | undefined
}

export const resizeFrom = (
  splitting: Splitting,
  start: { readonly working: ReadonlyArray<number>; readonly raw: ReadonlyArray<PaneSize> },
  frame: Frame,
  handle: number,
  delta: number
): Change => {
  const panels = splitting.panels.map((panel) => resolvePanel(panel, frame))
  const next = applyConstraints(start.working, panels, handle, delta, splitting.redistribute)
  const collapsesNow = collapseChanges(splitting.sizes, next, [handle, handle + 1])

  return {
    sizes: encodeWorking(next, start.working, start.raw, frame),
    preCollapse: collapsesNow.some((change) => change.collapsed) ? start.raw : splitting.preCollapse,
    collapses: collapsesNow
  }
}

const unchanged = (splitting: Splitting): Change => ({
  sizes: splitting.sizes,
  preCollapse: splitting.preCollapse,
  collapses: []
})

const neighbourOf = (panel: number): number => (panel === 0 ? 1 : panel - 1)

const encodeAll = (
  values: ReadonlyArray<number>,
  raw: ReadonlyArray<PaneSize>,
  frame: Frame
): ReadonlyArray<PaneSize> => raw.map((original, index) => encode(at(values, index), original, frame))

const isCollapsed = (splitting: Splitting, panel: number): boolean =>
  magnitude(Arr.getUnsafe(splitting.sizes, panel)) === 0

const canCollapse = (splitting: Splitting, panel: number): boolean =>
  Arr.getUnsafe(splitting.panels, panel).collapsible === true

export const collapse = (splitting: Splitting, frame: Frame, panel: number): Change => {
  if (!canCollapse(splitting, panel)) return unchanged(splitting)
  if (isCollapsed(splitting, panel)) return unchanged(splitting)
  const values = working(splitting.sizes, frame)

  return {
    sizes: encodeAll(moveAll(values, panel, neighbourOf(panel)), splitting.sizes, frame),
    preCollapse: splitting.sizes,
    collapses: [{ panel, collapsed: true }]
  }
}

const restoreSource = (splitting: Splitting, panel: number): PaneSize => {
  const before = Arr.getUnsafe(splitting.preCollapse, panel)

  return magnitude(before) === 0 ? Arr.getUnsafe(splitting.panels, panel).defaultSize : before
}

export const expand = (splitting: Splitting, frame: Frame, panel: number): Change => {
  if (!canCollapse(splitting, panel)) return unchanged(splitting)
  if (!isCollapsed(splitting, panel)) return unchanged(splitting)
  const values = working(splitting.sizes, frame)
  const neighbour = neighbourOf(panel)
  const neighbourMin = resolvePanel(Arr.getUnsafe(splitting.panels, neighbour), frame).min
  const available = Math.max(0, at(values, neighbour) - neighbourMin)
  const restored = Math.min(resolve(restoreSource(splitting, panel), frame), available)
  if (restored <= 0) return unchanged(splitting)
  const next = setAt(setAt(values, panel, restored), neighbour, at(values, neighbour) - restored)

  return {
    sizes: encodeAll(next, splitting.sizes, frame),
    preCollapse: splitting.preCollapse,
    collapses: [{ panel, collapsed: false }]
  }
}

export const toggleCollapse = (splitting: Splitting, frame: Frame, panel: number): Change =>
  isCollapsed(splitting, panel) ? expand(splitting, frame, panel) : collapse(splitting, frame, panel)

export const reset = (splitting: Splitting, frame: Frame, handle: number): Change => {
  const values = working(splitting.sizes, frame)
  const panels = splitting.panels.map((panel) => resolvePanel(panel, frame))
  const after = handle + 1
  const total = at(values, handle) + at(values, after)
  const defaultBefore = panelAt(panels, handle).defaultSize
  const defaults = defaultBefore + panelAt(panels, after).defaultSize
  const target = defaults === 0 ? total / 2 : total * (defaultBefore / defaults)
  const next = adjacentOnly(values, panels, handle, target - at(values, handle))
  const collapsesNow = collapseChanges(splitting.sizes, next, [handle, after])

  return {
    sizes: encodeWorking(next, values, splitting.sizes, frame),
    preCollapse: collapsesNow.some((change) => change.collapsed) ? splitting.sizes : splitting.preCollapse,
    collapses: collapsesNow
  }
}

export type KeyMove = "decrease" | "increase" | "home" | "end" | "toggle"

const toggleTarget = (splitting: Splitting, values: ReadonlyArray<number>, handle: number): Option.Option<number> => {
  const before = canCollapse(splitting, handle)
  const after = canCollapse(splitting, handle + 1)
  if (before && at(values, handle) <= at(values, handle + 1)) return Option.some(handle)
  if (after) return Option.some(handle + 1)

  return before ? Option.some(handle) : Option.none()
}

export const keyboard = (splitting: Splitting, frame: Frame, handle: number, move: KeyMove, step: PaneSize): Change => {
  const values = working(splitting.sizes, frame)
  if (move === "toggle")
    return Option.match(toggleTarget(splitting, values, handle), {
      onNone: () => unchanged(splitting),
      onSome: (panel) => toggleCollapse(splitting, frame, panel)
    })
  const panel = resolvePanel(Arr.getUnsafe(splitting.panels, handle), frame)
  const amount = resolve(step, frame)
  const deltas: { readonly [Move in Exclude<KeyMove, "toggle">]: number } = {
    decrease: -amount,
    increase: amount,
    home: panel.min - at(values, handle),
    end: panel.max - at(values, handle)
  }
  const delta = deltas[move]
  if (delta === 0) return unchanged(splitting)

  return resizeFrom(splitting, { working: values, raw: splitting.sizes }, frame, handle, delta)
}
