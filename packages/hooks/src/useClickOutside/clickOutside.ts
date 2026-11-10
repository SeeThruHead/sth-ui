import type { Cause } from "effect"
import { Effect, Option, Queue, Schema, Stream } from "effect"
import { defineMessageUnion } from "foldkit/message"
import * as Mount from "foldkit/mount"

export const ClickOutsideMessage = defineMessageUnion({ ClickedOutside: { event: Schema.String } })
export type ClickOutsideMessage = typeof ClickOutsideMessage.Type

export type ClickOutsideOptions = {
  readonly events?: ReadonlyArray<string>
  readonly nodes?: ReadonlyArray<string>
  readonly capture?: boolean
}

export const defaultClickOutsideEvents = ["mousedown", "touchstart"]

const isNode = (target: EventTarget | null): target is Node => target instanceof Node

const detached = (target: EventTarget | null) => {
  const node = Option.getOrNull(Option.liftPredicate(target, isNode))
  if (document.body.contains(node)) return false

  return !(node instanceof Element && node.tagName === "HTML")
}

const insideAny = (path: ReadonlyArray<EventTarget>, nodes: ReadonlyArray<Element | null>) =>
  nodes.some((node) => node === null || path.includes(node))

const listen = (
  queue: Queue.Queue<ClickOutsideMessage, Cause.Done>,
  element: Element,
  args: { readonly events: ReadonlyArray<string>; readonly nodes: ReadonlyArray<string>; readonly capture: boolean }
) => {
  const listener = (event: Event) => {
    if (detached(event.target)) return
    const inside = args.nodes.length === 0 ? [element] : args.nodes.map((selector) => document.querySelector(selector))
    if (insideAny(event.composedPath(), inside)) return
    Queue.offerUnsafe(queue, ClickOutsideMessage.ClickedOutside({ event: event.type }))
  }
  args.events.forEach((name) => document.addEventListener(name, listener, args.capture))

  return () => args.events.forEach((name) => document.removeEventListener(name, listener, args.capture))
}

const ClickOutsideMount = Mount.defineStream("ClickOutside", {
  args: {
    events: Schema.Array(Schema.String),
    nodes: Schema.Array(Schema.String),
    capture: Schema.Boolean
  },
  messages: [ClickOutsideMessage.ClickedOutside],
  execute: ({ element, ...args }) =>
    Stream.callback<ClickOutsideMessage>((queue) =>
      Effect.acquireRelease(
        Effect.sync(() => listen(queue, element, args)),
        (stop) => Effect.sync(stop)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

export const clickOutside = (options: ClickOutsideOptions = {}) =>
  ClickOutsideMount({
    events: options.events ?? defaultClickOutsideEvents,
    nodes: options.nodes ?? [],
    capture: options.capture ?? false
  })
