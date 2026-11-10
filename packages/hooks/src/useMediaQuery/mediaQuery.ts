import { Effect, Stream } from "effect"

export type MediaQuerySource = EventTarget & { readonly matches: boolean }

export const mediaQueryMatches = (list: MediaQuerySource): Stream.Stream<boolean> =>
  Stream.concat(
    Stream.fromEffect(Effect.sync(() => list.matches)),
    Stream.fromEventListener<MediaQueryListEvent>(list, "change").pipe(Stream.map((event) => event.matches))
  )
