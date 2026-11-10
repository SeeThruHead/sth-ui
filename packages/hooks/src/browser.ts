import { Duration, Effect, Option, Stream } from "effect"
import { colorSchemeChanges, darkQuery } from "./useColorScheme/colorScheme.ts"
import type { ColorScheme } from "./useColorScheme/colorScheme.ts"
import { idleChanges } from "./useIdle/idle.ts"
import type { IdleOptions } from "./useIdle/idle.ts"
import { mediaQueryMatches } from "./useMediaQuery/mediaQuery.ts"
import { orientationChanges } from "./useOrientation/orientation.ts"
import type { Orientation } from "./useOrientation/orientation.ts"
import { eventsOf } from "./useWindowEvent/windowEvent.ts"
import { watch } from "./shared/watch.ts"
import { networkOf } from "./useNetwork/network.ts"
import type { Network } from "./useNetwork/network.ts"
import type { ScrollPosition } from "./useWindowScroll/scroll.ts"
import { hotkeysOn } from "@sth-ui/core/hooks/hotkey.ts"
import type { HotkeyItem, HotkeysOptions } from "@sth-ui/core/hooks/hotkey.ts"
import { pointOf } from "./useLongPress/longPress.ts"
import { headroom as headroomStart, headroomPinned, headroomStep, scrollDirectionOf } from "./useHeadroom/headroom.ts"
import type { HeadroomEvent } from "./useHeadroom/headroom.ts"
import { storageChangeEvent } from "./useLocalStorage/storage.ts"
import type { ListenerOptions } from "./useWindowEvent/windowEvent.ts"

export const windowEvent = <A extends Event = Event>(type: string, options: ListenerOptions = {}): Stream.Stream<A> =>
  eventsOf<A>(window, type, options)

export const mediaQuery = (query: string): Stream.Stream<boolean> => mediaQueryMatches(window.matchMedia(query))

export const colorScheme: Stream.Stream<ColorScheme> = Stream.suspend(() =>
  colorSchemeChanges(window.matchMedia(darkQuery))
)

export const idle = (timeout: Duration.Input, options: IdleOptions = {}): Stream.Stream<boolean> =>
  idleChanges(document, timeout, options)

export const orientation: Stream.Stream<Orientation> = Stream.suspend(() =>
  orientationChanges(window.screen.orientation)
)

export const reducedMotion: Stream.Stream<boolean> = Stream.suspend(() =>
  mediaQuery("(prefers-reduced-motion: reduce)")
)

export const hash: Stream.Stream<string> = Stream.suspend(() =>
  watch([[window, ["hashchange"]]], () => window.location.hash)
)

export const documentVisibility: Stream.Stream<DocumentVisibilityState> = Stream.suspend(() =>
  watch([[document, ["visibilitychange"]]], () => document.visibilityState)
)

export const pageLeave: Stream.Stream<Event> = Stream.suspend(() => eventsOf(document.documentElement, "mouseleave"))

export const windowScroll: Stream.Stream<ScrollPosition> = Stream.suspend(() =>
  watch([[window, ["scroll", "resize"]]], () => ({ x: window.scrollX, y: window.scrollY }))
)

const isEventTarget = (value: unknown): value is EventTarget => value instanceof EventTarget

export const network: Stream.Stream<Network> = Stream.suspend(() => {
  const connection = Reflect.get(navigator, "connection")

  return watch(
    [
      [window, ["online", "offline"]],
      ...Option.toArray(Option.liftPredicate(connection, isEventTarget)).map(
        (target): readonly [EventTarget, ReadonlyArray<string>] => [target, ["change"]]
      )
    ],
    () => networkOf(navigator.onLine, connection)
  )
})

export const hotkeys = (items: ReadonlyArray<HotkeyItem>, options: HotkeysOptions = {}): Stream.Stream<string> =>
  Stream.suspend(() => hotkeysOn(document.documentElement, items, options))

export const mousePosition: Stream.Stream<{ readonly x: number; readonly y: number }> = Stream.suspend(() =>
  eventsOf(document, "mousemove").pipe(Stream.map(pointOf))
)

export const textSelection: Stream.Stream<string> = Stream.suspend(() =>
  watch([[document, ["selectionchange"]]], () => String(document.getSelection()))
)

export const fullscreen: Stream.Stream<boolean> = Stream.suspend(() =>
  watch([[document, ["fullscreenchange", "fullscreenerror"]]], () => document.fullscreenElement !== null)
)

export const eyeDropperSupported = (): boolean => "EyeDropper" in window && !navigator.userAgent.includes("OPR")

type Scrolled =
  | { readonly _tag: "Scrolled"; readonly y: number }
  | { readonly _tag: "Resizing" }
  | { readonly _tag: "Resized" }

const scrolls: Stream.Stream<Scrolled> = Stream.suspend(() =>
  Stream.merge(
    eventsOf(window, "scroll").pipe(Stream.map((): Scrolled => ({ _tag: "Scrolled", y: window.scrollY }))),
    eventsOf(window, "resize").pipe(
      Stream.switchMap(() =>
        Stream.concat(
          Stream.succeed<Scrolled>({ _tag: "Resizing" }),
          Stream.fromEffect(Effect.sleep(Duration.millis(300)).pipe(Effect.as<Scrolled>({ _tag: "Resized" })))
        )
      )
    )
  )
)

type Direction = { readonly last: number; readonly resizing: boolean }

export const scrollDirection: Stream.Stream<"up" | "down"> = scrolls.pipe(
  Stream.mapAccum(
    (): Direction => ({ last: window.scrollY, resizing: false }),
    (state: Direction, event: Scrolled): readonly [Direction, ReadonlyArray<"up" | "down">] => {
      if (event._tag === "Resizing") return [{ ...state, resizing: true }, []]
      if (event._tag === "Resized") return [{ ...state, resizing: false }, []]
      if (state.resizing) return [state, []]

      return [{ ...state, last: event.y }, [scrollDirectionOf(state.last, event.y)]]
    }
  )
)

export type HeadroomChange = {
  readonly pinned: boolean
  readonly scrollProgress: number
  readonly events: ReadonlyArray<HeadroomEvent>
}

export const headroom = (options: { readonly fixedAt?: number; readonly scrollDistance?: number }) =>
  windowScroll.pipe(
    Stream.mapAccum(
      () => headroomStart,
      (state, position): readonly [typeof headroomStart, ReadonlyArray<HeadroomChange>] => {
        const [next, events] = headroomStep(state, position.y, { fixedAt: 0, scrollDistance: 100, ...options })

        return [next, [{ pinned: headroomPinned(next), scrollProgress: next.scrollProgress, events }]]
      }
    )
  )

export type StorageKind = "localStorage" | "sessionStorage"

export const storedValue = (kind: StorageKind, key: string): Stream.Stream<string | null> =>
  Stream.suspend(() => watch([[window, ["storage", storageChangeEvent(kind)]]], () => window[kind].getItem(key)))

export const viewportSize: Stream.Stream<{ readonly width: number; readonly height: number }> = Stream.suspend(() =>
  watch([[window, ["resize", "orientationchange"]]], () => ({ width: window.innerWidth, height: window.innerHeight }))
)
