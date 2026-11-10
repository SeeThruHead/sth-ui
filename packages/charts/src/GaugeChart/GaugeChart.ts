import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import { setDefinedStyle, stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { themeColor } from "@sth-ui/core/theme/accent.ts"
import { accent, colors, fontSize, fontWeight } from "@sth-ui/core/theme/tokens.stylex.ts"
import type { Child } from "@sth-ui/core/content.ts"
import { arcBoundingBox, capSections, describeArc, placeSections, polarToCartesian, valueToAngle } from "./gauge.ts"
import type { GaugeSection, PlacedSection } from "./gauge.ts"

export type GaugeChartSection = GaugeSection

export type GaugeChartPart = "root" | "track" | "section" | "sectionCap" | "needle" | "label"

export type GaugeChartOptions = {
  readonly min?: number
  readonly max?: number
  readonly thickness?: number
  readonly size?: number
  readonly startAngle?: number
  readonly endAngle?: number
  readonly roundCaps?: boolean
  readonly targetSize?: number
  readonly trackColor?: string
  readonly filledColor?: string
  readonly targetColor?: string
}

export type GaugeChartProps = GaugeChartOptions &
  StylesApiProps<GaugeChartPart> & {
    readonly value: number
    readonly target?: number
    readonly sections?: ReadonlyArray<GaugeChartSection>
    readonly label?: Child
    readonly valueFormatter?: (value: number) => string
    readonly ariaLabel?: string
    readonly ariaLabelledBy?: string
  }

export type GaugeChartConfig = ComponentConfig<GaugeChartOptions, GaugeChartPart>

const styles = stylex.create({
  root: { display: "block", height: "auto" },
  track: { fill: "none", stroke: colors.defaultBorder },
  filled: { fill: "none", stroke: accent.filled },
  section: { fill: "none" },
  needle: { stroke: colors.bright },
  label: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    lineHeight: 1
  }
})

export const GaugeChart =
  (config: { readonly GaugeChart?: GaugeChartConfig }) =>
  <M>(h: HtmlBuilder<M>, input: GaugeChartProps): Html => {
    const props = withDefaults(config.GaugeChart, input)
    const getStyles = stylesApi<M, GaugeChartPart>(h, props, config.GaugeChart, "root")
    const min = props.min ?? 0
    const max = props.max ?? 100
    const thickness = props.thickness ?? 12
    const size = props.size ?? 200
    const start = props.startAngle ?? -120
    const targetSize = props.targetSize ?? 2
    const roundCaps = props.roundCaps === true
    const cap = roundCaps ? "round" : "butt"
    const centre = size / 2
    const r = (size - thickness) / 2
    const needleLength = thickness * 1.5
    const needleExtent = needleLength / 2 + (roundCaps ? targetSize / 2 : 0)
    const padding = props.target === undefined ? thickness / 2 : Math.max(thickness / 2, needleExtent)
    const end = start + Math.max(-360, Math.min(360, (props.endAngle ?? 120) - start))
    const box = arcBoundingBox(centre, centre, r, start, end, padding, Math.max(thickness, size * 0.11))
    const clamped = Math.max(min, Math.min(max, props.value))
    const formatted = (props.valueFormatter ?? String)(clamped)
    const arc = (part: "section" | "sectionCap", section: PlacedSection, lineCap: string) =>
      h.path(
        [
          ...getStyles(part, styles.section),
          h.Attribute("d", section.path),
          h.Style({ stroke: themeColor(section.color) }),
          h.Attribute("stroke-width", String(thickness)),
          h.Attribute("stroke-linecap", lineCap)
        ],
        []
      )
    const placed = placeSections(props.sections ?? [], { cx: centre, cy: centre, r, min, max }, start, end)
    const fill =
      props.sections !== undefined && props.sections.length > 0
        ? [
            ...(roundCaps ? capSections(placed).map((section) => arc("sectionCap", section, "round")) : []),
            ...placed.map((section) => arc("section", section, "butt"))
          ]
        : [
            h.path(
              [
                ...getStyles("section", styles.filled),
                h.Attribute(
                  "d",
                  describeArc(centre, centre, r, start, valueToAngle(props.value, min, max, start, end))
                ),
                ...(props.filledColor === undefined ? [] : [h.Style({ stroke: themeColor(props.filledColor) })]),
                h.Attribute("stroke-width", String(thickness)),
                h.Attribute("stroke-linecap", cap)
              ],
              []
            )
          ]
    const needle =
      props.target === undefined
        ? []
        : (() => {
            const angle = valueToAngle(props.target, min, max, start, end)
            const inner = polarToCartesian(centre, centre, r - needleLength / 2, angle)
            const outer = polarToCartesian(centre, centre, r + needleLength / 2, angle)

            return [
              h.line(
                [
                  ...getStyles("needle", styles.needle),
                  h.Attribute("x1", String(inner.x)),
                  h.Attribute("y1", String(inner.y)),
                  h.Attribute("x2", String(outer.x)),
                  h.Attribute("y2", String(outer.y)),
                  ...(props.targetColor === undefined ? [] : [h.Style({ stroke: themeColor(props.targetColor) })]),
                  h.Attribute("stroke-width", String(targetSize)),
                  h.Attribute("stroke-linecap", cap)
                ],
                []
              )
            ]
          })()
    const name = props.ariaLabel ?? (typeof props.label === "string" ? props.label : "Gauge")

    return h.svg(
      [
        ...getStyles(
          "root",
          styles.root,
          setDefinedStyle(["width", `${size}px`], ["aspectRatio", `${box.width} / ${box.height}`])
        ),
        h.Attribute("viewBox", `${box.x} ${box.y} ${box.width} ${box.height}`),
        h.Role("meter"),
        props.ariaLabelledBy === undefined ? h.AriaLabel(name) : h.AriaLabelledBy(props.ariaLabelledBy),
        h.Attribute("aria-valuenow", String(clamped)),
        h.Attribute("aria-valuemin", String(min)),
        h.Attribute("aria-valuemax", String(max)),
        h.Attribute("aria-valuetext", formatted)
      ],
      [
        h.path(
          [
            ...getStyles("track", styles.track),
            h.Attribute("d", describeArc(centre, centre, r, start, end)),
            ...(props.trackColor === undefined ? [] : [h.Style({ stroke: themeColor(props.trackColor) })]),
            h.Attribute("stroke-width", String(thickness)),
            h.Attribute("stroke-linecap", cap)
          ],
          []
        ),
        ...fill,
        ...needle,
        h.foreignObject(
          [
            h.Attribute("x", String(box.x)),
            h.Attribute("y", String(box.y)),
            h.Attribute("width", String(box.width)),
            h.Attribute("height", String(box.height))
          ],
          [
            h.div(
              [
                ...getStyles("label", styles.label),
                h.Style({
                  transform: `translate(${centre - box.x - box.width / 2}px, ${centre - box.y - box.height / 2}px)`
                })
              ],
              [props.label ?? formatted]
            )
          ]
        )
      ]
    )
  }
