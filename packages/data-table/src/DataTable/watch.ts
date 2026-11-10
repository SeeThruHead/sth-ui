import { Effect, Queue, Schema, Stream } from "effect"
import * as Mount from "foldkit/mount"
import { Message } from "./model.ts"

const Watched = Schema.Union([Message.Measured, Message.ChangedShift])
type Watched = typeof Watched.Type

const measured = (element: Element): Watched =>
  Message.Measured({
    viewportHeight: element.clientHeight,
    coarse: window.matchMedia("(pointer: coarse)").matches
  })

const watch = (element: Element, report: (message: Watched) => void) => {
  const measure = () => report(measured(element))
  const shifted = (event: KeyboardEvent) => report(Message.ChangedShift({ shift: event.shiftKey }))
  const resized = new ResizeObserver(measure)
  resized.observe(element)
  window.addEventListener("keydown", shifted)
  window.addEventListener("keyup", shifted)
  measure()

  return () => {
    resized.disconnect()
    window.removeEventListener("keydown", shifted)
    window.removeEventListener("keyup", shifted)
  }
}

export const WatchDataTable = Mount.defineStream("DataTableWatch", {
  messages: [Message.Measured, Message.ChangedShift],
  execute: ({ element }) =>
    Stream.callback<Watched>((queue) =>
      Effect.acquireRelease(
        Effect.sync(() =>
          watch(element, (message) => {
            Queue.offerUnsafe(queue, message)
          })
        ),
        (stop) => Effect.sync(stop)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})
