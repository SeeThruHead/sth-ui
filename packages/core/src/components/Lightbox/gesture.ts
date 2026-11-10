import { Cause, Effect, Option, Queue, Schema, Stream } from "effect"
import * as Mount from "foldkit/mount"
import { syncPageLock } from "../Modal/ModalBase.ts"
import { Message } from "./model.ts"

const textEntry = 'input, textarea, select, video, audio, [contenteditable]:not([contenteditable="false"])'

const slideWidget = [
  "button",
  "a[href]",
  '[role="button"]',
  '[role="link"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="slider"]',
  '[role="spinbutton"]',
  '[role="switch"]',
  '[role="tab"]',
  '[role="textbox"]',
  '[role="combobox"]',
  '[role="listbox"]',
  '[role="menu"]',
  '[role="tablist"]'
].join(", ")

const handledKeys = ["Escape", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "f", "F", "t", "T", "z", "Z"]

const isHtmlElement = (element: Element): element is HTMLElement => element instanceof HTMLElement

const ignoredTarget = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return false
  if (target.closest(textEntry) !== null) return true

  return target.closest("[data-lightbox-slide]") !== null && target.closest(slideWidget) !== null
}

const ignored = (event: KeyboardEvent) => {
  if (event.defaultPrevented) return true
  if (event.key === "Escape") return false
  if (event.ctrlKey || event.metaKey || event.altKey) return true

  return ignoredTarget(event.target)
}

const Lifecycle = Schema.Union([Message.PressedKey, Message.FullscreenChanged])
type Lifecycle = typeof Lifecycle.Type

const keyListener = (queue: Queue.Queue<Lifecycle, Cause.Done>) => (event: KeyboardEvent) => {
  if (!handledKeys.includes(event.key)) return
  if (ignored(event)) return
  if (event.key === "Escape" || event.key === "ArrowLeft" || event.key === "ArrowRight") event.preventDefault()
  Queue.offerUnsafe(queue, Message.PressedKey({ key: event.key }))
}

const fullscreenListener = (queue: Queue.Queue<Lifecycle, Cause.Done>) => () => {
  Queue.offerUnsafe(queue, Message.FullscreenChanged({ fullscreen: document.fullscreenElement !== null }))
}

export const WatchLightbox = Mount.defineStream("LightboxLifecycle", {
  messages: [Message.PressedKey, Message.FullscreenChanged],
  execute: ({ element }) =>
    Stream.callback<Lifecycle>((queue) =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const onKey = keyListener(queue)
          const onFullscreen = fullscreenListener(queue)
          const lock = new MutationObserver(syncPageLock)
          syncPageLock()
          lock.observe(element, { attributes: true, attributeFilter: ["data-opened"] })
          document.addEventListener("keydown", onKey)
          document.addEventListener("fullscreenchange", onFullscreen)

          return () => {
            document.removeEventListener("keydown", onKey)
            document.removeEventListener("fullscreenchange", onFullscreen)
            lock.disconnect()
            element.removeAttribute("data-opened")
            syncPageLock()
          }
        }),
        (release) => Effect.sync(release)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

const ImageMessage = Schema.Union([
  Message.MeasuredImage,
  Message.Wheeled,
  Message.PanStarted,
  Message.PanMoved,
  Message.PanEnded
])
type ImageMessage = typeof ImageMessage.Type

const offerTo =
  <A>(queue: Queue.Queue<A, Cause.Done>) =>
  (message: A): void => {
    Queue.offerUnsafe(queue, message)
  }

const wheeled = (image: HTMLElement, offer: (message: ImageMessage) => void) => (event: WheelEvent) => {
  if (event.deltaY === 0) return
  event.preventDefault()
  const rect = image.getBoundingClientRect()
  offer(
    Message.Wheeled({
      deltaY: event.deltaY,
      offsetX: event.clientX - (rect.left + rect.width / 2),
      offsetY: event.clientY - (rect.top + rect.height / 2)
    })
  )
}

const panStarted = (image: HTMLElement, offer: (message: ImageMessage) => void) => (event: PointerEvent) => {
  image.setAttribute("data-panning", "")
  offer(Message.PanStarted({ x: event.clientX, y: event.clientY }))
}

const panMoved = (image: HTMLElement, offer: (message: ImageMessage) => void) => (event: PointerEvent) => {
  if (!image.hasAttribute("data-panning")) return
  offer(Message.PanMoved({ x: event.clientX, y: event.clientY }))
}

const panEnded = (image: HTMLElement, offer: (message: ImageMessage) => void) => () => {
  if (!image.hasAttribute("data-panning")) return
  image.removeAttribute("data-panning")
  offer(Message.PanEnded())
}

export const WatchImage = Mount.defineStream("LightboxImage", {
  messages: [Message.MeasuredImage, Message.Wheeled, Message.PanStarted, Message.PanMoved, Message.PanEnded],
  execute: ({ element }) =>
    Stream.callback<ImageMessage>((queue) =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const image = Option.getOrThrow(Option.liftPredicate(element, isHtmlElement))
          const offer = offerTo(queue)
          const measure = () =>
            offer(Message.MeasuredImage({ size: { width: image.offsetWidth, height: image.offsetHeight } }))
          const resized = new ResizeObserver(measure)
          const onWheel = wheeled(image, offer)
          const onDown = panStarted(image, offer)
          const onMove = panMoved(image, offer)
          const onUp = panEnded(image, offer)
          resized.observe(image)
          image.addEventListener("wheel", onWheel, { passive: false })
          image.addEventListener("pointerdown", onDown)
          document.addEventListener("pointermove", onMove)
          document.addEventListener("pointerup", onUp)
          document.addEventListener("pointercancel", onUp)

          return () => {
            resized.disconnect()
            image.removeEventListener("wheel", onWheel)
            image.removeEventListener("pointerdown", onDown)
            document.removeEventListener("pointermove", onMove)
            document.removeEventListener("pointerup", onUp)
            document.removeEventListener("pointercancel", onUp)
          }
        }),
        (release) => Effect.sync(release)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

const swipeThreshold = 100

const touchPoint = (event: TouchEvent) =>
  Option.map(Option.fromNullishOr(event.changedTouches[0]), (touch) => ({ x: touch.clientX, y: touch.clientY }))

const swipeStart = (region: HTMLElement) => (event: TouchEvent) =>
  Option.map(touchPoint(event), (point) => region.setAttribute("data-swipe-start", `${point.x},${point.y}`))

const swipedDown = (start: string, point: { readonly x: number; readonly y: number }) => {
  const [x, y] = start.split(",").map(Number)
  const dy = point.y - Number(y)

  return dy > swipeThreshold && Math.abs(dy) > Math.abs(point.x - Number(x))
}

const swipeEnd =
  (region: HTMLElement, queue: Queue.Queue<typeof Message.SwipedDown.Type, Cause.Done>) => (event: TouchEvent) => {
    const start = region.getAttribute("data-swipe-start")
    region.removeAttribute("data-swipe-start")
    if (start === null) return
    if (!Option.exists(touchPoint(event), (point) => swipedDown(start, point))) return
    Queue.offerUnsafe(queue, Message.SwipedDown())
  }

export const WatchSwipe = Mount.defineStream("LightboxSwipe", {
  messages: [Message.SwipedDown],
  execute: ({ element }) =>
    Stream.callback<typeof Message.SwipedDown.Type>((queue) =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const region = Option.getOrThrow(Option.liftPredicate(element, isHtmlElement))
          const onStart = swipeStart(region)
          const onEnd = swipeEnd(region, queue)
          region.addEventListener("touchstart", onStart, { passive: true })
          region.addEventListener("touchend", onEnd)

          return () => {
            region.removeEventListener("touchstart", onStart)
            region.removeEventListener("touchend", onEnd)
          }
        }),
        (release) => Effect.sync(release)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})
