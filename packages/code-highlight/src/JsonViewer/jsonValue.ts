import { Predicate } from "effect"

export const pathSeparator = "\u0000"

export const serializePath = (segments: ReadonlyArray<string>): string => segments.join(pathSeparator)

export type ArrayChunk = { readonly start: number; readonly end: number }

export const arrayChunks = (
  length: number,
  groupArraysAfterLength: number | false
): ReadonlyArray<ArrayChunk> | null => {
  if (groupArraysAfterLength === false) return null
  const size = Math.floor(groupArraysAfterLength)
  if (!(size >= 1) || length <= groupArraysAfterLength) return null

  return Array.from({ length: Math.ceil(length / size) }, (_chunk, index) => ({
    start: index * size,
    end: Math.min((index + 1) * size, length) - 1
  }))
}

export const chunkSegment = (chunk: ArrayChunk): string => `[${chunk.start}...${chunk.end}]`

const hasToJson = (value: object): value is { readonly toJSON: () => unknown } =>
  typeof Reflect.get(value, "toJSON") === "function"

export const displayValue = (value: unknown): unknown => {
  if (!Predicate.isObjectOrArray(value) || !hasToJson(value)) return value
  try {
    return value.toJSON()
  } catch {
    return value
  }
}

export const isExpandable = (value: unknown): value is object => Predicate.isObjectOrArray(value)

export type SortKeys = boolean | ((a: string, b: string) => number)

export const entriesOf = (value: object, sortKeys: SortKeys = false): ReadonlyArray<readonly [string, unknown]> => {
  if (Array.isArray(value)) return value.map((item: unknown, index) => [String(index), item] as const)
  const entries = Object.entries(value)
  if (sortKeys === false) return entries
  const compare = sortKeys === true ? (a: string, b: string) => a.localeCompare(b) : sortKeys

  return entries.toSorted((a, b) => compare(a[0], b[0]))
}

export type ExpandableOptions = { readonly depth?: number; readonly groupArraysAfterLength?: number | false }

const visit = (
  node: unknown,
  path: ReadonlyArray<string>,
  level: number,
  ancestors: ReadonlyArray<object>,
  options: Required<ExpandableOptions>
): ReadonlyArray<string> => {
  const resolved = displayValue(node)
  if (!isExpandable(resolved) || ancestors.includes(resolved) || level > options.depth) return []
  const entries = entriesOf(resolved)
  if (entries.length === 0) return []
  const own = path.length > 0 ? [serializePath(path)] : []
  const inside = [...ancestors, resolved]
  const children = (items: ReadonlyArray<readonly [string, unknown]>, childLevel: number) =>
    items.flatMap(([key, child]) => visit(child, [...path, key], childLevel, inside, options))
  const chunks = Array.isArray(resolved) ? arrayChunks(entries.length, options.groupArraysAfterLength) : null
  if (chunks === null) return [...own, ...children(entries, level + 1)]
  if (level + 1 > options.depth) return own

  return [
    ...own,
    ...chunks.flatMap((chunk) => [
      serializePath([...path, chunkSegment(chunk)]),
      ...children(entries.slice(chunk.start, chunk.end + 1), level + 2)
    ])
  ]
}

export const expandablePaths = (value: unknown, options: ExpandableOptions = {}): ReadonlyArray<string> =>
  visit(value, [], 1, [], {
    depth: options.depth ?? Number.POSITIVE_INFINITY,
    groupArraysAfterLength: options.groupArraysAfterLength ?? false
  })

export const valueType = (value: unknown): string => {
  if (value === null) return "null"
  if (Array.isArray(value)) return "array"

  return typeof value
}

const labels: Readonly<Record<string, string>> = { boolean: "bool" }

export const typeLabel = (value: unknown): string => {
  const type = valueType(value)
  if (type === "number") return Number.isInteger(value) ? "int" : "float"

  return labels[type] ?? type
}

export type Formatted = { readonly display: string; readonly collapsed: boolean }

const isHighSurrogate = (code: number) => code >= 0xd8_00 && code <= 0xdb_ff

const isLowSurrogate = (code: number) => code >= 0xdc_00 && code <= 0xdf_ff

const splitsSurrogatePair = (value: string, at: number) => {
  if (!isHighSurrogate(value.charCodeAt(at - 1))) return false

  return isLowSurrogate(value.charCodeAt(at))
}

const quote = (text: string) => JSON.stringify(text)

export const formatValue = (
  value: unknown,
  withQuotes: boolean,
  collapseStringsAfterLength: number | false
): Formatted => {
  if (typeof value !== "string") return { display: String(value), collapsed: false }
  if (collapseStringsAfterLength === false || value.length <= collapseStringsAfterLength) {
    return { display: withQuotes ? quote(value) : value, collapsed: false }
  }
  const splitsPair = splitsSurrogatePair(value, collapseStringsAfterLength)
  const truncated = value.slice(0, collapseStringsAfterLength - (splitsPair ? 1 : 0))

  return { display: withQuotes ? `${quote(truncated).slice(0, -1)}..."` : `${truncated}...`, collapsed: true }
}

const plain = (value: unknown, ancestors: ReadonlyArray<object>): unknown => {
  if (typeof value === "bigint") return value.toString()
  const resolved = displayValue(value)
  if (!isExpandable(resolved)) return resolved
  if (ancestors.includes(resolved)) return "[Circular]"
  const inside = [...ancestors, resolved]
  if (Array.isArray(resolved)) return resolved.map((item: unknown) => plain(item, inside))

  return Object.fromEntries(Object.entries(resolved).map(([key, item]) => [key, plain(item, inside)]))
}

export const safeStringify = (value: unknown): string => JSON.stringify(plain(value, []), null, 2) ?? String(value)
