import { Array as Arr } from "effect"

export type Move = { readonly from: number; readonly to: number }

export const append = <A>(list: ReadonlyArray<A>, ...items: ReadonlyArray<A>): ReadonlyArray<A> => [...list, ...items]

export const prepend = <A>(list: ReadonlyArray<A>, ...items: ReadonlyArray<A>): ReadonlyArray<A> => [...items, ...list]

export const insert = <A>(list: ReadonlyArray<A>, index: number, ...items: ReadonlyArray<A>): ReadonlyArray<A> => [
  ...list.slice(0, index),
  ...items,
  ...list.slice(index)
]

export const pop = <A>(list: ReadonlyArray<A>): ReadonlyArray<A> => list.slice(0, -1)

export const shift = <A>(list: ReadonlyArray<A>): ReadonlyArray<A> => list.slice(1)

export const apply = <A>(list: ReadonlyArray<A>, update: (item: A, index: number) => A): ReadonlyArray<A> =>
  list.map(update)

export const applyWhere = <A>(
  list: ReadonlyArray<A>,
  condition: (item: A, index: number) => boolean,
  update: (item: A, index: number) => A
): ReadonlyArray<A> => list.map((item, index) => (condition(item, index) ? update(item, index) : item))

export const remove = <A>(list: ReadonlyArray<A>, ...indices: ReadonlyArray<number>): ReadonlyArray<A> =>
  list.filter((_item, index) => !indices.includes(index))

export const reorder = <A>(list: ReadonlyArray<A>, { from, to }: Move): ReadonlyArray<A> =>
  Arr.match(list.slice(from, from + 1), {
    onEmpty: () => list,
    onNonEmpty: ([item]) => insert(remove(list, from), to, item)
  })

export const swap = <A>(list: ReadonlyArray<A>, { from, to }: Move): ReadonlyArray<A> =>
  list.map((item, index) => {
    if (index === from) return Arr.getUnsafe(list, to)
    if (index === to) return Arr.getUnsafe(list, from)

    return item
  })

export const setItem = <A>(list: ReadonlyArray<A>, index: number, value: A): ReadonlyArray<A> =>
  list.map((item, at) => (at === index ? value : item))

export const setItemProp = <A extends object, K extends keyof A>(
  list: ReadonlyArray<A>,
  index: number,
  prop: K,
  value: A[K]
): ReadonlyArray<A> => list.map((item, at) => (at === index ? { ...item, [prop]: value } : item))

export const filter = <A>(list: ReadonlyArray<A>, keep: (item: A, index: number) => boolean): ReadonlyArray<A> =>
  list.filter(keep)
