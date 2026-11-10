import { Stream } from "effect"

export type ListenerOptions = { readonly capture?: boolean; readonly passive?: boolean; readonly once?: boolean }

export const eventsOf = <A extends Event = Event>(
  target: EventTarget,
  type: string,
  options: ListenerOptions = {}
): Stream.Stream<A> => Stream.fromEventListener<A>(target, type, options)
