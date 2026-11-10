import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "@sth-ui/core/content.ts"
import { setVars, stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { themeColor } from "@sth-ui/core/theme/accent.ts"
import { palette } from "@sth-ui/core/theme/palette.stylex.ts"
import { colors, fontSize, fontWeight, radius, space } from "@sth-ui/core/theme/tokens.stylex.ts"
import { withFloatingLabel } from "../shared/floatingLabel.ts"
import { bulletVars } from "./bullet.stylex.ts"

export type BulletChartRange = { readonly value: number; readonly color: string; readonly label?: string }

export type BulletChartPart =
  | "root"
  | "label"
  | "trackWrapper"
  | "track"
  | "range"
  | "bar"
  | "target"
  | "rangeLabel"
  | "barLabel"
  | "targetLabel"

export type BulletChartOptions = {
  readonly orientation?: "horizontal" | "vertical"
  readonly size?: number | string
  readonly barSize?: number | string
  readonly targetRatio?: number
  readonly targetSize?: number | string
  readonly withTooltip?: boolean
  readonly barColor?: string
  readonly targetColor?: string
}

export type BulletChartProps = BulletChartOptions &
  StylesApiProps<BulletChartPart> & {
    readonly value: number
    readonly target?: number
    readonly ranges: ReadonlyArray<BulletChartRange>
    readonly label?: Child
    readonly valueFormatter?: (value: number) => string
    readonly getTooltipLabel?: (data: { readonly value: number; readonly target: number | undefined }) => string
  }

export type BulletChartConfig = ComponentConfig<BulletChartOptions, BulletChartPart>

const marker = `calc(${fontSize.xs} + 4px)`

const styles = stylex.create({
  root: { display: "flex", alignItems: "center", gap: space.md, width: "100%" },
  rootVertical: { flexDirection: "column", width: "auto", height: "100%" },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, whiteSpace: "nowrap", color: colors.text },
  trackWrapper: { position: "relative", flexGrow: 1, flexShrink: 1, flexBasis: 0, paddingBlock: marker },
  trackWrapperVertical: { height: "100%", paddingBlock: 0, paddingInline: `calc(${fontSize.xs} + 40px)` },
  track: { position: "relative", height: bulletVars.size, borderRadius: radius.sm, overflow: "hidden" },
  trackVertical: { width: bulletVars.size, height: "100%" },
  range: { position: "absolute", top: 0, left: 0, height: "100%", borderRadius: radius.sm },
  rangeVertical: { top: "auto", width: "100%" },
  bar: {
    position: "absolute",
    top: "50%",
    left: 0,
    zIndex: 1,
    height: bulletVars.barSize,
    transform: "translateY(-50%)",
    borderStartEndRadius: radius.xs,
    borderEndEndRadius: radius.xs
  },
  barVertical: {
    top: "auto",
    left: "50%",
    width: bulletVars.barSize,
    transform: "translateX(-50%)",
    borderStartStartRadius: radius.xs,
    borderStartEndRadius: radius.xs,
    borderEndEndRadius: 0
  },
  target: {
    position: "absolute",
    top: "50%",
    zIndex: 2,
    transform: "translateY(-50%) translateX(-50%)",
    borderRadius: radius.xs,
    backgroundColor: `light-dark(${palette.dark6}, ${palette.white})`
  },
  targetVertical: { top: "auto", left: "50%", transform: "translateX(-50%) translateY(50%)" },
  rangeLabel: {
    position: "absolute",
    top: 0,
    transform: "translateX(-50%)",
    fontSize: fontSize.xs,
    color: colors.dimmed,
    whiteSpace: "nowrap",
    lineHeight: 1
  },
  sideLabelVertical: { top: "auto", left: "auto", right: 0, transform: "translateY(50%)" },
  barLabel: {
    position: "absolute",
    bottom: 0,
    transform: "translateX(-50%)",
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.text,
    whiteSpace: "nowrap",
    lineHeight: 1
  },
  barLabelVertical: { bottom: "auto", left: 0, transform: "translateY(50%)" }
})

const length = (value: number | string) => (typeof value === "number" ? `${value}px` : value)

export const BulletChart =
  (config: { readonly BulletChart?: BulletChartConfig }) =>
  <M>(h: HtmlBuilder<M>, input: BulletChartProps): Html => {
    const props = withDefaults(config.BulletChart, input)
    const getStyles = stylesApi<M, BulletChartPart>(h, props, config.BulletChart, "root")
    const vertical = props.orientation === "vertical"
    const orientation = vertical ? "vertical" : "horizontal"
    const top = Math.max(...props.ranges.map((range) => range.value), 0)
    const format = props.valueFormatter ?? String
    const percent = (value: number) => (top > 0 ? Math.max(0, Math.min((value / top) * 100, 100)) : 0)
    const along = (value: number) => (vertical ? { bottom: `${percent(value)}%` } : { left: `${percent(value)}%` })
    const extent = (value: number) =>
      vertical ? { height: `${percent(value)}%`, bottom: "0" } : { width: `${percent(value)}%` }
    const ranges = props.ranges.toSorted((a, b) => b.value - a.value)
    const target = props.target
    const ratio = `${(props.targetRatio ?? 0.7) * 100}%`
    const thickness = length(props.targetSize ?? 2)
    const tooltip =
      props.getTooltipLabel === undefined
        ? [`Value: ${format(props.value)}`, ...(target === undefined ? [] : [`Target: ${format(target)}`])].join(" / ")
        : props.getTooltipLabel({ value: props.value, target })
    const track = h.div(
      [
        ...getStyles("track", styles.track, vertical && styles.trackVertical),
        h.DataAttribute("orientation", orientation)
      ],
      [
        ...ranges.map((range) =>
          h.div(
            [
              ...getStyles("range", styles.range, vertical && styles.rangeVertical),
              h.Style({ ...extent(range.value), backgroundColor: themeColor(range.color) })
            ],
            []
          )
        ),
        h.div(
          [
            ...getStyles("bar", styles.bar, vertical && styles.barVertical),
            h.Style({
              ...extent(props.value),
              backgroundColor: props.barColor === undefined ? palette.white : themeColor(props.barColor)
            })
          ],
          []
        ),
        ...(target === undefined
          ? []
          : [
              h.div(
                [
                  ...getStyles("target", styles.target, vertical && styles.targetVertical),
                  h.Style({
                    ...along(target),
                    ...(vertical ? { width: ratio, height: thickness } : { height: ratio, width: thickness }),
                    ...(props.targetColor === undefined ? {} : { backgroundColor: themeColor(props.targetColor) })
                  })
                ],
                []
              )
            ])
      ]
    )
    const wrapper = h.div(
      [
        ...getStyles("trackWrapper", styles.trackWrapper, vertical && styles.trackWrapperVertical),
        h.DataAttribute("orientation", orientation),
        ...(props.withTooltip === true ? [h.DataAttribute("label", tooltip)] : [])
      ],
      [
        ...ranges.map((range) =>
          h.div(
            [
              ...getStyles("rangeLabel", styles.rangeLabel, vertical && styles.sideLabelVertical),
              h.Style(along(range.value))
            ],
            [format(range.value)]
          )
        ),
        ...(target === undefined
          ? []
          : [
              h.div(
                [
                  ...getStyles("targetLabel", styles.rangeLabel, vertical && styles.sideLabelVertical),
                  h.Style(along(target))
                ],
                [format(target)]
              )
            ]),
        track,
        h.div(
          [...getStyles("barLabel", styles.barLabel, vertical && styles.barLabelVertical), h.Style(along(props.value))],
          [format(props.value)]
        )
      ]
    )

    return h.div(
      [
        ...getStyles(
          "root",
          styles.root,
          vertical && styles.rootVertical,
          setVars([bulletVars.size, length(props.size ?? 32)], [bulletVars.barSize, length(props.barSize ?? 16)])
        ),
        h.DataAttribute("orientation", orientation)
      ],
      [
        ...(props.label === undefined ? [] : [h.div(getStyles("label", styles.label), [props.label])]),
        props.withTooltip === true ? withFloatingLabel(h, wrapper, true) : wrapper
      ]
    )
  }
