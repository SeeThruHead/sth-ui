import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import { setVars, stylesApi, sx, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { themeColor } from "@sth-ui/core/theme/accent.ts"
import { accent } from "@sth-ui/core/theme/tokens.stylex.ts"
import { areaPath, linePath, niceDomain, segments, trendColor } from "../shared/geometry.ts"
import type { CurveType, Point, TrendColors } from "../shared/geometry.ts"
import { hashOf } from "../shared/ids.ts"
import { sparklineVars } from "./Sparkline.stylex.ts"

export type { CurveType, TrendColors } from "../shared/geometry.ts"

export type SparklineOptions = {
  readonly color?: string
  readonly withGradient?: boolean
  readonly fillOpacity?: number
  readonly curveType?: CurveType
  readonly strokeWidth?: number
  readonly connectNulls?: boolean
}

export type SparklineProps = SparklineOptions &
  StylesApiProps<"root"> & {
    readonly data: ReadonlyArray<number | null>
    readonly trendColors?: TrendColors
  }

export type SparklineConfig = ComponentConfig<SparklineOptions, "root">

const styles = stylex.create({
  root: { position: "relative", [sparklineVars.color]: accent.filled },
  plot: { position: "absolute", top: "5px", bottom: "5px", insetInline: "5px" },
  svg: { display: "block", width: "100%", height: "100%", overflow: "visible", outline: "none" }
})

const chartColor = (props: SparklineProps) => {
  if (props.trendColors !== undefined)
    return setVars([sparklineVars.color, themeColor(trendColor(props.data, props.trendColors))])
  if (props.color !== undefined) return setVars([sparklineVars.color, themeColor(props.color)])

  return null
}

export const Sparkline =
  (config: { readonly Sparkline?: SparklineConfig }) =>
  <M>(h: HtmlBuilder<M>, input: SparklineProps): Html => {
    const props = withDefaults(config.Sparkline, input)
    const getStyles = stylesApi<M, "root">(h, props, config.Sparkline, "root")
    const curve = props.curveType ?? "linear"
    const values = props.data.flatMap((value) => (value === null ? [] : [value]))
    const [low, high] = niceDomain(values)
    const last = Math.max(props.data.length - 1, 1)
    const yOf = (value: number) => 100 * (1 - (value - low) / (high - low))
    const pointsOf = (run: ReadonlyArray<{ readonly index: number; readonly value: number }>): ReadonlyArray<Point> =>
      run.map((entry) => ({ x: (entry.index * 100) / last, y: yOf(entry.value) }))
    const runs = segments(props.data, props.connectNulls !== false).map(pointsOf)
    const gradientId = `sparkline-${props.id ?? hashOf(JSON.stringify([props.data, props.color, props.trendColors]))}`
    const opacity = String(props.fillOpacity ?? 0.6)
    const color = String(sparklineVars.color)
    const stop = (offset: string, stopOpacity: string) =>
      h.stop([h.Attribute("offset", offset), h.Style({ stopColor: color, stopOpacity })], [])
    const stops = props.withGradient === false ? [stop("0%", opacity)] : [stop("0%", opacity), stop("100%", "0.01")]
    const line = (points: ReadonlyArray<Point>, area: boolean): Html =>
      h.path(
        [
          h.Attribute("d", area ? areaPath(points, curve, yOf(0)) : linePath(points, curve)),
          h.Attribute("fill", area ? `url(#${gradientId})` : "none"),
          ...(area
            ? []
            : [
                h.Style({ stroke: color }),
                h.Attribute("stroke-width", String(props.strokeWidth ?? 2)),
                h.Attribute("stroke-linejoin", "round"),
                h.Attribute("stroke-linecap", "round")
              ]),
          h.Attribute("vector-effect", "non-scaling-stroke")
        ],
        []
      )

    return h.div(
      [...getStyles("root", styles.root, chartColor(props)), h.Dir("ltr")],
      [
        h.div(sx(h, styles.plot), [
          h.svg(
            [
              ...sx(h, styles.svg),
              h.Attribute("viewBox", "0 0 100 100"),
              h.Attribute("preserveAspectRatio", "none"),
              h.AriaHidden(true)
            ],
            [
              h.defs(
                [],
                [
                  h.linearGradient(
                    [
                      h.Id(gradientId),
                      h.Attribute("x1", "0"),
                      h.Attribute("y1", "0"),
                      h.Attribute("x2", "0"),
                      h.Attribute("y2", "1")
                    ],
                    stops
                  )
                ]
              ),
              ...runs.map((points) => line(points, true)),
              ...runs.map((points) => line(points, false))
            ]
          )
        ])
      ]
    )
  }
