import type { Cause } from "effect"
import { Effect, MutableRef, Option, Queue, Stream } from "effect"

export type Point = { readonly x: number; readonly y: number }

export type Rect = { readonly left: number; readonly top: number; readonly width: number; readonly height: number }

export type Scrub = { readonly stage: "start" | "move" | "end"; readonly point: Point }

const field = (value: unknown, name: string): unknown => Reflect.get(Object(value), name)

export const scrubPoint = (event: unknown): Point => {
  const touch = field(field(event, "changedTouches"), "0")
  const source = touch === undefined ? event : touch

  return { x: Number(field(source, "clientX")), y: Number(field(source, "clientY")) }
}

const clamp = (value: number) => Math.min(Math.max(value, 0), 1)

export const movePosition = (point: Point, rect: Rect, dir: "ltr" | "rtl"): Option.Option<Point> => {
  if (rect.width === 0) return Option.none()
  if (rect.height === 0) return Option.none()
  const x = clamp((point.x - rect.left) / rect.width)

  return Option.some({ x: dir === "ltr" ? x : 1 - x, y: clamp((point.y - rect.top) / rect.height) })
}

export const radialAngle = (point: Point, rect: Rect): number => {
  const x = point.x - (rect.left + rect.width / 2)
  const y = point.y - (rect.top + rect.height / 2)

  return 360 - ((Math.atan2(x, y) * 180) / Math.PI + 180)
}

const decimals = (value: number) => (value.toString().split(".")[1] ?? "").length

export const normalizeRadialValue = (degree: number, step: number): number => {
  const clamped = Math.min(Math.max(degree, 0), 360)
  const high = Math.ceil(clamped / step) * step
  const value = high === 360 ? 0 : high

  return Number.parseFloat(value.toFixed(decimals(step)))
}

const cancel = (event: Event) => {
  if (event.cancelable) event.preventDefault()
}

const scrubbing = (queue: Queue.Queue<Scrub, Cause.Done>, element: EventTarget, page: EventTarget) => {
  const active = MutableRef.make(false)
  const offer = (stage: Scrub["stage"], event: Event) => Queue.offerUnsafe(queue, { stage, point: scrubPoint(event) })
  const move = (event: Event) => {
    if (event.type === "touchmove") cancel(event)
    offer("move", event)
  }
  const stop = (event: Event) => {
    MutableRef.set(active, false)
    unbind()
    offer("end", event)
  }
  const pageEvents: ReadonlyArray<readonly [string, (event: Event) => void]> = [
    ["mousemove", move],
    ["touchmove", move],
    ["mouseup", stop],
    ["touchend", stop]
  ]
  const unbind = () => pageEvents.forEach(([name, listener]) => page.removeEventListener(name, listener))
  const start = (event: Event) => {
    cancel(event)
    if (MutableRef.get(active)) return
    MutableRef.set(active, true)
    pageEvents.forEach(([name, listener]) => page.addEventListener(name, listener, { passive: false }))
    offer("start", event)
  }
  element.addEventListener("mousedown", start)
  element.addEventListener("touchstart", start, { passive: false })

  return () => {
    unbind()
    element.removeEventListener("mousedown", start)
    element.removeEventListener("touchstart", start)
  }
}

export const scrubOn = (element: EventTarget, page: EventTarget): Stream.Stream<Scrub> =>
  Stream.callback<Scrub>((queue) =>
    Effect.acquireRelease(
      Effect.sync(() => scrubbing(queue, element, page)),
      (stop) => Effect.sync(stop)
    )
  )
