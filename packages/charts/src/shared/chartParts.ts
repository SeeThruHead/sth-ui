import * as stylex from "@stylexjs/stylex"
import { Array as Arr, Effect, Function, Option, Schema, Stream } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import type { GetStyles } from "@sth-ui/core/styles/StylesApi.ts"
import { keyboardSteps } from "./keyboard.ts"
import { sx } from "@sth-ui/core/styles/StylesApi.ts"
import { palette } from "@sth-ui/core/theme/palette.stylex.ts"
import { colors, fontSize, fontWeight, radius, shadow, space } from "@sth-ui/core/theme/tokens.stylex.ts"

export type ChartTooltipPart =
  | "tooltip"
  | "tooltipItem"
  | "tooltipItemBody"
  | "tooltipItemColor"
  | "tooltipItemName"
  | "tooltipItemData"
  | "tooltipLabel"
  | "tooltipBody"

export type ChartLegendPart = "legend" | "legendItem" | "legendItemColor" | "legendItemName"

export type ChartItem = {
  readonly name: string
  readonly value: number
  readonly color: string
  readonly text?: string
}

const styles = stylex.create({
  tooltip: {
    position: "absolute",
    zIndex: 1000,
    display: "none",
    pointerEvents: "none",
    minWidth: "200px",
    backgroundColor: colors.body,
    boxShadow: shadow.md,
    borderRadius: radius.default,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: `light-dark(${palette.gray3}, ${palette.dark4})`
  },
  tooltipLabel: {
    paddingBlock: space.xs,
    paddingInline: space.md,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.bright
  },
  tooltipBody: { paddingBlock: space.sm, paddingInline: space.md },
  tooltipBodyAfterLabel: { paddingTop: 0 },
  tooltipItem: {
    fontSize: fontSize.sm,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: { default: `calc(${space.sm} / 2)`, ":first-child": 0 }
  },
  tooltipItemBody: { display: "flex", alignItems: "center", gap: space.sm, marginInlineEnd: space.xl },
  tooltipItemColor: { width: "12px", height: "12px", minWidth: "12px", minHeight: "12px" },
  tooltipItemName: { color: colors.text, fontSize: fontSize.sm },
  tooltipItemData: { color: colors.bright },
  legend: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: space.md
  },
  legendTop: { justifyContent: "flex-end", paddingTop: 0, paddingBottom: space.md },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    paddingBlock: "7px",
    paddingInline: space.xs,
    borderRadius: radius.default,
    lineHeight: 1,
    backgroundColor: { default: "transparent", ":hover": `light-dark(${palette.gray0}, ${palette.dark5})` }
  },
  legendItemName: { fontSize: fontSize.sm, margin: 0, padding: 0 }
})

const swatch = <M>(h: HtmlBuilder<M>, color: string, attributes: ReturnType<GetStyles<M, never>>) =>
  h.svg(
    [...attributes, h.Attribute("viewBox", "0 0 12 12"), h.AriaHidden(true)],
    [h.circle([h.Attribute("cx", "6"), h.Attribute("cy", "6"), h.Attribute("r", "6"), h.Style({ fill: color })], [])]
  )

export const chartTooltip = <M>(
  h: HtmlBuilder<M>,
  getStyles: GetStyles<M, ChartTooltipPart>,
  input: {
    readonly items: ReadonlyArray<ChartItem>
    readonly label?: string
    readonly showColor?: boolean
    readonly key: string
    readonly format: (value: number) => string
  }
): Html =>
  h.div(
    [...getStyles("tooltip", styles.tooltip), h.DataAttribute("chart-tooltip", input.key)],
    [
      ...(input.label === undefined ? [] : [h.div(getStyles("tooltipLabel", styles.tooltipLabel), [input.label])]),
      h.div(
        getStyles("tooltipBody", styles.tooltipBody, input.label !== undefined && styles.tooltipBodyAfterLabel),
        input.items.map((item) =>
          h.div(getStyles("tooltipItem", styles.tooltipItem), [
            h.div(getStyles("tooltipItemBody", styles.tooltipItemBody), [
              ...(input.showColor === false
                ? []
                : [swatch(h, item.color, getStyles("tooltipItemColor", styles.tooltipItemColor))]),
              h.div(getStyles("tooltipItemName", styles.tooltipItemName), [item.name])
            ]),
            h.div(getStyles("tooltipItemData", styles.tooltipItemData), [item.text ?? input.format(item.value)])
          ])
        )
      )
    ]
  )

export const chartLegend = <M>(
  h: HtmlBuilder<M>,
  getStyles: GetStyles<M, ChartLegendPart>,
  items: ReadonlyArray<ChartItem>,
  position: "top" | "bottom" = "bottom"
): Html =>
  h.div(
    [
      ...getStyles("legend", styles.legend, position === "top" && styles.legendTop),
      ...(position === "bottom" ? [h.DataAttribute("centered", "")] : []),
      h.DataAttribute("position", position)
    ],
    items.map((item, index) =>
      h.div(
        [...getStyles("legendItem", styles.legendItem), h.DataAttribute("legend-index", String(index))],
        [
          swatch(h, item.color, sx(h, styles.tooltipItemColor)),
          h.p(getStyles("legendItemName", styles.legendItemName), [item.name])
        ]
      )
    )
  )

const isHtml = (element: Element): element is HTMLElement => element instanceof HTMLElement

const closestIndex = (target: EventTarget | null, attribute: string): Option.Option<string> =>
  Option.flatMap(
    Option.liftPredicate(target, (value): value is Element => value instanceof Element),
    (element) => Option.fromNullishOr(element.closest(`[${attribute}]`)?.getAttribute(attribute))
  )

const show = (root: HTMLElement, key: string, x: number, y: number) =>
  Array.from(root.querySelectorAll<HTMLElement>("[data-chart-tooltip]")).forEach((tooltip) => {
    const shown = key !== "" && [key, "all"].includes(String(tooltip.dataset["chartTooltip"]))
    const box = root.getBoundingClientRect()
    tooltip.style.setProperty("display", shown ? "block" : "none")
    tooltip.style.setProperty("left", `${x - box.left + 10}px`)
    tooltip.style.setProperty("top", `${y - box.top + 10}px`)
  })

const highlight = (root: HTMLElement, index: Option.Option<string>) =>
  Array.from(root.querySelectorAll<HTMLElement | SVGElement>("[data-series]")).forEach((element) =>
    element.toggleAttribute(
      "data-dimmed",
      Option.exists(index, (chosen) => element.dataset["series"] !== chosen)
    )
  )

const segmentOf = (element: HTMLElement | SVGElement) => String(element.dataset["segment"])

const listen = (root: HTMLElement) => {
  const onMove = (event: PointerEvent) =>
    Option.match(closestIndex(event.target, "data-segment"), {
      onNone: () => show(root, "", 0, 0),
      onSome: (key) => show(root, key, event.clientX, event.clientY)
    })
  const onLeave = () => show(root, "", 0, 0)
  const onOver = (event: PointerEvent) => highlight(root, closestIndex(event.target, "data-legend-index"))
  const segments = () =>
    Arr.dedupe(Array.from(root.querySelectorAll<HTMLElement | SVGElement>("[data-segment]")).map(segmentOf))
  const showAt = (key: string) => {
    const box = Option.getOrThrow(
      Option.fromNullishOr(root.querySelector(`[data-segment="${key}"]`))
    ).getBoundingClientRect()
    show(root, key, box.left + box.width / 2, box.top + box.height / 2)
  }
  const stopKeys = keyboardSteps(root, {
    count: () => segments().length,
    show: (index) =>
      Option.match(
        Option.flatMap(index, (at) => Arr.get(segments(), at)),
        {
          onNone: () => show(root, "", 0, 0),
          onSome: showAt
        }
      )
  })
  root.addEventListener("pointermove", onMove)
  root.addEventListener("pointerover", onOver)
  root.addEventListener("pointerout", onLeave)

  return () => {
    stopKeys()
    root.removeEventListener("pointermove", onMove)
    root.removeEventListener("pointerover", onOver)
    root.removeEventListener("pointerout", onLeave)
  }
}

const ChartHover = Mount.defineStream("ChartHover", {
  messages: [Schema.Never],
  execute: ({ element }) =>
    Stream.callback<never>(() =>
      Effect.acquireRelease(
        Effect.sync(() => listen(Option.getOrThrow(Option.liftPredicate(element, isHtml)))),
        (stop) => Effect.sync(stop)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

export const chartHover = <M>(h: HtmlBuilder<M>) => h.OnMount(Mount.mapMessage(ChartHover(), Function.absurd<M>))

const listenLegend = (root: HTMLElement) => {
  const onOver = (event: PointerEvent) => highlight(root, closestIndex(event.target, "data-legend-index"))
  root.addEventListener("pointerover", onOver)

  return () => root.removeEventListener("pointerover", onOver)
}

const LegendHover = Mount.defineStream("ChartLegendHover", {
  messages: [Schema.Never],
  execute: ({ element }) =>
    Stream.callback<never>(() =>
      Effect.acquireRelease(
        Effect.sync(() => listenLegend(Option.getOrThrow(Option.liftPredicate(element, isHtml)))),
        (stop) => Effect.sync(stop)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

export const legendHover = <M>(h: HtmlBuilder<M>) => h.OnMount(Mount.mapMessage(LegendHover(), Function.absurd<M>))
