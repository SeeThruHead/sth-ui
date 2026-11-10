import { Cause, Effect, Option, Queue, Schema, Stream } from "effect"
import * as Mount from "foldkit/mount"
import { Message } from "./model.ts"

const Gesture = Schema.Union([Message.Measured, Message.DragMoved, Message.DragEnded])
type Gesture = typeof Gesture.Type

const isHtmlElement = (element: Element): element is HTMLElement => element instanceof HTMLElement

const flickWindow = 170

const dragThreshold = 10

const focusNodes = ["INPUT", "SELECT", "TEXTAREA"]

const numberAt = (element: Element, name: string) => Number(element.getAttribute(name) ?? "0")

const pointOf = (event: PointerEvent, vertical: boolean) => (vertical ? event.clientY : event.clientX)

const slidesOf = (container: Element): ReadonlyArray<HTMLElement> =>
  Array.from(container.children).filter(isHtmlElement)

const containerOf = (viewport: HTMLElement): HTMLElement =>
  Option.fromNullishOr(viewport.firstElementChild).pipe(Option.filter(isHtmlElement), Option.getOrThrow)

const endGapOf = (slides: ReadonlyArray<HTMLElement>, vertical: boolean) =>
  slides
    .slice(-1)
    .map((slide) => parseFloat(getComputedStyle(slide).getPropertyValue(vertical ? "margin-bottom" : "margin-right")))
    .reduce((_, gap) => gap, 0)

const measure = (viewport: HTMLElement, vertical: boolean) => {
  const slides = slidesOf(containerOf(viewport))
  const endGap = endGapOf(slides, vertical)

  return Message.Measured({
    layout: {
      view: vertical ? viewport.clientHeight : viewport.clientWidth,
      endGap,
      slides: slides.map((slide) => ({
        start: vertical ? slide.offsetTop : slide.offsetLeft,
        size: vertical ? slide.offsetHeight : slide.offsetWidth
      }))
    }
  })
}

const startDrag = (viewport: HTMLElement, vertical: boolean) => (event: PointerEvent) => {
  if (event.button !== 0) return
  if (event.target instanceof Element && focusNodes.includes(event.target.nodeName)) return
  const point = String(pointOf(event, vertical))
  viewport.setAttribute("data-drag-origin", point)
  viewport.setAttribute("data-drag-window", point)
  viewport.setAttribute("data-drag-window-time", String(event.timeStamp))
  viewport.setAttribute("data-drag-last-time", String(event.timeStamp))
  viewport.removeAttribute("data-dragging")
  viewport.removeAttribute("data-dragged")
}

const followDrag =
  (viewport: HTMLElement, vertical: boolean, offer: (gesture: Gesture) => void) => (event: PointerEvent) => {
    if (!viewport.hasAttribute("data-drag-origin")) return
    const point = pointOf(event, vertical)
    const delta = point - numberAt(viewport, "data-drag-origin")
    if (delta === 0) return
    if (Math.abs(delta) > dragThreshold) viewport.setAttribute("data-dragged", "")
    viewport.setAttribute("data-dragging", "")
    viewport.setAttribute("data-drag-last-time", String(event.timeStamp))
    if (event.timeStamp - numberAt(viewport, "data-drag-window-time") > flickWindow) {
      viewport.setAttribute("data-drag-window", String(point))
      viewport.setAttribute("data-drag-window-time", String(event.timeStamp))
    }
    offer(Message.DragMoved({ delta }))
  }

const velocityOf = (viewport: HTMLElement, event: PointerEvent, vertical: boolean) => {
  if (event.timeStamp - numberAt(viewport, "data-drag-last-time") > flickWindow) return 0
  const elapsed = Math.max(1, event.timeStamp - numberAt(viewport, "data-drag-window-time"))
  const velocity = (pointOf(event, vertical) - numberAt(viewport, "data-drag-window")) / elapsed

  return Math.abs(velocity) > 0.1 ? velocity : 0
}

const endDrag =
  (viewport: HTMLElement, vertical: boolean, offer: (gesture: Gesture) => void) => (event: PointerEvent) => {
    const dragging = viewport.hasAttribute("data-dragging")
    const velocity = velocityOf(viewport, event, vertical)
    viewport.removeAttribute("data-drag-origin")
    viewport.removeAttribute("data-dragging")
    if (!dragging) return
    offer(Message.DragEnded({ velocity, pointer: event.pointerType === "mouse" ? "mouse" : "touch" }))
  }

const swallowClick = (viewport: HTMLElement) => (event: MouseEvent) => {
  if (!viewport.hasAttribute("data-dragged")) return
  viewport.removeAttribute("data-dragged")
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

const listenDocument = <K extends keyof DocumentEventMap>(type: K, listener: (event: DocumentEventMap[K]) => void) => {
  document.addEventListener(type, listener)

  return () => document.removeEventListener(type, listener)
}

const offerTo =
  (queue: Queue.Queue<Gesture, Cause.Done>) =>
  (gesture: Gesture): void => {
    Queue.offerUnsafe(queue, gesture)
  }

export const WatchCarousel = Mount.defineStream("CarouselWatch", {
  args: { vertical: Schema.Boolean, draggable: Schema.Boolean },
  messages: [Message.Measured, Message.DragMoved, Message.DragEnded],
  execute: ({ element, vertical, draggable }) =>
    Stream.callback<Gesture>((queue) =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const viewport = Option.getOrThrow(Option.liftPredicate(element, isHtmlElement))
          const offer = offerTo(queue)
          const report = () => offer(measure(viewport, vertical))
          const resized = new ResizeObserver(report)
          const observeAll = () => {
            resized.disconnect()
            resized.observe(viewport)
            slidesOf(containerOf(viewport)).forEach((slide) => resized.observe(slide))
          }
          const changed = new MutationObserver(() => {
            observeAll()
            report()
          })
          observeAll()
          changed.observe(containerOf(viewport), { childList: true })
          const cleanups = draggable
            ? [
                listen(viewport, "pointerdown", startDrag(viewport, vertical)),
                listenDocument("pointermove", followDrag(viewport, vertical, offer)),
                listenDocument("pointerup", endDrag(viewport, vertical, offer)),
                listenDocument("pointercancel", endDrag(viewport, vertical, offer)),
                listen(viewport, "click", swallowClick(viewport), true),
                listen(viewport, "dragstart", (event) => event.preventDefault())
              ]
            : []

          return () => {
            cleanups.forEach((cleanup) => cleanup())
            resized.disconnect()
            changed.disconnect()
          }
        }),
        (release) => Effect.sync(release)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})
