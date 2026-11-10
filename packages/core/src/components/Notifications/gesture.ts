import { Cause, Effect, Option, Queue, Schema, Stream } from "effect"
import * as Mount from "foldkit/mount"
import { Message } from "./model.ts"
import { shouldDismiss } from "./queue.ts"

const Gesture = Schema.Union([Message.DragMoved, Message.DragEnded, Message.Measured])
type Gesture = typeof Gesture.Type

type Outside = typeof Message.Pinned.Type

const isHtmlElement = (element: Element): element is HTMLElement => element instanceof HTMLElement

const threshold = 5

const scrollReset = 120

const numberAt = (element: HTMLElement, name: string) => Number(element.getAttribute(name) ?? "0")

const startDrag = (element: HTMLElement) => (event: PointerEvent) => {
  if (event.button !== 0) return
  element.setAttribute("data-drag-x", String(event.clientX))
  element.setAttribute("data-drag-time", String(event.timeStamp))
  element.removeAttribute("data-dragging")
}

const listen = <K extends keyof HTMLElementEventMap>(
  node: HTMLElement,
  type: K,
  listener: (event: HTMLElementEventMap[K]) => void,
  options: AddEventListenerOptions = {}
) => {
  node.addEventListener(type, listener, options)

  return () => node.removeEventListener(type, listener, options)
}

const followDrag = (element: HTMLElement, offer: (message: Gesture) => void, id: string) => (event: PointerEvent) => {
  if (!element.hasAttribute("data-drag-x")) return
  const movement = event.clientX - numberAt(element, "data-drag-x")
  if (element.hasAttribute("data-dragging")) return offer(Message.DragMoved({ id, offset: movement }))
  if (Math.abs(movement) <= threshold) return
  element.setAttribute("data-dragging", "")
  element.setPointerCapture(event.pointerId)
  offer(Message.DragMoved({ id, offset: movement }))
}

const endDrag = (element: HTMLElement, offer: (message: Gesture) => void, id: string) => (event: PointerEvent) => {
  const dragging = element.hasAttribute("data-dragging")
  const movement = event.type === "pointercancel" ? 0 : event.clientX - numberAt(element, "data-drag-x")
  const elapsed = Math.max(1, event.timeStamp - numberAt(element, "data-drag-time"))
  element.removeAttribute("data-drag-x")
  element.removeAttribute("data-dragging")
  if (!dragging) return
  offer(Message.DragEnded({ id, movement, velocity: Math.abs(movement) / elapsed, width: element.offsetWidth }))
}

const horizontal = (event: WheelEvent) => event.deltaX !== 0 && Math.abs(event.deltaX) > Math.abs(event.deltaY)

const scroll = (element: HTMLElement, offer: (message: Gesture) => void, id: string) => (event: WheelEvent) => {
  if (!horizontal(event)) return
  event.preventDefault()
  window.clearTimeout(numberAt(element, "data-scroll-timer"))
  const offset = numberAt(element, "data-scroll-offset") - event.deltaX
  const end = () => {
    element.removeAttribute("data-scroll-offset")
    element.removeAttribute("data-scroll-timer")
    offer(Message.DragEnded({ id, movement: offset, velocity: 0, width: element.offsetWidth }))
  }
  if (shouldDismiss(offset, 0, element.offsetWidth)) return end()
  element.setAttribute("data-scroll-offset", String(offset))
  element.setAttribute("data-scroll-timer", String(window.setTimeout(end, scrollReset)))
  offer(Message.DragMoved({ id, offset }))
}

const offerTo =
  (queue: Queue.Queue<Gesture, Cause.Done>) =>
  (message: Gesture): void => {
    Queue.offerUnsafe(queue, message)
  }

const inside = (element: Element, target: EventTarget | null) => target instanceof Node && element.contains(target)

const pressedOutside = (element: Element, queue: Queue.Queue<Outside, Cause.Done>) => (event: PointerEvent) => {
  if (!element.hasAttribute("data-pinned")) return
  if (inside(element, event.target)) return
  Queue.offerUnsafe(queue, Message.Pinned({ position: Option.none() }))
}

export const WatchGesture = Mount.defineStream("NotificationsGesture", {
  args: { id: Schema.String, drag: Schema.Boolean, scroll: Schema.Boolean },
  messages: [Message.DragMoved, Message.DragEnded, Message.Measured],
  execute: ({ element, id, drag, scroll: wheel }) =>
    Stream.callback<Gesture>((queue) =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const node = Option.getOrThrow(Option.liftPredicate(element, isHtmlElement))
          const offer = offerTo(queue)
          const measure = () => offer(Message.Measured({ id, height: node.offsetHeight }))
          const observer = new ResizeObserver(measure)
          const start = startDrag(node)
          const follow = followDrag(node, offer, id)
          const end = endDrag(node, offer, id)
          const wheeled = scroll(node, offer, id)
          observer.observe(node)
          const cleanups = [
            ...(drag
              ? [
                  listen(node, "pointerdown", start),
                  listen(node, "pointermove", follow),
                  listen(node, "pointerup", end),
                  listen(node, "pointercancel", end)
                ]
              : []),
            ...(wheel ? [listen(node, "wheel", wheeled, { passive: false })] : [])
          ]

          return () => {
            cleanups.forEach((cleanup) => cleanup())
            observer.disconnect()
            window.clearTimeout(numberAt(node, "data-scroll-timer"))
          }
        }),
        (cleanup) => Effect.sync(cleanup)
      ).pipe(Effect.andThen(Effect.never))
    )
})

export const WatchOutside = Mount.defineStream("NotificationsOutside", {
  messages: [Message.Pinned],
  execute: ({ element }) =>
    Stream.callback<Outside>((queue) =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const pressed = pressedOutside(element, queue)
          document.addEventListener("pointerdown", pressed)

          return () => document.removeEventListener("pointerdown", pressed)
        }),
        (cleanup) => Effect.sync(cleanup)
      ).pipe(Effect.andThen(Effect.never))
    )
})
