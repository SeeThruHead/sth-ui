import * as stylex from "@stylexjs/stylex"
import { Array as Arr, Effect, Function, Option, Schema, Stream } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import { setVars, stylesApi, sx, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { themeColor } from "@sth-ui/core/theme/accent.ts"
import { palette } from "@sth-ui/core/theme/palette.stylex.ts"
import { fontSize } from "@sth-ui/core/theme/tokens.stylex.ts"
import { niceTicks } from "../shared/geometry.ts"
import { focusable, keyboardSteps } from "../shared/keyboard.ts"
import { shared } from "@sth-ui/core/styles/shared.ts"
import { chartLegend, chartTooltip, legendHover } from "../shared/chartParts.ts"
import type { ChartLegendPart, ChartTooltipPart } from "../shared/chartParts.ts"
import { numberAt } from "../grid/grid.ts"
import type { ChartRow } from "../grid/grid.ts"
import { gridVars } from "../grid/grid.stylex.ts"
import { anchorOf, nearestAxis, polygon, radarCentre, radarRadius, radarSize, spokeAt } from "./radar.ts"

export type RadarChartSeries = {
  readonly name: string
  readonly color: string
  readonly strokeColor?: string
  readonly opacity?: number
  readonly label?: string
}

export type RadarChartPart = "root" | "container" | ChartTooltipPart | ChartLegendPart

export type RadarChartOptions = {
  readonly withPolarGrid?: boolean
  readonly withPolarAngleAxis?: boolean
  readonly withPolarRadiusAxis?: boolean
  readonly withTooltip?: boolean
  readonly accessibilityLayer?: boolean
  readonly withDots?: boolean
  readonly withLegend?: boolean
  readonly gridColor?: string
  readonly textColor?: string
}

export type RadarChartProps = RadarChartOptions &
  StylesApiProps<RadarChartPart> & {
    readonly data: ReadonlyArray<ChartRow>
    readonly dataKey: string
    readonly series: ReadonlyArray<RadarChartSeries>
  }

export type RadarChartConfig = ComponentConfig<RadarChartOptions, RadarChartPart>

const styles = stylex.create({
  root: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    width: "100%",
    [gridVars.grid]: "light-dark(rgba(173, 181, 189, 0.6), rgba(105, 105, 105, 0.6))",
    [gridVars.text]: `light-dark(${palette.gray7}, ${palette.dark1})`
  },
  container: { position: "relative", flexGrow: 1, minHeight: 0 },
  svg: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", overflow: "visible", outline: "none" },
  grid: { stroke: gridVars.grid, fill: "none" },
  text: { fill: gridVars.text, fontSize: fontSize.xs, userSelect: "none" },
  radar: {
    fillOpacity: { default: "var(--radar-opacity)", ":is([data-dimmed])": 0.05 },
    strokeOpacity: { default: 1, ":is([data-dimmed])": 0.1 }
  },
  cursor: { stroke: gridVars.grid, display: "none" }
})

const colorVars = (props: RadarChartProps) =>
  setVars(
    ...(props.gridColor === undefined ? [] : [[gridVars.grid, themeColor(props.gridColor)] as const]),
    ...(props.textColor === undefined ? [] : [[gridVars.text, themeColor(props.textColor)] as const])
  )

const isHtml = (element: Element): element is HTMLElement => element instanceof HTMLElement

const within = (root: HTMLElement, selector: string) =>
  Array.from(root.querySelectorAll<HTMLElement | SVGElement>(selector))

const show = (root: HTMLElement, key: string, x: number, y: number) => {
  within(root, "[data-radar-cursor]").forEach((line) =>
    line.style.setProperty("display", line.dataset["radarCursor"] === key ? "inline" : "none")
  )
  within(root, "[data-chart-tooltip]").forEach((tooltip) => {
    tooltip.style.setProperty("display", tooltip.dataset["chartTooltip"] === key ? "block" : "none")
    tooltip.style.setProperty("left", `${x + 10}px`)
    tooltip.style.setProperty("top", `${y + 10}px`)
  })
}

const follow = (container: HTMLElement) => {
  const root = Option.getOrThrow(Option.fromNullishOr(container.parentElement))
  const onMove = (event: PointerEvent) => {
    const svg = Option.getOrThrow(Option.fromNullishOr(root.querySelector("svg")))
    const box = svg.getBoundingClientRect()
    const scale = Math.min(box.width, box.height) / radarSize
    const x = (event.clientX - box.left - (box.width - radarSize * scale) / 2) / scale
    const y = (event.clientY - box.top - (box.height - radarSize * scale) / 2) / scale
    const frame = root.getBoundingClientRect()
    show(
      root,
      String(nearestAxis(x, y, Number(root.dataset["count"]))),
      event.clientX - frame.left,
      event.clientY - frame.top
    )
  }
  const onLeave = () => show(root, "", 0, 0)
  const showAt = (index: number) => {
    const line = Option.getOrThrow(Option.fromNullishOr(root.querySelector(`[data-radar-cursor="${index}"]`)))
    const box = line.getBoundingClientRect()
    const frame = root.getBoundingClientRect()
    show(root, String(index), box.left + box.width / 2 - frame.left, box.top + box.height / 2 - frame.top)
  }
  const stopKeys = keyboardSteps(container, {
    count: () => Number(root.dataset["count"]),
    show: (index) => Option.match(index, { onNone: onLeave, onSome: showAt })
  })
  container.addEventListener("pointermove", onMove)
  container.addEventListener("pointerleave", onLeave)

  return () => {
    stopKeys()
    container.removeEventListener("pointermove", onMove)
    container.removeEventListener("pointerleave", onLeave)
  }
}

const RadarHover = Mount.defineStream("RadarChartHover", {
  messages: [Schema.Never],
  execute: ({ element }) =>
    Stream.callback<never>(() =>
      Effect.acquireRelease(
        Effect.sync(() => follow(Option.getOrThrow(Option.liftPredicate(element, isHtml)))),
        (stop) => Effect.sync(stop)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

export const RadarChart =
  (config: { readonly RadarChart?: RadarChartConfig }) =>
  <M>(h: HtmlBuilder<M>, input: RadarChartProps): Html => {
    const props = withDefaults(config.RadarChart, input)
    const getStyles = stylesApi<M, RadarChartPart>(h, props, config.RadarChart, "root")
    const count = props.data.length
    const ticks = niceTicks(
      props.data.flatMap((row) => props.series.flatMap((series) => numberAt(row, series.name) ?? []))
    )
    const top = Option.getOrThrow(Arr.last(ticks))
    const radiusOf = (value: number) => (value / top) * radarRadius
    const withTooltip = props.withTooltip === true
    const keys = withTooltip && props.accessibilityLayer !== false
    const grid =
      props.withPolarGrid === false
        ? []
        : [
            ...ticks
              .slice(1)
              .map((tick) =>
                h.path([...sx(h, styles.grid), h.Attribute("d", polygon(props.data.map(() => radiusOf(tick))))], [])
              ),
            ...props.data.map((_row, index) => {
              const spoke = spokeAt(index, count, radarRadius)

              return h.line(
                [
                  ...sx(h, styles.grid),
                  h.Attribute("x1", String(radarCentre)),
                  h.Attribute("y1", String(radarCentre)),
                  h.Attribute("x2", String(spoke.x)),
                  h.Attribute("y2", String(spoke.y))
                ],
                []
              )
            })
          ]
    const angleLabels =
      props.withPolarAngleAxis === false
        ? []
        : props.data.map((row, index) => {
            const spoke = spokeAt(index, count, radarRadius + 8)

            return h.text(
              [
                ...sx(h, styles.text),
                h.Attribute("x", String(spoke.x)),
                h.Attribute("y", String(spoke.y)),
                h.Attribute("text-anchor", anchorOf(spoke)),
                h.Attribute("dominant-baseline", "central")
              ],
              [String(row[props.dataKey])]
            )
          })
    const radiusLabels =
      props.withPolarRadiusAxis === true
        ? [
            h.line(
              [
                ...sx(h, styles.grid),
                h.Attribute("x1", String(radarCentre)),
                h.Attribute("y1", String(radarCentre)),
                h.Attribute("x2", String(radarCentre + radarRadius)),
                h.Attribute("y2", String(radarCentre))
              ],
              []
            ),
            ...ticks.map((tick) => {
              const x = radarCentre + radiusOf(tick)
              const y = radarCentre + 6

              return h.text(
                [
                  ...sx(h, styles.text),
                  h.Attribute("x", String(x)),
                  h.Attribute("y", String(y)),
                  h.Attribute("transform", `rotate(90 ${x} ${y})`),
                  h.Attribute("dominant-baseline", "central")
                ],
                [String(tick)]
              )
            })
          ]
        : []
    const radars = props.series.map((series, index) =>
      h.path(
        [
          ...sx(h, styles.radar),
          h.Attribute("d", polygon(props.data.map((row) => radiusOf(numberAt(row, series.name) ?? 0)))),
          h.Style({
            fill: themeColor(series.color),
            stroke: themeColor(series.strokeColor ?? series.color),
            "--radar-opacity": String(series.opacity ?? 0.4)
          }),
          h.DataAttribute("series", String(index))
        ],
        []
      )
    )
    const dots =
      props.withDots === true
        ? props.series.flatMap((series, index) =>
            props.data.map((row, at) => {
              const spoke = spokeAt(at, count, radiusOf(numberAt(row, series.name) ?? 0))

              return h.circle(
                [
                  h.Attribute("cx", String(spoke.x)),
                  h.Attribute("cy", String(spoke.y)),
                  h.Attribute("r", "3"),
                  h.Style({ fill: themeColor(series.color) }),
                  h.DataAttribute("series", String(index))
                ],
                []
              )
            })
          )
        : []
    const cursors = withTooltip
      ? props.data.map((_row, index) => {
          const spoke = spokeAt(index, count, radarRadius)

          return h.line(
            [
              ...sx(h, styles.cursor),
              h.Attribute("x1", String(radarCentre)),
              h.Attribute("y1", String(radarCentre)),
              h.Attribute("x2", String(spoke.x)),
              h.Attribute("y2", String(spoke.y)),
              h.DataAttribute("radar-cursor", String(index))
            ],
            []
          )
        })
      : []
    const tooltips = withTooltip
      ? props.data.map((row, index) =>
          chartTooltip(h, getStyles, {
            label: String(row[props.dataKey]),
            key: String(index),
            format: String,
            items: props.series.map((series) => ({
              name: series.label ?? series.name,
              value: numberAt(row, series.name) ?? 0,
              color: themeColor(series.color)
            }))
          })
        )
      : []

    return h.div(
      [...getStyles("root", styles.root, colorVars(props)), h.DataAttribute("count", String(count)), legendHover(h)],
      [
        h.div(
          [
            ...getStyles("container", styles.container, keys && shared.focusRing),
            ...focusable(h, keys),
            ...(withTooltip ? [h.OnMount(Mount.mapMessage(RadarHover(), Function.absurd<M>))] : [])
          ],
          [
            h.svg(
              [...sx(h, styles.svg), h.Attribute("viewBox", `0 0 ${radarSize} ${radarSize}`), h.Role("img")],
              [...grid, ...cursors, ...radars, ...dots, ...angleLabels, ...radiusLabels]
            )
          ]
        ),
        ...(props.withLegend === true
          ? [
              chartLegend(
                h,
                getStyles,
                props.series.map((series) => ({
                  name: series.label ?? series.name,
                  value: 0,
                  color: themeColor(series.color)
                }))
              )
            ]
          : []),
        ...tooltips
      ]
    )
  }
