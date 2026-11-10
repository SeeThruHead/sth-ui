import { Option } from "effect"

export type StorageArea = {
  readonly getItem: (key: string) => string | null
  readonly setItem: (key: string, value: string) => void
  readonly removeItem: (key: string) => void
}

export const readJson = (text: string): unknown => {
  try {
    return text === "" ? text : JSON.parse(text)
  } catch {
    return text
  }
}

export const readStored = <A>(
  area: StorageArea,
  key: string,
  read: (stored: unknown) => Option.Option<A>,
  fallback: A
): A =>
  Option.getOrElse(
    Option.flatMap(Option.fromNullishOr(area.getItem(key)), (text) => read(readJson(text))),
    () => fallback
  )

export const storageChangeEvent = (area: "localStorage" | "sessionStorage") =>
  area === "localStorage" ? "sth-local-storage" : "sth-session-storage"
