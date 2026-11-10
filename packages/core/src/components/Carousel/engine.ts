export type Align = "start" | "center" | "end"

export type ContainScroll = false | "trimSnaps" | "keepSnaps"

export type EngineOptions = {
  readonly align?: Align
  readonly loop?: boolean
  readonly slidesToScroll?: number | "auto"
  readonly containScroll?: ContainScroll
  readonly dragFree?: boolean | "snap"
  readonly skipSnaps?: boolean
}

export type SlideBox = { readonly start: number; readonly size: number }

export type Layout = { readonly view: number; readonly slides: ReadonlyArray<SlideBox>; readonly endGap: number }

export type Limit = { readonly min: number; readonly max: number }

type LoopPoint = { readonly index: number; readonly loopPoint: number; readonly before: number; readonly after: number }

export type Engine = {
  readonly loop: boolean
  readonly view: number
  readonly contentSize: number
  readonly scrollSnaps: ReadonlyArray<number>
  readonly limit: Limit
  readonly slidesBySnap: ReadonlyArray<ReadonlyArray<number>>
  readonly loopPoints: ReadonlyArray<LoopPoint>
}

const pixelTolerance = 2

const emptySlide: SlideBox = { start: 0, size: 0 }

export const valueAt = (items: ReadonlyArray<number>, index: number): number => items[index] ?? 0

export const slideAt = (slides: ReadonlyArray<SlideBox>, index: number): SlideBox => slides[index] ?? emptySlide

const last = <A>(items: ReadonlyArray<A>, fallback: A): A => items.at(-1) ?? fallback

const range = (from: number, to: number): ReadonlyArray<number> =>
  Array.from({ length: Math.max(0, to - from + 1) }, (_, index) => from + index)

export const clampTo = (limit: Limit, input: number): number => Math.min(Math.max(input, limit.min), limit.max)

const pastAnyBound = (limit: Limit, input: number) => input < limit.min || input > limit.max

export const removeOffset = (limit: Limit, input: number): number => {
  const length = Math.abs(limit.min - limit.max)
  if (length === 0) return input

  return input - length * Math.ceil((input - limit.max) / length)
}

const alignmentOf = (align: Align, view: number, size: number) => {
  if (align === "start") return 0
  if (align === "end") return view - size

  return (view - size) / 2
}

const byNumber = <A>(items: ReadonlyArray<A>, size: number): ReadonlyArray<ReadonlyArray<A>> =>
  items.flatMap((_, index) => (index % size === 0 ? [items.slice(index, index + size)] : []))

const edgeGaps = (layout: Layout, readEdgeGap: boolean) => ({
  startGap: readEdgeGap ? Math.abs(layout.slides[0]?.start ?? 0) : 0,
  endGap: readEdgeGap ? layout.endGap : 0
})

const groupBounds = (layout: Layout, loop: boolean, gaps: { readonly startGap: number; readonly endGap: number }) =>
  layout.slides.reduce<ReadonlyArray<number>>((groups, slide, index) => {
    const first = last(groups, 0)
    const isFirst = first === 0
    const isLast = index === layout.slides.length - 1
    const edgeA = -slideAt(layout.slides, first).start
    const edgeB = -(slide.start + slide.size)
    const gapA = !loop && isFirst ? gaps.startGap : 0
    const gapB = !loop && isLast ? gaps.endGap : 0
    const chunk = Math.abs(edgeB - gapB - (edgeA + gapA))
    const split = index > 0 && chunk > layout.view + pixelTolerance ? [index] : []

    return [...groups, ...split, ...(isLast ? [layout.slides.length] : [])]
  }, [])

const groupsOf = <A>(
  items: ReadonlyArray<A>,
  layout: Layout,
  options: EngineOptions,
  gaps: { readonly startGap: number; readonly endGap: number }
): ReadonlyArray<ReadonlyArray<A>> => {
  const slidesToScroll = options.slidesToScroll ?? 1
  if (typeof slidesToScroll === "number") return byNumber(items, slidesToScroll)

  return groupBounds(layout, options.loop === true, gaps).map((end, index, bounds) =>
    items.slice(bounds[index - 1] ?? 0, end)
  )
}

const sizesWithGaps = (layout: Layout, gaps: { readonly startGap: number; readonly endGap: number }) =>
  layout.slides.map((slide, index) => {
    if (index === 0) return slide.size + gaps.startGap
    if (index === layout.slides.length - 1) return slide.size + gaps.endGap

    return Math.abs(slideAt(layout.slides, index + 1).start - slide.start)
  })

const bounded = (snap: number, index: number, count: number, bounds: Limit) => {
  const clamped = clampTo(bounds, snap)
  if (index === 0) return bounds.max
  if (index === count - 1) return bounds.min
  if (Math.abs(bounds.min - clamped) <= 1) return bounds.min
  if (Math.abs(bounds.max - clamped) <= 1) return bounds.max

  return clamped
}

const contain = (layout: Layout, contentSize: number, aligned: ReadonlyArray<number>, containScroll: ContainScroll) => {
  const bounds = { min: -contentSize + layout.view, max: 0 }
  const snaps = aligned.map((snap, index) => parseFloat(bounded(snap, index, aligned.length, bounds).toFixed(3)))
  const containLimit = { min: snaps.lastIndexOf(snaps[0] ?? 0), max: snaps.indexOf(last(snaps, 0)) + 1 }
  if (contentSize <= layout.view + pixelTolerance) return { snaps: [bounds.max], containLimit }
  if (containScroll === "keepSnaps") return { snaps, containLimit }

  return { snaps: snaps.slice(containLimit.min, containLimit.max), containLimit }
}

const fitting = (indexes: ReadonlyArray<number>, gap: number, sizes: ReadonlyArray<number>) =>
  indexes.reduce<ReadonlyArray<number>>(
    (chosen, index) =>
      gap - chosen.reduce((sum, item) => sum + valueAt(sizes, item), 0) > 0 ? [...chosen, index] : chosen,
    []
  )

const loopPointsOf = (
  layout: Layout,
  snaps: ReadonlyArray<number>,
  scrollSnaps: ReadonlyArray<number>,
  sizes: ReadonlyArray<number>,
  contentSize: number
): ReadonlyArray<LoopPoint> => {
  const indexes = range(0, sizes.length - 1)
  const first = scrollSnaps[0] ?? 0
  const bound = (index: number, offset: number, end: boolean) => {
    const snap = valueAt(snaps, index)
    const size = slideAt(layout.slides, index).size

    return end ? snap + layout.view - 0.5 + offset : snap - size + 0.5 + offset
  }
  const starts = fitting(indexes.toReversed(), first, sizes).map((index) => ({
    index,
    loopPoint: bound(index, contentSize, false),
    before: 0,
    after: -contentSize
  }))
  const ends = fitting(indexes, layout.view - first - 1, sizes).map((index) => ({
    index,
    loopPoint: bound(index, -contentSize, true),
    before: contentSize,
    after: 0
  }))

  return [...starts, ...ends]
}

const canLoop = (points: ReadonlyArray<LoopPoint>, sizes: ReadonlyArray<number>, view: number) =>
  points.every(
    ({ index }) => view - sizes.reduce((sum, size, position) => (position === index ? sum : sum + size), 0) <= 0.1
  )

const slidesBySnapOf = (
  groups: ReadonlyArray<ReadonlyArray<number>>,
  scrollSnaps: ReadonlyArray<number>,
  containSnaps: boolean,
  containScroll: ContainScroll,
  containLimit: Limit,
  count: number
): ReadonlyArray<ReadonlyArray<number>> => {
  if (scrollSnaps.length === 1) return [range(0, count - 1)]
  if (!containSnaps || containScroll === "keepSnaps") return groups
  const kept = groups.slice(containLimit.min, containLimit.max)

  return kept.map((group, index) => {
    if (index === 0) return range(0, last(group, 0))
    if (index === kept.length - 1) return range(valueAt(group, 0), count - 1)

    return group
  })
}

export const engineOf = (layout: Layout, options: EngineOptions = {}): Engine => {
  const wantsLoop = options.loop === true
  const containScroll = options.containScroll ?? "trimSnaps"
  const gaps = edgeGaps(layout, wantsLoop || containScroll !== false)
  const sizes = sizesWithGaps(layout, gaps)
  const snaps = layout.slides.map((slide) => -Math.abs(slide.start))
  const alignments = groupsOf(layout.slides, layout, options, gaps).map((group) =>
    alignmentOf(
      options.align ?? "center",
      layout.view,
      Math.abs(last(group, emptySlide).start + last(group, emptySlide).size - slideAt(group, 0).start)
    )
  )
  const aligned = groupsOf(snaps, layout, options, gaps).map(
    (group, index) => valueAt(group, 0) + valueAt(alignments, index)
  )
  const contentSize = -last(snaps, 0) + last(sizes, 0)
  const contained = contain(layout, contentSize, aligned, containScroll)
  const loopPoints = loopPointsOf(layout, snaps, aligned, sizes, contentSize)
  const loop = wantsLoop && canLoop(loopPoints, sizes, layout.view)
  const containSnaps = !loop && containScroll !== false
  const scrollSnaps = containSnaps ? contained.snaps : aligned
  const max = valueAt(scrollSnaps, 0)

  return {
    loop,
    view: layout.view,
    contentSize,
    scrollSnaps,
    limit: { min: loop ? max - contentSize : last(scrollSnaps, 0), max },
    slidesBySnap: slidesBySnapOf(
      groupsOf(range(0, layout.slides.length - 1), layout, options, gaps),
      scrollSnaps,
      containSnaps,
      containScroll,
      contained.containLimit,
      layout.slides.length
    ),
    loopPoints: loop ? loopPointsOf(layout, snaps, scrollSnaps, sizes, contentSize) : []
  }
}

export const normalizeIndex = (engine: Engine, input: number): number => {
  const max = engine.scrollSnaps.length - 1
  if (!engine.loop) return Math.min(Math.max(input, 0), max)

  return Math.abs((max + 1 + input) % (max + 1))
}

export type Direction = 0 | 1 | -1

const nearest = (best: number, item: number) => (Math.abs(item) < Math.abs(best) ? item : best)

export const shortcut = (engine: Engine, target: number, direction: Direction): number => {
  if (!engine.loop) return target
  const targets = [target + engine.contentSize, target - engine.contentSize]
  if (direction === 0) return targets.reduce(nearest, target)

  return targets
    .filter((item) => Math.sign(item) === direction)
    .reduce(nearest, Math.sign(target) === direction ? target : Infinity)
}

export type Target = { readonly index: number; readonly distance: number }

export const byIndex = (engine: Engine, index: number, direction: Direction, location: number): Target => ({
  index,
  distance: shortcut(engine, valueAt(engine.scrollSnaps, index) - location, direction)
})

const closestSnap = (engine: Engine, target: number): Target => {
  const distance = engine.loop ? removeOffset(engine.limit, target) : clampTo(engine.limit, target)
  const found = engine.scrollSnaps.reduce(
    (best, snap, index) => {
      const displacement = Math.abs(shortcut(engine, snap - distance, 0))

      return displacement < best.smallest ? { smallest: displacement, index } : best
    },
    { smallest: Infinity, index: 0 }
  )

  return { index: found.index, distance }
}

export const byDistance = (engine: Engine, distance: number, snapToClosest: boolean, location: number): Target => {
  const target = location + distance
  const closest = closestSnap(engine, target)
  if (!snapToClosest) return { index: closest.index, distance }
  if (!engine.loop && pastAnyBound(engine.limit, target)) return { index: closest.index, distance }

  return {
    index: closest.index,
    distance: distance + shortcut(engine, valueAt(engine.scrollSnaps, closest.index) - closest.distance, 0)
  }
}

export const settle = (engine: Engine, location: number): number =>
  engine.loop ? removeOffset(engine.limit, location) : clampTo(engine.limit, location)

export const slideOffsets = (engine: Engine, count: number, location: number): ReadonlyArray<number> =>
  range(0, count - 1).map((index) => {
    const point = engine.loopPoints.findLast((item) => item.index === index)
    if (point === undefined) return 0

    return location > point.loopPoint ? point.after : point.before
  })

export type Release = { readonly velocity: number; readonly pointer: "mouse" | "touch" }

export const released = (
  engine: Engine,
  options: EngineOptions,
  index: number,
  location: number,
  release: Release
): Target => {
  const dragFree = options.dragFree === true || options.dragFree === "snap"
  const settles = options.dragFree !== true
  const boost = dragFree ? { mouse: 500, touch: 600 } : { mouse: 300, touch: 400 }
  const force = release.velocity * boost[release.pointer]
  const threshold = Math.min(Math.max(engine.view * 0.2, 50), 225)
  const base = () => byDistance(engine, force, settles, location)
  if (dragFree || Math.abs(force) < threshold) return base()
  if (options.skipSnaps === true && closestSnap(engine, location).index !== index) {
    return byDistance(engine, base().distance * 0.5, settles, location)
  }

  return byIndex(engine, normalizeIndex(engine, index - Math.sign(force)), 0, location)
}
