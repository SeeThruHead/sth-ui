export const select = <A>(selection: ReadonlyArray<A>, item: A): ReadonlyArray<A> =>
  selection.includes(item) ? selection : [...selection, item]

export const deselect = <A>(selection: ReadonlyArray<A>, item: A): ReadonlyArray<A> =>
  selection.filter((selected) => selected !== item)

export const toggle = <A>(selection: ReadonlyArray<A>, item: A): ReadonlyArray<A> =>
  selection.includes(item) ? deselect(selection, item) : [...selection, item]

export const isAllSelected = <A>(data: ReadonlyArray<A>, selection: ReadonlyArray<A>): boolean =>
  data.length > 0 && data.every((item) => selection.includes(item))

export const isSomeSelected = <A>(data: ReadonlyArray<A>, selection: ReadonlyArray<A>): boolean =>
  data.some((item) => selection.includes(item))

export const setSelection = <A>(items: ReadonlyArray<A>): ReadonlyArray<A> => [...new Set(items)]
