import { Predicate } from "effect"

export type ReorderPayload = { readonly from: number; readonly to: number }

const unsafe = new Set(["__proto__", "constructor", "prototype"])

export const splitPath = (path: unknown): ReadonlyArray<string> => {
  if (typeof path !== "string") return []
  const segments = path.split(".")

  return segments.some((segment) => unsafe.has(segment)) ? [] : segments
}

const childOf = (value: unknown, key: string): unknown =>
  Predicate.isObject(value) || Array.isArray(value) ? Reflect.get(value, key) : undefined

export const getPath = (path: unknown, values: unknown): unknown => {
  const segments = splitPath(path)
  if (segments.length === 0) return undefined

  return segments.reduce<unknown>(
    (value, key) => (value === null || value === undefined ? undefined : childOf(value, key)),
    values
  )
}

const withChild = (container: unknown, key: string, value: unknown): unknown => {
  if (!Array.isArray(container)) return { ...Object(container), [key]: value }
  const index = Number(key)

  return Array.from({ length: Math.max(container.length, index + 1) }, (_, position) =>
    position === index ? value : container[position]
  )
}

const setIn = (
  container: unknown,
  segments: ReadonlyArray<string>,
  value: unknown
): Readonly<{ changed: boolean; result: unknown }> => {
  const [key, ...rest] = segments
  if (key === undefined) return { changed: true, result: value }
  if (container === null || typeof container !== "object") return { changed: false, result: container }
  const inner = setIn(childOf(container, key), rest, value)
  if (!inner.changed) return { changed: false, result: container }

  return { changed: true, result: withChild(container, key, inner.result) }
}

export const setPath = (path: unknown, value: unknown, values: unknown): unknown => {
  const segments = splitPath(path)
  if (segments.length === 0) return values
  const next = setIn(values, segments, value)

  return next.changed ? next.result : values
}

const listAt = (path: unknown, values: unknown): ReadonlyArray<unknown> | undefined => {
  const value = getPath(path, values)

  return Array.isArray(value) ? value : undefined
}

export const insertPath = (path: unknown, value: unknown, index: number | undefined, values: unknown): unknown => {
  const list = listAt(path, values)
  if (list === undefined) return values

  return setPath(path, list.toSpliced(index ?? list.length, 0, value), values)
}

export const removePath = (path: unknown, index: number, values: unknown): unknown => {
  const list = listAt(path, values)
  if (list === undefined) return values

  return setPath(
    path,
    list.filter((_, position) => position !== index),
    values
  )
}

export const reorderPath = (path: unknown, { from, to }: ReorderPayload, values: unknown): unknown => {
  const list = listAt(path, values)
  if (list === undefined) return values

  return setPath(path, list.toSpliced(from, 1).toSpliced(to, 0, list[from]), values)
}

export const replacePath = (path: unknown, item: unknown, index: number, values: unknown): unknown => {
  const list = listAt(path, values)
  if (list === undefined || list.length <= index) return values

  return setPath(path, list.with(index, item), values)
}

export const getDataPath = (formName: string | undefined, fieldPath: string): string =>
  formName === undefined || formName === "" ? fieldPath : `${formName}-${fieldPath}`
