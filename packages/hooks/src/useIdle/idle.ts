import { Duration, Effect, Stream } from "effect"

export const defaultIdleEvents = ["keydown", "mousemove", "touchmove", "click", "scroll", "wheel"]

export type IdleOptions = { readonly events?: ReadonlyArray<string> }

export const idleChanges = (
  target: EventTarget,
  timeout: Duration.Input,
  options: IdleOptions = {}
): Stream.Stream<boolean> => {
  const wait = Stream.fromEffect(Effect.sleep(timeout).pipe(Effect.as(true)))
  const activity = Stream.mergeAll(
    (options.events ?? defaultIdleEvents).map((name) => Stream.fromEventListener(target, name)),
    { concurrency: "unbounded" }
  )

  return Stream.merge(Stream.succeed("start" as const), activity).pipe(
    Stream.switchMap((event) => (event === "start" ? wait : Stream.concat(Stream.succeed(false), wait))),
    Stream.changes
  )
}
