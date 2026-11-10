export type Queue<A> = { readonly state: ReadonlyArray<A>; readonly queue: ReadonlyArray<A> }

const split = <A>(items: ReadonlyArray<A>, limit: number): Queue<A> => ({
  state: items.slice(0, limit),
  queue: items.slice(limit)
})

export const makeQueue = <A>(limit: number, initialValues: ReadonlyArray<A> = []): Queue<A> =>
  split(initialValues, limit)

export const addToQueue = <A>(current: Queue<A>, limit: number, ...items: ReadonlyArray<A>): Queue<A> =>
  split([...current.state, ...current.queue, ...items], limit)

export const updateQueue = <A>(
  current: Queue<A>,
  limit: number,
  update: (items: ReadonlyArray<A>) => ReadonlyArray<A>
): Queue<A> => split(update([...current.state, ...current.queue]), limit)

export const cleanQueue = <A>(current: Queue<A>): Queue<A> => ({ state: current.state, queue: [] })
