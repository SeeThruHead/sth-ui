import type { ReorderPayload } from "./paths.ts"

export type PathRecord<A> = Readonly<Record<string, A>>

export const clearListState = <A>(field: string, state: PathRecord<A>): PathRecord<A> =>
  Object.fromEntries(Object.entries(state).filter(([key]) => !key.startsWith(`${field}.`)))

const indexAfter = (key: string, path: string) =>
  Number.parseInt(
    key
      .slice(path.length + 1)
      .split(".")
      .reduce((first) => first),
    10
  )

const shifted = (path: string, index: number, change: 1 | -1) => (key: string) => {
  if (!key.startsWith(`${path}.`)) return key
  const current = indexAfter(key, path)
  if (Number.isNaN(current) || current < index) return key

  return key.replace(`${path}.${current}`, `${path}.${current + change}`)
}

export const changeIndices = <A>(
  path: string,
  index: number | undefined,
  state: PathRecord<A>,
  change: 1 | -1
): PathRecord<A> => {
  if (index === undefined) return state
  const kept =
    change === -1
      ? Object.entries(clearListState(`${path}.${index}`, state)).filter(([key]) => key !== `${path}.${index}`)
      : Object.entries(state)
  const rename = shifted(path, index, change)

  return Object.fromEntries(kept.map(([key, value]) => [rename(key), value]))
}

const isItemKey = (key: string, start: string) => key === start || key.startsWith(`${start}.`)

export const reorderKeys = <A>(path: string, { from, to }: ReorderPayload, state: PathRecord<A>): PathRecord<A> => {
  const fromStart = `${path}.${from}`
  const toStart = `${path}.${to}`
  const moved = (key: string) => {
    if (isItemKey(key, fromStart)) return key.replace(fromStart, toStart)
    if (isItemKey(key, toStart)) return key.replace(toStart, fromStart)

    return key
  }

  return Object.fromEntries(Object.entries(state).map(([key, value]) => [moved(key), value]))
}
