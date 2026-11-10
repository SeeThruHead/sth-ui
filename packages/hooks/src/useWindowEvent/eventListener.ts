import type { Cause } from "effect"
import { Effect, Queue, Schema, Stream } from "effect"
import { defineMessageUnion } from "foldkit/message"
import * as Mount from "foldkit/mount"

export const EventListenerMessage = defineMessageUnion({ Heard: { type: Schema.String } })
export type EventListenerMessage = typeof EventListenerMessage.Type

const listen = (
  queue: Queue.Queue<EventListenerMessage, Cause.Done>,
  element: Element,
  type: string,
  capture: boolean
) => {
  const listener = (event: Event) => Queue.offerUnsafe(queue, EventListenerMessage.Heard({ type: event.type }))
  element.addEventListener(type, listener, capture)

  return () => element.removeEventListener(type, listener, capture)
}

const EventListenerMount = Mount.defineStream("EventListener", {
  args: { type: Schema.String, capture: Schema.Boolean },
  messages: [EventListenerMessage.Heard],
  execute: ({ element, type, capture }) =>
    Stream.callback<EventListenerMessage>((queue) =>
      Effect.acquireRelease(
        Effect.sync(() => listen(queue, element, type, capture)),
        (stop) => Effect.sync(stop)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

export const eventListener = (type: string, options: { readonly capture?: boolean } = {}) =>
  EventListenerMount({ type, capture: options.capture ?? false })
