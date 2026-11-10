import { Effect, Queue, Stream } from "effect"

export type Orientation = { readonly angle: number; readonly type: string }

export type OrientationSource = EventTarget & Orientation

const read = (source: OrientationSource): Orientation => ({ angle: source.angle, type: source.type })

export const orientationChanges = (source: OrientationSource): Stream.Stream<Orientation> =>
  Stream.callback<Orientation>((queue) =>
    Effect.acquireRelease(
      Effect.sync(() => {
        const listener = () => Queue.offerUnsafe(queue, read(source))
        Queue.offerUnsafe(queue, read(source))
        source.addEventListener("change", listener)

        return listener
      }),
      (listener) => Effect.sync(() => source.removeEventListener("change", listener))
    )
  )
