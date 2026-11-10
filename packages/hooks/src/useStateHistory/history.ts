export type StateHistory<A> = { readonly history: ReadonlyArray<A>; readonly current: number }

export const stateHistory = <A>(initial: A): StateHistory<A> => ({ history: [initial], current: 0 })

export const setHistory = <A>(state: StateHistory<A>, value: A): StateHistory<A> => {
  const history = [...state.history.slice(0, state.current + 1), value]

  return { history, current: history.length - 1 }
}

export const backHistory = <A>(state: StateHistory<A>, steps = 1): StateHistory<A> => ({
  ...state,
  current: Math.max(0, state.current - steps)
})

export const forwardHistory = <A>(state: StateHistory<A>, steps = 1): StateHistory<A> => ({
  ...state,
  current: Math.min(state.history.length - 1, state.current + steps)
})

export const currentOf = <A>(state: StateHistory<A>): A | undefined => state.history[state.current]
