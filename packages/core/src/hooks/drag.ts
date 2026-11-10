import { Effect, Queue, Stream } from "effect"
import type { Cause } from "effect"

const offering =
  <M>(queue: Queue.Queue<M, Cause.Done>, toMessage: (event: PointerEvent) => M) =>
  (event: PointerEvent): void => {
    Queue.offerUnsafe(queue, toMessage(event))
  }

export const documentDrag = <M>(moved: (x: number, y: number) => M, released: M): Stream.Stream<M> =>
  Stream.callback<M>((queue) =>
    Effect.acquireRelease(
      Effect.sync(() => {
        const body = document.body.style
        const move = offering(queue, (event) => moved(event.clientX, event.clientY))
        const release = offering(queue, () => released)
        body.setProperty("user-select", "none")
        document.addEventListener("pointermove", move)
        document.addEventListener("pointerup", release)
        document.addEventListener("pointercancel", release)

        return () => {
          document.removeEventListener("pointermove", move)
          document.removeEventListener("pointerup", release)
          document.removeEventListener("pointercancel", release)
          body.removeProperty("user-select")
        }
      }),
      (stop) => Effect.sync(stop)
    ).pipe(Effect.flatMap(() => Effect.never))
  )
