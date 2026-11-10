import { Cause, Effect, Option, Queue, Schema, Stream } from "effect"
import * as Mount from "foldkit/mount"
import type { EventId } from "../events.ts"
import { DragTarget, Message } from "./interaction.ts"
import type { Resource } from "./interaction.ts"

const Gesture = Schema.Union([
  Message.StartedDrag,
  Message.StartedResize,
  Message.StartedSelect,
  Message.MovedPointer,
  Message.Released,
  Message.Cancelled,
  Message.DroppedExternal,
  Message.StartedDaySelect
])
type Gesture = typeof Gesture.Type

type Offer = (gesture: Gesture) => void

const dragThreshold = 4

const isHtmlElement = (element: Element): element is HTMLElement => element instanceof HTMLElement

const numberAt = (element: Element, name: string) => Number(element.getAttribute(name))

const closest = (target: EventTarget | null, selector: string): Option.Option<Element> =>
  target instanceof Element ? Option.fromNullishOr(target.closest(selector)) : Option.none()

const dragTargetOf = (owner: Element): DragTarget => {
  if (owner.closest("[data-all-day-row]") !== null) return "midnight"

  return owner.closest("[data-month-grid]") === null ? "slot" : "sameTime"
}

const storedTarget = (root: Element): DragTarget =>
  Schema.decodeUnknownSync(DragTarget)(root.getAttribute("data-press-target"))

const idOf = (element: Element, name: string, numeric: string): EventId => {
  const id = String(element.getAttribute(name))

  return element.hasAttribute(numeric) ? Number(id) : id
}

const gridsOf = (root: HTMLElement): ReadonlyArray<HTMLElement> =>
  Array.from(root.querySelectorAll("[data-time-grid]")).filter(isHtmlElement)

const contains = (element: Element, event: MouseEvent) => {
  const box = element.getBoundingClientRect()

  return (
    event.clientX >= box.left && event.clientX < box.right && event.clientY >= box.top && event.clientY < box.bottom
  )
}

const gridAt = (root: HTMLElement, event: MouseEvent): Option.Option<HTMLElement> => {
  const grids = gridsOf(root)
  const before = root.hasAttribute("data-horizontal")
    ? (grid: HTMLElement) => event.clientY < grid.getBoundingClientRect().bottom
    : (grid: HTMLElement) => event.clientX < grid.getBoundingClientRect().right

  return Option.fromNullishOr(grids.find((grid) => contains(grid, event)) ?? grids.find(before) ?? grids.at(-1))
}

const resourceOf = (grid: Element): Resource =>
  grid.hasAttribute("data-resource-id")
    ? Option.some(idOf(grid, "data-resource-id", "data-resource-numeric"))
    : Option.none()

const ratioAt = (grid: Element, event: MouseEvent) => {
  const box = grid.getBoundingClientRect()
  const horizontal = grid.hasAttribute("data-horizontal")
  const offset = horizontal ? event.clientX - box.left : event.clientY - box.top

  return Math.min(1, Math.max(0, offset / Math.max(1, horizontal ? box.width : box.height)))
}

const pointAt = (grid: Element, event: MouseEvent) => ({
  date: String(grid.getAttribute("data-date")),
  minutes: ratioAt(grid, event) * numberAt(grid, "data-grid-minutes"),
  resourceId: resourceOf(grid)
})

const cellAt = (root: HTMLElement, event: MouseEvent) =>
  Option.fromNullishOr(Array.from(root.querySelectorAll("[data-day-cell]")).find((cell) => contains(cell, event))).pipe(
    Option.map((cell) => ({ date: String(cell.getAttribute("data-date")), minutes: 0, resourceId: resourceOf(cell) }))
  )

const pointOf = (root: HTMLElement, event: MouseEvent) =>
  Option.orElse(cellAt(root, event), () => Option.map(gridAt(root, event), (grid) => pointAt(grid, event)))

const begin = (root: HTMLElement, event: PointerEvent) => {
  root.setAttribute("data-press-x", String(event.clientX))
  root.setAttribute("data-press-y", String(event.clientY))
  root.removeAttribute("data-moved")
}

const activate = (root: HTMLElement, event: PointerEvent, offer: Offer, gesture: Gesture) => {
  event.preventDefault()
  begin(root, event)
  root.setAttribute("data-interacting", "")
  offer(gesture)
}

const pressResize = (root: HTMLElement, event: PointerEvent, offer: Offer) =>
  Option.match(
    closest(event.target, "[data-resize-edge]").pipe(Option.filter(() => root.hasAttribute("data-resize"))),
    {
      onNone: () => false,
      onSome: (handle) => {
        const edge = handle.getAttribute("data-resize-edge") === "start" ? "start" : "end"
        const eventId = idOf(handle, "data-event-id", "data-event-numeric")
        activate(
          root,
          event,
          offer,
          Message.StartedResize({ eventId, edge, byDay: root.hasAttribute("data-day-resize") })
        )

        return true
      }
    }
  )

const pressEvent = (root: HTMLElement, event: PointerEvent) =>
  Option.match(closest(event.target, "[data-draggable]").pipe(Option.filter(() => root.hasAttribute("data-drag"))), {
    onNone: () => false,
    onSome: (owner) => {
      begin(root, event)
      root.setAttribute("data-press-event", String(owner.getAttribute("data-event-id")))
      root.toggleAttribute("data-press-numeric", owner.hasAttribute("data-event-numeric"))
      root.setAttribute("data-press-target", dragTargetOf(owner))

      return true
    }
  })

const pressSlot = (root: HTMLElement, event: PointerEvent, offer: Offer) =>
  Option.match(
    closest(event.target, "[data-time-grid] [data-time-slot]").pipe(
      Option.filter(() => root.hasAttribute("data-select")),
      Option.flatMap((slot) => closest(slot, "[data-time-grid]"))
    ),
    {
      onNone: () => false,
      onSome: (grid) => {
        activate(root, event, offer, Message.StartedSelect(pointAt(grid, event)))

        return true
      }
    }
  )

const pressDay = (root: HTMLElement, event: PointerEvent, offer: Offer) =>
  Option.map(
    closest(event.target, "[data-day-cell]").pipe(Option.filter(() => root.hasAttribute("data-select"))),
    (cell) =>
      activate(
        root,
        event,
        offer,
        Message.StartedDaySelect({ date: String(cell.getAttribute("data-date")), resourceId: resourceOf(cell) })
      )
  )

const press = (root: HTMLElement, offer: Offer) => (event: PointerEvent) => {
  if (event.button !== 0) return
  if (pressResize(root, event, offer)) return
  if (pressEvent(root, event)) return
  if (pressSlot(root, event, offer)) return
  pressDay(root, event, offer)
}

const travelled = (root: HTMLElement, event: PointerEvent) =>
  Math.hypot(event.clientX - numberAt(root, "data-press-x"), event.clientY - numberAt(root, "data-press-y"))

const startPendingDrag = (root: HTMLElement, event: PointerEvent, offer: Offer) => {
  if (travelled(root, event) <= dragThreshold) return
  const eventId = idOf(root, "data-press-event", "data-press-numeric")
  root.removeAttribute("data-press-event")
  root.setAttribute("data-interacting", "")
  root.setAttribute("data-moved", "")
  const target = storedTarget(root)
  Option.map(pointOf(root, event), (point) => offer(Message.StartedDrag({ eventId, target, ...point })))
}

const move = (root: HTMLElement, offer: Offer) => (event: PointerEvent) => {
  if (root.hasAttribute("data-press-event")) return startPendingDrag(root, event, offer)
  if (!root.hasAttribute("data-interacting")) return
  if (travelled(root, event) > dragThreshold) root.setAttribute("data-moved", "")
  Option.map(pointOf(root, event), (point) => offer(Message.MovedPointer(point)))
}

const finish = (root: HTMLElement, offer: Offer, gesture: Gesture) => () => {
  root.removeAttribute("data-press-event")
  if (!root.hasAttribute("data-interacting")) return
  root.removeAttribute("data-interacting")
  offer(gesture)
}

const escape = (root: HTMLElement, offer: Offer) => (event: KeyboardEvent) => {
  if (event.key !== "Escape") return
  finish(root, offer, Message.Cancelled())()
}

const transferData = (transfer: DataTransfer): Readonly<Record<string, string>> =>
  Object.fromEntries(transfer.types.map((type) => [type, transfer.getData(type)]))

const allowDrop = (root: HTMLElement) => (event: DragEvent) => {
  if (!root.hasAttribute("data-external")) return
  event.preventDefault()
}

const dropExternal = (root: HTMLElement, offer: Offer) => (event: DragEvent) => {
  if (!root.hasAttribute("data-external")) return
  if (event.dataTransfer === null) return
  event.preventDefault()
  const data = transferData(event.dataTransfer)
  Option.map(pointOf(root, event), (point) => offer(Message.DroppedExternal({ ...point, data })))
}

const swallowClick = (root: HTMLElement) => (event: MouseEvent) => {
  if (!root.hasAttribute("data-moved")) return
  root.removeAttribute("data-moved")
  event.stopPropagation()
  event.preventDefault()
}

const listen = <K extends keyof HTMLElementEventMap>(
  node: HTMLElement,
  type: K,
  listener: (event: HTMLElementEventMap[K]) => void,
  capture = false
) => {
  node.addEventListener(type, listener, capture)

  return () => node.removeEventListener(type, listener, capture)
}

const listenDocument = <K extends keyof DocumentEventMap>(
  owner: Document,
  type: K,
  listener: (event: DocumentEventMap[K]) => void
) => {
  owner.addEventListener(type, listener)

  return () => owner.removeEventListener(type, listener)
}

const offerTo =
  (queue: Queue.Queue<Gesture, Cause.Done>): Offer =>
  (gesture) => {
    Queue.offerUnsafe(queue, gesture)
  }

export const WatchTimeGrid = Mount.defineStream("ScheduleTimeGrid", {
  messages: [
    Message.StartedDrag,
    Message.StartedResize,
    Message.StartedSelect,
    Message.MovedPointer,
    Message.Released,
    Message.Cancelled,
    Message.DroppedExternal,
    Message.StartedDaySelect
  ],
  execute: ({ element }) =>
    Stream.callback<Gesture>((queue) =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const root = Option.getOrThrow(Option.liftPredicate(element, isHtmlElement))
          const offer = offerTo(queue)
          const owner = root.ownerDocument
          const cleanups = [
            listen(root, "pointerdown", press(root, offer)),
            listenDocument(owner, "pointermove", move(root, offer)),
            listenDocument(owner, "pointerup", finish(root, offer, Message.Released())),
            listenDocument(owner, "pointercancel", finish(root, offer, Message.Cancelled())),
            listenDocument(owner, "keydown", escape(root, offer)),
            listen(root, "click", swallowClick(root), true),
            listen(root, "dragover", allowDrop(root)),
            listen(root, "drop", dropExternal(root, offer))
          ]

          return () => cleanups.forEach((cleanup) => cleanup())
        }),
        (release) => Effect.sync(release)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

export type Gestures = {
  readonly drag: boolean
  readonly resize: boolean
  readonly select: boolean
  readonly external: boolean
}

const gestureNames = ["drag", "resize", "select", "external"] as const

export const gestureFlags = (gestures: Gestures): ReadonlyArray<string> => gestureNames.filter((name) => gestures[name])
