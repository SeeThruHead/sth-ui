import { Option, Predicate } from "effect"
import { fromJsonOption } from "@sth-ui/core/json.ts"

export type FormError = string | true

export type RuleResult = FormError | null | undefined | false

export type SyncRule = (value: unknown, values: unknown, path: string) => RuleResult

const errorOf = (error: FormError | undefined): FormError => (error === undefined || error === "" ? true : error)

const lengthValid = (payload: number | { readonly min?: number; readonly max?: number }, length: number) => {
  if (typeof payload === "number") return length === payload
  if (payload.max !== undefined && length > payload.max) return false

  return payload.min === undefined || length >= payload.min
}

const lengthOf = (value: unknown): Option.Option<number> => {
  if (typeof value === "string") return Option.some(value.trim().length)
  if (!Predicate.isObject(value) && !Array.isArray(value)) return Option.none()
  const length: unknown = Reflect.get(value, "length")

  return typeof length === "number" ? Option.some(length) : Option.none()
}

export const hasLength =
  (payload: number | { readonly min?: number; readonly max?: number }, error?: FormError): SyncRule =>
  (value) =>
    Option.exists(lengthOf(value), (length) => lengthValid(payload, length)) ? null : errorOf(error)

export const matches =
  (pattern: RegExp, error?: FormError): SyncRule =>
  (value) =>
    typeof value === "string" && pattern.test(value) ? null : errorOf(error)

export const isEmail = (error?: FormError): SyncRule =>
  matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, error)

export const isInRange =
  (range: { readonly min?: number; readonly max?: number }, error?: FormError): SyncRule =>
  (value) => {
    if (typeof value !== "number") return errorOf(error)
    if (range.min !== undefined && value < range.min) return errorOf(error)

    return range.max !== undefined && value > range.max ? errorOf(error) : null
  }

const parses = (value: string) => Option.isSome(fromJsonOption(value))

export const isJSONString =
  (error?: FormError): SyncRule =>
  (value) =>
    typeof value === "string" && parses(value) ? null : errorOf(error)

export const isNotEmptyHTML =
  (error?: FormError): SyncRule =>
  (value) =>
    typeof value === "string" && value.replace(/<\/?[^>]+(>|$)/g, "").trim().length > 0 ? null : errorOf(error)

const filled = (value: unknown) => {
  if (typeof value === "string") return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0

  return value !== null && value !== undefined && value !== false
}

export const isNotEmpty =
  (error?: FormError): SyncRule =>
  (value) =>
    filled(value) ? null : errorOf(error)

export const isOneOf =
  (values: ReadonlyArray<unknown>, error?: FormError): SyncRule =>
  (value) =>
    values.includes(value) ? null : errorOf(error)

export type UrlOptions = { readonly protocols?: ReadonlyArray<string>; readonly allowLocalhost?: boolean }

const urlAllowed = (url: URL, options: UrlOptions) => {
  if (!(options.protocols ?? ["http", "https"]).includes(url.protocol.replace(":", ""))) return false

  return options.allowLocalhost === true || url.hostname !== "localhost"
}

const urlValid = (value: string, options: UrlOptions) =>
  Option.exists(Option.liftThrowable((input: string) => new URL(input))(value), (url) => urlAllowed(url, options))

export const isUrl =
  (options: UrlOptions = {}, error?: FormError): SyncRule =>
  (value) =>
    typeof value === "string" && urlValid(value, options) ? null : errorOf(error)

export const matchesField =
  (field: string, error?: FormError): SyncRule =>
  (value, values) =>
    Predicate.isObject(values) && field in values && Reflect.get(values, field) === value ? null : errorOf(error)
