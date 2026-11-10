import * as stylex from "@stylexjs/stylex"
import { Array as Arr, DateTime } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { palette } from "@sth-ui/core/theme/palette.stylex.ts"
import { colors as tokens } from "@sth-ui/core/theme/tokens.stylex.ts"
import {
  boundaries,
  firstMonthColumn,
  getColumns,
  getDatesRange,
  getMonthsRange,
  heatColor,
  monthOf,
  rotateWeekdays,
  toUtcMidnight
} from "./calendar.ts"
import type { HeatmapDate } from "./calendar.ts"
import { withFloatingLabel } from "../shared/floatingLabel.ts"
import { heatmapVars } from "./heatmap.stylex.ts"

export type { HeatmapDate } from "./calendar.ts"

export type HeatmapRectData = { readonly date: string; readonly value: number | null }

export type HeatmapPart = "root" | "rect" | "monthLabel" | "weekdayLabel" | "legend" | "legendLabel" | "legendRect"

export type HeatmapOptions = {
  readonly withMonthLabels?: boolean
  readonly monthLabelsPosition?: "top" | "bottom"
  readonly monthLabels?: ReadonlyArray<string>
  readonly withWeekdayLabels?: boolean
  readonly weekdayLabels?: ReadonlyArray<string>
  readonly withOutsideDates?: boolean
  readonly firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  readonly rectSize?: number
  readonly gap?: number
  readonly rectRadius?: number
  readonly colors?: ReadonlyArray<string>
  readonly weekdaysLabelsWidth?: number
  readonly monthsLabelsHeight?: number
  readonly fontSize?: number
  readonly withTooltip?: boolean
  readonly splitMonths?: boolean
  readonly withLegend?: boolean
  readonly legendLabels?: readonly [string, string]
}

export type HeatmapProps = HeatmapOptions &
  StylesApiProps<HeatmapPart> & {
    readonly data: Readonly<Record<string, number>>
    readonly domain?: readonly [number, number]
    readonly startDate: HeatmapDate
    readonly endDate?: HeatmapDate
    readonly getTooltipLabel?: (rect: HeatmapRectData) => string
  }

export type HeatmapConfig = ComponentConfig<HeatmapOptions, HeatmapPart>

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const weekdays = ["Sun", "Mon", "", "Wed", "", "Fri", ""]

const styles = stylex.create({
  root: {
    display: "block",
    width: "fit-content",
    [heatmapVars.level1]: "light-dark(rgba(81, 207, 102, 0.3), rgba(43, 138, 62, 0.3))",
    [heatmapVars.level2]: "light-dark(rgba(64, 192, 87, 0.45), rgba(47, 158, 68, 0.45))",
    [heatmapVars.level3]: "light-dark(rgba(55, 178, 77, 0.75), rgba(55, 178, 77, 0.75))",
    [heatmapVars.level4]: "light-dark(rgba(43, 138, 62, 1), rgba(81, 207, 102, 1))",
    [heatmapVars.empty]: `light-dark(${palette.gray2}, ${palette.dark5})`
  },
  rect: { strokeWidth: "1px" },
  empty: { fill: heatmapVars.empty },
  label: { cursor: "default", userSelect: "none", fill: tokens.dimmed }
})

const levels = [heatmapVars.level1, heatmapVars.level2, heatmapVars.level3, heatmapVars.level4].map(String)

export const Heatmap =
  (config: { readonly Heatmap?: HeatmapConfig }) =>
  <M>(h: HtmlBuilder<M>, input: HeatmapProps): Html => {
    const props = withDefaults(config.Heatmap, input)
    const getStyles = stylesApi<M, HeatmapPart>(h, props, config.Heatmap, "root")
    const rectSize = props.rectSize ?? 10
    const gap = props.gap ?? 1
    const step = rectSize + gap
    const rectRadius = String(props.rectRadius ?? 2)
    const font = String(props.fontSize ?? 12)
    const shades = props.colors ?? levels
    const split = props.splitMonths === true
    const withMonths = props.withMonthLabels === true
    const atBottom = withMonths && props.monthLabelsPosition === "bottom"
    const weekdaysOffset = props.withWeekdayLabels === true ? (props.weekdaysLabelsWidth ?? 30) : 0
    const labelsHeight = props.monthsLabelsHeight ?? 14
    const monthsOffset = withMonths && !atBottom ? labelsHeight : 0
    const bottomHeight = atBottom ? labelsHeight : 0
    const weeks = getDatesRange({
      startDate: props.startDate,
      endDate: props.endDate ?? DateTime.add(toUtcMidnight(props.startDate), { years: 1 }),
      withOutsideDates: props.withOutsideDates !== false,
      firstDayOfWeek: props.firstDayOfWeek ?? 1
    })
    const [min, max] = boundaries(props.data, props.domain)
    const columns = getColumns(weeks, split)
    const labeler = props.withTooltip === true ? props.getTooltipLabel : undefined
    const withTooltip = labeler !== undefined
    const rect = (date: string, dayIndex: number, columnIndex: number) => {
      const value = props.data[date]
      const has = value !== undefined

      return h.rect(
        [
          ...getStyles("rect", styles.rect, !has && styles.empty),
          h.Attribute("x", String(columnIndex * step + gap + weekdaysOffset)),
          h.Attribute("y", String(dayIndex * step + gap + monthsOffset)),
          h.Attribute("width", String(rectSize)),
          h.Attribute("height", String(rectSize)),
          h.Attribute("rx", rectRadius),
          ...(has ? [h.Style({ fill: heatColor(value, min, max, shades) })] : [h.DataAttribute("empty", "")]),
          h.DataAttribute("date", date),
          ...(labeler !== undefined ? [h.DataAttribute("label", labeler({ date, value: has ? value : null }))] : [])
        ],
        []
      )
    }
    const rects = columns.flatMap((column, columnIndex) =>
      column.type === "spacer"
        ? []
        : Arr.getUnsafe(weeks, column.weekIndex).flatMap((date, dayIndex) => {
            if (date === null) return []
            if (split && monthOf(date) !== column.month) return []

            return [rect(date, dayIndex, columnIndex)]
          })
    )
    const monthLabels = props.monthLabels ?? months
    const monthNodes = withMonths
      ? getMonthsRange(weeks).flatMap((month) => {
          if (month.size < (split ? 2 : 3)) return []
          const column = split ? firstMonthColumn(columns, month.month) + 1 : month.position

          return [
            h.text(
              [
                ...getStyles("monthLabel", styles.label),
                h.Attribute("x", String(column * step + gap + weekdaysOffset)),
                h.Attribute("y", String(atBottom ? step * 7 + gap + labelsHeight - 4 : labelsHeight - 4)),
                h.Attribute("font-size", font)
              ],
              [Arr.getUnsafe(monthLabels, month.month)]
            )
          ]
        })
      : []
    const weekdayNodes =
      props.withWeekdayLabels === true
        ? rotateWeekdays(props.weekdayLabels ?? weekdays, props.firstDayOfWeek ?? 1).map((label, dayIndex) =>
            h.text(
              [
                ...getStyles("weekdayLabel", styles.label),
                h.Attribute("x", "0"),
                h.Attribute("y", String((dayIndex + 1) * step - gap + monthsOffset)),
                h.Attribute("font-size", font)
              ],
              [label]
            )
          )
        : []
    const width = step * columns.length + gap + weekdaysOffset
    const legendTop = step * 7 + gap + monthsOffset + bottomHeight + 10
    const height = legendTop - 10 + (props.withLegend === true ? 10 + rectSize : 0)
    const legend = (() => {
      if (props.withLegend !== true) return []
      const [less, more] = props.legendLabels ?? ["Less", "More"]
      const charWidth = Number(font) * 0.6
      const swatches = [undefined, ...shades]
      const swatchesWidth = swatches.length * rectSize + (swatches.length - 1) * gap
      const left = width - (less.length * charWidth + 6 + swatchesWidth + 6 + more.length * charWidth)
      const text = (x: number, value: string) =>
        h.text(
          [
            ...getStyles("legendLabel", styles.label),
            h.Attribute("x", String(x)),
            h.Attribute("y", String(rectSize / 2)),
            h.Attribute("font-size", font),
            h.Attribute("dominant-baseline", "central")
          ],
          [value]
        )

      return [
        h.g(
          [
            ...getStyles("legend"),
            h.Attribute("transform", `translate(${left}, ${legendTop})`),
            h.DataAttribute("id", "legend")
          ],
          [
            text(0, less),
            ...swatches.map((color, index) =>
              h.rect(
                [
                  ...getStyles("legendRect", color === undefined && styles.empty),
                  h.Attribute("x", String(less.length * charWidth + 6 + index * step)),
                  h.Attribute("y", "0"),
                  h.Attribute("width", String(rectSize)),
                  h.Attribute("height", String(rectSize)),
                  h.Attribute("rx", rectRadius),
                  ...(color === undefined ? [h.DataAttribute("empty", "")] : [h.Style({ fill: color })])
                ],
                []
              )
            ),
            text(less.length * charWidth + 6 + swatchesWidth + 6, more)
          ]
        )
      ]
    })()
    const svg = h.svg(
      [...getStyles("root", styles.root), h.Attribute("width", String(width)), h.Attribute("height", String(height))],
      [...rects, ...weekdayNodes, ...monthNodes, ...legend]
    )

    return withTooltip ? withFloatingLabel(h, svg) : svg
  }
