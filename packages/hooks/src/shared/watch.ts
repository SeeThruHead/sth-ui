import { Effect, Queue, Stream } from "effect"

export type WatchSource = readonly [EventTarget, ReadonlyArray<string>]

export const watch = <A>(sources: ReadonlyArray<WatchSource>, read: () => A): Stream.Stream<A> =>
  Stream.callback<A>((queue) =>
    Effect.acquireRelease(
      Effect.sync(() => {
        const listener = () => Queue.offerUnsafe(queue, read())
        Queue.offerUnsafe(queue, read())
        sources.forEach(([target, events]) => events.forEach((name) => target.addEventListener(name, listener)))

        return listener
      }),
      (listener) =>
        Effect.sync(() =>
          sources.forEach(([target, events]) => events.forEach((name) => target.removeEventListener(name, listener)))
        )
    )
  )
