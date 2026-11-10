import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { StyleXStyles } from "@stylexjs/stylex"
import { sx } from "@sth-ui/core/styles/StylesApi.ts"
import type { ElementAttribute } from "@sth-ui/core/styles/StylesApi.ts"
import { yFraction } from "./grid.ts"

export const barStyles = stylex.create({
  group: {
    position: "absolute",
    top: 0,
    bottom: 0,
    display: "flex",
    justifyContent: "center",
    gap: "4px",
    pointerEvents: "none"
  },
  column: { position: "relative", flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 },
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    opacity: { default: 1, ":is([data-dimmed])": 0.1 }
  }
})

export type BarLayer = { readonly series: number; readonly color: string; readonly low: number; readonly high: number }

export type BarLayout<M> = {
  readonly ticks: ReadonlyArray<number>
  readonly opacity: string
  readonly maxBarWidth: number | undefined
  readonly barAttributes: (style: StyleXStyles) => ReadonlyArray<ElementAttribute<M>>
}

const span = (low: number, high: number, ticks: ReadonlyArray<number>) => ({
  top: `${Math.min(yFraction(low, ticks), yFraction(high, ticks)) * 100}%`,
  bottom: `${(1 - Math.max(yFraction(low, ticks), yFraction(high, ticks))) * 100}%`
})

export const barGroups = <M>(
  h: HtmlBuilder<M>,
  groups: ReadonlyArray<ReadonlyArray<ReadonlyArray<BarLayer>>>,
  layout: BarLayout<M>
): ReadonlyArray<Html> =>
  groups.map((columns, index) =>
    h.div(
      [
        ...sx(h, barStyles.group),
        h.Style({ left: `${((index + 0.1) / groups.length) * 100}%`, width: `${(0.8 / groups.length) * 100}%` })
      ],
      columns.map((layers) =>
        h.div(
          [
            ...sx(h, barStyles.column),
            ...(layout.maxBarWidth === undefined ? [] : [h.Style({ maxWidth: `${layout.maxBarWidth}px` })])
          ],
          layers.map((layer) =>
            h.div(
              [
                ...layout.barAttributes(barStyles.bar),
                h.Style({
                  ...span(layer.low, layer.high, layout.ticks),
                  backgroundColor: layer.color,
                  opacity: layout.opacity
                }),
                h.DataAttribute("series", String(layer.series))
              ],
              []
            )
          )
        )
      )
    )
  )
