import type { Cause } from "effect"
import { Effect, Option, Queue, Schema, Stream } from "effect"
import { defineMessageUnion } from "foldkit/message"
import * as Mount from "foldkit/mount"
import { hotkeysOn } from "@sth-ui/core/hooks/hotkey.ts"
import { longPressOn, pointOf } from "./useLongPress/longPress.ts"
import { movePosition, normalizeRadialValue, radialAngle, scrubOn } from "./useMove/scrub.ts"
import type { Point, Scrub } from "./useMove/scrub.ts"
import { dragOn } from "./useDrag/drag.ts"
import { rovingMove } from "./useRovingIndex/roving.ts"
import type { DragEvent } from "./useDrag/drag.ts"

export const ElementMessage = defineMessageUnion({
  HotkeyPressed: { hotkey: Schema.String },
  Pressed: { stage: Schema.Literals(["started", "longPressed", "finished", "cancelled"]) },
  MouseMoved: { x: Schema.Finite, y: Schema.Finite },
  FocusChanged: { focused: Schema.Boolean },
  Mutated: { types: Schema.Array(Schema.String) },
  Resized: {
    x: Schema.Finite,
    y: Schema.Finite,
    width: Schema.Finite,
    height: Schema.Finite,
    top: Schema.Finite,
    left: Schema.Finite,
    bottom: Schema.Finite,
    right: Schema.Finite
  },
  Intersected: { isIntersecting: Schema.Boolean, intersectionRatio: Schema.Finite },
  ScrubStarted: {},
  ScrubEnded: {},
  Moved: { x: Schema.Finite, y: Schema.Finite },
  Turned: { value: Schema.Finite },
  TurnEnded: { value: Schema.Finite },
  RovingFocused: { index: Schema.Int },
  Dragged: {
    xy: Schema.Tuple([Schema.Finite, Schema.Finite]),
    initial: Schema.Tuple([Schema.Finite, Schema.Finite]),
    movement: Schema.Tuple([Schema.Finite, Schema.Finite]),
    delta: Schema.Tuple([Schema.Finite, Schema.Finite]),
    distance: Schema.Tuple([Schema.Finite, Schema.Finite]),
    direction: Schema.Tuple([Schema.Finite, Schema.Finite]),
    velocity: Schema.Tuple([Schema.Finite, Schema.Finite]),
    elapsedTime: Schema.Finite,
    first: Schema.Boolean,
    last: Schema.Boolean,
    active: Schema.Boolean,
    tap: Schema.Boolean,
    canceled: Schema.Boolean
  }
})
export type ElementMessage = typeof ElementMessage.Type

const HotkeyMount = Mount.defineStream("HotkeyHandler", {
  args: { hotkeys: Schema.Array(Schema.String), preventDefault: Schema.Boolean, usePhysicalKeys: Schema.Boolean },
  messages: [ElementMessage.HotkeyPressed],
  execute: ({ element, hotkeys, preventDefault, usePhysicalKeys }) =>
    hotkeysOn(
      element,
      hotkeys.map((hotkey) => [hotkey, { preventDefault, usePhysicalKeys }] as const),
      { tagsToIgnore: [], triggerOnContentEditable: true }
    ).pipe(Stream.map((hotkey) => ElementMessage.HotkeyPressed({ hotkey })))
})

export const hotkeyHandler = (
  hotkeys: ReadonlyArray<string>,
  options: { readonly preventDefault?: boolean; readonly usePhysicalKeys?: boolean }
) => HotkeyMount({ hotkeys, preventDefault: true, usePhysicalKeys: false, ...options })

const LongPressMount = Mount.defineStream("LongPress", {
  args: {
    threshold: Schema.Finite,
    events: Schema.Array(Schema.Literals(["mouse", "touch"])),
    cancelOnMove: Schema.Union([Schema.Boolean, Schema.Finite])
  },
  messages: [ElementMessage.Pressed],
  execute: ({ element, threshold, events, cancelOnMove }) =>
    longPressOn(element, { threshold, events, cancelOnMove }).pipe(
      Stream.map((stage) => ElementMessage.Pressed({ stage }))
    )
})

export type LongPressMountOptions = {
  readonly threshold?: number
  readonly events?: ReadonlyArray<"mouse" | "touch">
  readonly cancelOnMove?: boolean | number
}

export const longPressDefaults = { threshold: 400, events: ["mouse", "touch"], cancelOnMove: false } as const

export const longPress = (options: LongPressMountOptions) => LongPressMount({ ...longPressDefaults, ...options })

const relative = (element: Element, event: Event) => {
  const box = element.getBoundingClientRect()
  const point = pointOf(event)

  return ElementMessage.MouseMoved({
    x: Math.max(0, Math.round(point.x - box.left)),
    y: Math.max(0, Math.round(point.y - box.top))
  })
}

const MouseMount = Mount.defineStream("Mouse", {
  args: { resetOnExit: Schema.Boolean },
  messages: [ElementMessage.MouseMoved],
  execute: ({ element, resetOnExit }) =>
    Stream.merge(
      Stream.fromEventListener<Event>(element, "mousemove").pipe(Stream.map((event) => relative(element, event))),
      Stream.fromEventListener<Event>(element, "mouseleave").pipe(
        Stream.filter(() => resetOnExit),
        Stream.map(() => ElementMessage.MouseMoved({ x: 0, y: 0 }))
      )
    )
})

export const mouse = (options: { readonly resetOnExit?: boolean }) => MouseMount({ resetOnExit: false, ...options })

const leaves = (element: Element, event: Event) => {
  const related = Reflect.get(event, "relatedTarget")

  return !(related instanceof Node && element.contains(related))
}

const FocusWithinMount = Mount.defineStream("FocusWithin", {
  args: {},
  messages: [ElementMessage.FocusChanged],
  execute: ({ element }) =>
    Stream.merge(
      Stream.fromEventListener<Event>(element, "focusin").pipe(Stream.map(() => true)),
      Stream.fromEventListener<Event>(element, "focusout").pipe(
        Stream.filter((event) => leaves(element, event)),
        Stream.map(() => false)
      )
    ).pipe(
      Stream.changes,
      Stream.map((focused) => ElementMessage.FocusChanged({ focused }))
    )
})

export const focusWithin = () => FocusWithinMount({})

type MutationOptions = {
  readonly childList: boolean
  readonly subtree: boolean
  readonly attributes: boolean
  readonly characterData: boolean
}

type Mutated = ReturnType<typeof ElementMessage.Mutated>

const observe = (queue: Queue.Queue<Mutated, Cause.Done>, element: Element, options: MutationOptions) => {
  const observer = new MutationObserver((records) =>
    Queue.offerUnsafe(queue, ElementMessage.Mutated({ types: records.map((record) => record.type) }))
  )
  observer.observe(element, options)

  return observer
}

const MutationMount = Mount.defineStream("MutationObserver", {
  args: {
    childList: Schema.Boolean,
    subtree: Schema.Boolean,
    attributes: Schema.Boolean,
    characterData: Schema.Boolean
  },
  messages: [ElementMessage.Mutated],
  execute: ({ element, ...options }) =>
    Stream.callback<Mutated>((queue) =>
      Effect.acquireRelease(
        Effect.sync(() => observe(queue, element, options)),
        (observer) => Effect.sync(() => observer.disconnect())
      )
    )
})

export const mutationObserver = (options: Partial<MutationOptions>) =>
  MutationMount({ childList: false, subtree: false, attributes: false, characterData: false, ...options })

type Resized = ReturnType<typeof ElementMessage.Resized>

const resizing = (queue: Queue.Queue<Resized, Cause.Done>, element: Element) => {
  const observer = new ResizeObserver((entries) =>
    entries.forEach(({ contentRect }) =>
      Queue.offerUnsafe(
        queue,
        ElementMessage.Resized({
          x: contentRect.x,
          y: contentRect.y,
          width: contentRect.width,
          height: contentRect.height,
          top: contentRect.top,
          left: contentRect.left,
          bottom: contentRect.bottom,
          right: contentRect.right
        })
      )
    )
  )
  observer.observe(element)

  return observer
}

const ResizeMount = Mount.defineStream("ResizeObserver", {
  args: {},
  messages: [ElementMessage.Resized],
  execute: ({ element }) =>
    Stream.callback<Resized>((queue) =>
      Effect.acquireRelease(
        Effect.sync(() => resizing(queue, element)),
        (observer) => Effect.sync(() => observer.disconnect())
      )
    )
})

export const resizeObserver = () => ResizeMount({})

type Intersected = ReturnType<typeof ElementMessage.Intersected>

const intersecting = (
  queue: Queue.Queue<Intersected, Cause.Done>,
  element: Element,
  options: { readonly rootMargin: string; readonly threshold: ReadonlyArray<number> }
) => {
  const observer = new IntersectionObserver(
    (entries) =>
      entries
        .slice(-1)
        .forEach(({ isIntersecting, intersectionRatio }) =>
          Queue.offerUnsafe(queue, ElementMessage.Intersected({ isIntersecting, intersectionRatio }))
        ),
    { rootMargin: options.rootMargin, threshold: [...options.threshold] }
  )
  observer.observe(element)

  return observer
}

const IntersectionMount = Mount.defineStream("IntersectionObserver", {
  args: { rootMargin: Schema.String, threshold: Schema.Array(Schema.Finite) },
  messages: [ElementMessage.Intersected],
  execute: ({ element, ...options }) =>
    Stream.callback<Intersected>((queue) =>
      Effect.acquireRelease(
        Effect.sync(() => intersecting(queue, element, options)),
        (observer) => Effect.sync(() => observer.disconnect())
      )
    )
})

export const intersection = (options: { readonly rootMargin?: string; readonly threshold?: ReadonlyArray<number> }) =>
  IntersectionMount({ rootMargin: "0px", threshold: [0], ...options })

type MoveMessage = ReturnType<
  typeof ElementMessage.ScrubStarted | typeof ElementMessage.ScrubEnded | typeof ElementMessage.Moved
>

type TurnMessage = ReturnType<
  | typeof ElementMessage.ScrubStarted
  | typeof ElementMessage.ScrubEnded
  | typeof ElementMessage.Turned
  | typeof ElementMessage.TurnEnded
>

const moved = (element: Element, point: Point, dir: "ltr" | "rtl"): ReadonlyArray<MoveMessage> =>
  Option.toArray(
    Option.map(movePosition(point, element.getBoundingClientRect(), dir), ({ x, y }) => ElementMessage.Moved({ x, y }))
  )

const moveMessages =
  (element: Element, dir: "ltr" | "rtl") =>
  (scrub: Scrub): ReadonlyArray<MoveMessage> => {
    if (scrub.stage === "start") return [ElementMessage.ScrubStarted(), ...moved(element, scrub.point, dir)]
    if (scrub.stage === "move") return moved(element, scrub.point, dir)

    return [ElementMessage.ScrubEnded()]
  }

const MoveMount = Mount.defineStream("Move", {
  args: { dir: Schema.Literals(["ltr", "rtl"]) },
  messages: [ElementMessage.ScrubStarted, ElementMessage.ScrubEnded, ElementMessage.Moved],
  execute: ({ element, dir }) =>
    scrubOn(element, document).pipe(Stream.flatMap((scrub) => Stream.fromIterable(moveMessages(element, dir)(scrub))))
})

export const move = (options: { readonly dir?: "ltr" | "rtl" }) => MoveMount({ dir: "ltr", ...options })

const turnMessages =
  (element: Element, step: number) =>
  (scrub: Scrub): ReadonlyArray<TurnMessage> => {
    const value = normalizeRadialValue(radialAngle(scrub.point, element.getBoundingClientRect()), step)
    if (scrub.stage === "start") return [ElementMessage.ScrubStarted(), ElementMessage.Turned({ value })]
    if (scrub.stage === "move") return [ElementMessage.Turned({ value })]

    return [ElementMessage.Turned({ value }), ElementMessage.TurnEnded({ value }), ElementMessage.ScrubEnded()]
  }

const RadialMoveMount = Mount.defineStream("RadialMove", {
  args: { step: Schema.Finite },
  messages: [ElementMessage.ScrubStarted, ElementMessage.ScrubEnded, ElementMessage.Turned, ElementMessage.TurnEnded],
  execute: ({ element, step }) =>
    scrubOn(element, document).pipe(Stream.flatMap((scrub) => Stream.fromIterable(turnMessages(element, step)(scrub))))
})

export const radialMove = (options: { readonly step?: number }) => RadialMoveMount({ step: 0.01, ...options })

const selectable = (event: DragEvent) =>
  event.active
    ? document.body.style.setProperty("user-select", "none")
    : document.body.style.removeProperty("user-select")

const DragMount = Mount.defineStream("Drag", {
  args: {
    axis: Schema.Literals(["x", "y", "lock", "both"]),
    axisThreshold: Schema.Finite,
    filterTaps: Schema.Boolean,
    tapThreshold: Schema.Finite,
    threshold: Schema.Tuple([Schema.Finite, Schema.Finite])
  },
  messages: [ElementMessage.Dragged],
  execute: ({ element, axis, ...options }) =>
    dragOn(element, document, { ...options, axis }).pipe(
      Stream.tap((event) => Effect.sync(() => selectable(event))),
      Stream.map((event) => ElementMessage.Dragged(event))
    )
})

export const drag = (options: {
  readonly axis?: "x" | "y" | "lock" | "both"
  readonly axisThreshold?: number
  readonly filterTaps?: boolean
  readonly tapThreshold?: number
  readonly threshold?: readonly [number, number]
}) => DragMount({ axis: "both", axisThreshold: 1, filterTaps: false, tapThreshold: 3, threshold: [0, 0], ...options })

type RovingFocused = ReturnType<typeof ElementMessage.RovingFocused>

type RovingArgs = {
  readonly orientation: "horizontal" | "vertical" | "both"
  readonly loop: boolean
  readonly dir: "ltr" | "rtl"
  readonly columns: number
  readonly activateOnFocus: boolean
}

const itemsOf = (element: Element) => Array.from(element.querySelectorAll<HTMLElement>("[data-roving-index]"))

const isElement = (value: EventTarget | null): value is Element => value instanceof Element

const indexOf = (target: EventTarget | null) =>
  Option.map(
    Option.flatMap(Option.liftPredicate(target, isElement), (element) =>
      Option.fromNullishOr(element.closest<HTMLElement>("[data-roving-index]"))
    ),
    (item) => Number(item.dataset["rovingIndex"])
  )

const roving = (queue: Queue.Queue<RovingFocused, Cause.Done>, element: Element, args: RovingArgs) => {
  const focus = (index: number) => {
    Option.map(
      Option.fromNullishOr(itemsOf(element).find((each) => each.dataset["rovingIndex"] === String(index))),
      (item) => {
        item.focus()
        if (args.activateOnFocus) item.click()
      }
    )
    Queue.offerUnsafe(queue, ElementMessage.RovingFocused({ index }))
  }
  const onKey = (event: Event) => {
    const items = itemsOf(element)
    const disabled = (index: number) =>
      items.some(
        (item) => item.dataset["rovingIndex"] === String(index) && item.getAttribute("aria-disabled") === "true"
      )
    const key = { key: String(Reflect.get(event, "key")), ctrlKey: Reflect.get(event, "ctrlKey") === true }
    Option.map(
      Option.flatMap(indexOf(event.target), (current) =>
        rovingMove(key, current, { ...args, total: items.length, isItemDisabled: disabled })
      ),
      (next) => {
        event.preventDefault()
        focus(next)
      }
    )
  }
  const onClick = (event: Event) =>
    Option.map(indexOf(event.target), (index) => Queue.offerUnsafe(queue, ElementMessage.RovingFocused({ index })))
  element.addEventListener("keydown", onKey)
  element.addEventListener("click", onClick)

  return () => {
    element.removeEventListener("keydown", onKey)
    element.removeEventListener("click", onClick)
  }
}

const RovingMount = Mount.defineStream("RovingIndex", {
  args: {
    orientation: Schema.Literals(["horizontal", "vertical", "both"]),
    loop: Schema.Boolean,
    dir: Schema.Literals(["ltr", "rtl"]),
    columns: Schema.Int,
    activateOnFocus: Schema.Boolean
  },
  messages: [ElementMessage.RovingFocused],
  execute: ({ element, ...args }) =>
    Stream.callback<RovingFocused>((queue) =>
      Effect.acquireRelease(
        Effect.sync(() => roving(queue, element, args)),
        (stop) => Effect.sync(stop)
      )
    )
})

export const rovingIndex = (options: Partial<RovingArgs>) =>
  RovingMount({ orientation: "horizontal", loop: true, dir: "ltr", columns: 0, activateOnFocus: false, ...options })
