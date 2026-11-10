export type Defined<T> = { readonly [K in keyof T]?: Exclude<T[K], undefined> }

export function defined<T extends object>(value: T): Defined<T>
export function defined(value: object): object {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined))
}
