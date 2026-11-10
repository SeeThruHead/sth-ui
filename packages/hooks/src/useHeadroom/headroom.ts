export type HeadroomOptions = { readonly fixedAt: number; readonly scrollDistance: number }

export type HeadroomEvent = "pin" | "release" | "fix"

export type Headroom = {
  readonly previousY: number
  readonly up: boolean
  readonly fixed: boolean
  readonly wasFixed: boolean
  readonly held: boolean
  readonly changeY: number
  readonly changeProgress: number
  readonly changeUp: boolean
  readonly scrollProgress: number
}

export const headroom: Headroom = {
  previousY: 0,
  up: false,
  fixed: true,
  wasFixed: false,
  held: false,
  changeY: 0,
  changeProgress: 1,
  changeUp: false,
  scrollProgress: 1
}

export const scrollDirectionOf = (previousY: number, y: number): "up" | "down" => (y < previousY ? "up" : "down")

const pinning = (pinned: boolean, fixed: boolean, up: boolean): readonly [boolean, ReadonlyArray<HeadroomEvent>] => {
  if (pinned) return fixed || up ? [true, []] : [false, ["release"]]

  return fixed || up ? [true, ["pin"]] : [false, []]
}

type Change = { readonly changeY: number; readonly changeProgress: number; readonly changeUp: boolean }

const zoneChange = (state: Headroom, fixed: boolean, y: number, up: boolean, fixedAt: number): Change => {
  if (state.fixed === fixed) return state

  return { changeY: fixed ? y : fixedAt, changeProgress: 1, changeUp: up }
}

const turned = (change: Change, fixed: boolean, y: number, up: boolean, distance: number): Change => {
  if (fixed) return change
  if (change.changeUp === up) return change
  const delta = Math.abs(y - change.changeY) / distance
  const progress = change.changeUp
    ? Math.min(change.changeProgress + delta, 1)
    : Math.max(change.changeProgress - delta, 0)

  return { changeY: y, changeProgress: progress, changeUp: up }
}

const progressOf = (change: Change, fixed: boolean, y: number, up: boolean, distance: number) => {
  if (fixed) return 1
  const delta = Math.abs(y - change.changeY) / distance

  return up ? Math.min(change.changeProgress + delta, 1) : Math.max(change.changeProgress - delta, 0)
}

export const headroomStep = (
  state: Headroom,
  y: number,
  options: HeadroomOptions
): readonly [Headroom, ReadonlyArray<HeadroomEvent>] => {
  const up = y === state.previousY ? state.up : y < state.previousY
  const fixed = y <= options.fixedAt
  const [held, pinEvents] = pinning(state.held, fixed, up)
  const change = turned(zoneChange(state, fixed, y, up, options.fixedAt), fixed, y, up, options.scrollDistance)
  const next: Headroom = {
    ...change,
    previousY: y,
    up,
    fixed,
    wasFixed: fixed,
    held,
    scrollProgress: progressOf(change, fixed, y, up, options.scrollDistance)
  }

  return [next, [...pinEvents, ...(fixed && !state.wasFixed ? ["fix" as const] : [])]]
}

export const headroomPinned = (state: Headroom): boolean => state.scrollProgress > 0
