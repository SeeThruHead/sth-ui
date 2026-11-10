import { Effect, Function, MutableRef, Option, Schema, Stream } from "effect"
import type { HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import { keyboardSteps } from "../shared/keyboard.ts"
import { bandIndex, endShifts, keptTicks, nearestIndex, shiftedSpans, xFraction } from "./grid.ts"

const isHtml = (element: Element): element is HTMLElement => element instanceof HTMLElement

const within = (root: HTMLElement, selector: string) => Array.from(root.querySelectorAll<HTMLElement>(selector))

const place = (tooltip: HTMLElement, x: number, width: number) => {
  tooltip.style.setProperty("left", `${x + 10}px`)
  tooltip.style.setProperty("top", "0px")
  const overflows = x + 10 + tooltip.offsetWidth > width
  if (!overflows) return
  tooltip.style.setProperty("left", `${x - 10 - tooltip.offsetWidth}px`)
}

const cursorLeft = (plot: HTMLElement, index: number, count: number): number =>
  plot.hasAttribute("data-band") ? index / count : xFraction(index, count)

const show = (plot: HTMLElement, index: Option.Option<number>, x: number) => {
  const count = Number(plot.dataset["count"])
  const key = Option.map(index, String)
  within(plot, "[data-cursor]").forEach((cursor) => {
    cursor.style.setProperty("display", Option.isSome(index) ? "block" : "none")
    cursor.style.setProperty(
      "left",
      `${
        Option.getOrElse(
          Option.map(index, (at) => cursorLeft(plot, at, count)),
          () => 0
        ) * 100
      }%`
    )
  })
  within(plot, "[data-dot-index]").forEach((dot) =>
    dot.toggleAttribute("data-active", Option.contains(key, String(dot.dataset["dotIndex"])))
  )
  within(plot, "[data-chart-tooltip]").forEach((tooltip) => {
    const shown = Option.contains(key, String(tooltip.dataset["chartTooltip"]))
    tooltip.style.setProperty("display", shown ? "block" : "none")
    if (!shown) return
    place(tooltip, x, plot.getBoundingClientRect().width)
  })
}

const follow = (plot: HTMLElement) => {
  const onMove = (event: PointerEvent) => {
    const box = plot.getBoundingClientRect()
    const x = event.clientX - box.left
    const count = Number(plot.dataset["count"])
    const index = plot.hasAttribute("data-band") ? bandIndex(x / box.width, count) : nearestIndex(x / box.width, count)
    show(plot, Option.some(index), x)
  }
  const onLeave = () => show(plot, Option.none(), 0)
  const center = (index: number) => {
    const count = Number(plot.dataset["count"])
    const fraction = plot.hasAttribute("data-band") ? (index + 0.5) / count : xFraction(index, count)

    return fraction * plot.getBoundingClientRect().width
  }
  const stopKeys = keyboardSteps(plot, {
    count: () => Number(plot.dataset["count"]),
    show: (index) =>
      show(
        plot,
        index,
        Option.getOrElse(Option.map(index, center), () => 0)
      )
  })
  plot.addEventListener("pointermove", onMove)
  plot.addEventListener("pointerleave", onLeave)

  return () => {
    stopKeys()
    plot.removeEventListener("pointermove", onMove)
    plot.removeEventListener("pointerleave", onLeave)
  }
}

const GridHover = Mount.defineStream("ChartGridHover", {
  messages: [Schema.Never],
  execute: ({ element }) =>
    Stream.callback<never>(() =>
      Effect.acquireRelease(
        Effect.sync(() => follow(Option.getOrThrow(Option.liftPredicate(element, isHtml)))),
        (stop) => Effect.sync(stop)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

export const gridHover = <M>(h: HtmlBuilder<M>) => h.OnMount(Mount.mapMessage(GridHover(), Function.absurd<M>))

const thin = (row: HTMLElement) => {
  const ticks = within(row, "[data-x-tick]")
  ticks.forEach((tick) => tick.style.removeProperty("translate"))
  const bounds = row.getBoundingClientRect()
  const natural = ticks.map((tick) => tick.getBoundingClientRect())
  const shifts = endShifts(natural, bounds)
  ticks.forEach((tick, index) => {
    const shift = (index === 0 ? shifts.head : 0) + (index === ticks.length - 1 ? shifts.tail : 0)
    if (shift !== 0) tick.style.setProperty("translate", `${shift}px 0`)
  })
  const kept = keptTicks(shiftedSpans(natural, shifts))
  ticks.forEach((tick, index) => tick.style.setProperty("visibility", kept.includes(index) ? "visible" : "hidden"))
}

const watch = (row: HTMLElement) => {
  const frame = MutableRef.make(requestAnimationFrame(() => thin(row)))
  const observer = new ResizeObserver(() =>
    MutableRef.set(
      frame,
      requestAnimationFrame(() => thin(row))
    )
  )
  observer.observe(row)

  return () => {
    cancelAnimationFrame(MutableRef.get(frame))
    observer.disconnect()
  }
}

const TickThinning = Mount.defineStream("ChartTickThinning", {
  messages: [Schema.Never],
  execute: ({ element }) =>
    Stream.callback<never>(() =>
      Effect.acquireRelease(
        Effect.sync(() => watch(Option.getOrThrow(Option.liftPredicate(element, isHtml)))),
        (stop) => Effect.sync(stop)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

export const tickThinning = <M>(h: HtmlBuilder<M>) => h.OnMount(Mount.mapMessage(TickThinning(), Function.absurd<M>))
