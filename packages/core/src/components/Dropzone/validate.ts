export type FileLike = { readonly name?: string; readonly type: string; readonly size?: number }

export type FileError = { readonly code: string; readonly message: string }

export type FileRejection<F> = { readonly file: F; readonly errors: ReadonlyArray<FileError> }

export type Accept = ReadonlyArray<string> | Readonly<Record<string, ReadonlyArray<string>>>

export type DropzoneRules<F extends FileLike = FileLike> = {
  readonly accept?: Accept
  readonly multiple?: boolean
  readonly maxSize?: number
  readonly minSize?: number
  readonly maxFiles?: number
  readonly validator?: (file: F) => FileError | ReadonlyArray<FileError> | null
}

export type DropzoneStatus = "idle" | "accept" | "reject"

const isList = (accept: Accept): accept is ReadonlyArray<string> => Array.isArray(accept)

const isAcceptValue = (value: string) => value.startsWith(".") || /\w+\/[-+.\w*]+/.test(value)

export const acceptList = (accept: Accept | undefined): ReadonlyArray<string> => {
  if (accept === undefined) return []
  if (isList(accept)) return accept

  return Object.entries(accept)
    .flatMap(([mime, extensions]) => [mime, ...extensions])
    .filter(isAcceptValue)
}

const acceptsType = (file: FileLike, type: string) => {
  const valid = type.trim().toLowerCase()
  const mime = file.type.toLowerCase()
  if (valid.startsWith(".")) return (file.name ?? "").toLowerCase().endsWith(valid)
  if (valid.endsWith("/*")) return mime.replace(/\/.*$/, "") === valid.replace(/\/.*$/, "")

  return mime === valid
}

export const accepts = (file: FileLike, accept: ReadonlyArray<string>): boolean => {
  if (accept.length === 0) return true
  if (file.type === "application/x-moz-file") return true

  return accept.some((type) => acceptsType(file, type))
}

export const invalidType = (accept: ReadonlyArray<string>): FileError => ({
  code: "file-invalid-type",
  message: `File type must be ${accept.length > 1 ? `one of ${accept.join(", ")}` : (accept[0] ?? "")}`
})

const bytes = (size: number) => `${size} ${size === 1 ? "byte" : "bytes"}`

export const tooLarge = (maxSize: number): FileError => ({
  code: "file-too-large",
  message: `File is larger than ${bytes(maxSize)}`
})

export const tooSmall = (minSize: number): FileError => ({
  code: "file-too-small",
  message: `File is smaller than ${bytes(minSize)}`
})

export const tooManyFiles: FileError = { code: "too-many-files", message: "Too many files" }

const sizeErrors = (file: FileLike, minSize: number, maxSize: number): ReadonlyArray<FileError> => {
  if (file.size === undefined) return []
  if (file.size > maxSize) return [tooLarge(maxSize)]

  return file.size < minSize ? [tooSmall(minSize)] : []
}

const customErrors = <F extends FileLike>(file: F, rules: DropzoneRules<F>): ReadonlyArray<FileError> => {
  const result = rules.validator?.(file) ?? null
  if (result === null) return []

  return "code" in result ? [result] : result
}

export const fileErrors = <F extends FileLike>(file: F, rules: DropzoneRules<F>): ReadonlyArray<FileError> => {
  const accept = acceptList(rules.accept)

  return [
    ...(accepts(file, accept) ? [] : [invalidType(accept)]),
    ...sizeErrors(file, rules.minSize ?? 0, rules.maxSize ?? Infinity),
    ...customErrors(file, rules)
  ]
}

const tooMany = (count: number, rules: DropzoneRules<never>) => {
  if (rules.multiple === false) return count > 1
  const maxFiles = rules.maxFiles ?? 0

  return maxFiles >= 1 && count > maxFiles
}

export type Sorted<F> = { readonly accepted: ReadonlyArray<F>; readonly rejected: ReadonlyArray<FileRejection<F>> }

export const sortFiles = <F extends FileLike>(files: ReadonlyArray<F>, rules: DropzoneRules<F>): Sorted<F> => {
  const checked = files.map((file) => ({ file, errors: fileErrors(file, rules) }))
  const accepted = checked.filter((entry) => entry.errors.length === 0).map((entry) => entry.file)
  const rejected = checked.filter((entry) => entry.errors.length > 0)
  if (!tooMany(accepted.length, rules)) return { accepted, rejected }

  return { accepted: [], rejected: [...rejected, ...accepted.map((file) => ({ file, errors: [tooManyFiles] }))] }
}

export const dragStatus = <F extends FileLike>(files: ReadonlyArray<F>, rules: DropzoneRules<F>): DropzoneStatus => {
  if (files.length === 0) return "idle"
  if (tooMany(files.length, rules)) return "reject"

  return files.every((file) => fileErrors(file, rules).length === 0) ? "accept" : "reject"
}
