import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import { setDefinedStyle, setDefinedVars, stylesApi, sx, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { themeColor } from "@sth-ui/core/theme/accent.ts"
import { palette } from "@sth-ui/core/theme/palette.stylex.ts"
import { colors } from "@sth-ui/core/theme/tokens.stylex.ts"
import { chartHover, chartTooltip } from "../shared/chartParts.ts"
import type { ChartTooltipPart } from "../shared/chartParts.ts"
import { polar, sectorPath } from "../pie/pie.ts"
import { sunburstArcs } from "./sunburst.ts"
import type { SunburstArc, SunburstChartData } from "./sunburst.ts"
import { sunburstVars } from "./sunburst.stylex.ts"

export type { SunburstChartData } from "./sunburst.ts"

export type SunburstChartPart = "root" | ChartTooltipPart

export type SunburstChartOptions = {
  readonly withTooltip?: boolean
  readonly strokeColor?: string
  readonly size?: number
  readonly innerRadius?: number
  readonly gap?: number
  readonly startAngle?: number
  readonly endAngle?: number
  readonly withLabels?: boolean
}

export type SunburstChartProps = SunburstChartOptions &
  StylesApiProps<SunburstChartPart> & {
    readonly data: ReadonlyArray<SunburstChartData>
    readonly valueFormatter?: (value: number) => string
  }

export type SunburstChartConfig = ComponentConfig<SunburstChartOptions, SunburstChartPart>

const styles = stylex.create({
  root: { position: "relative", [sunburstVars.stroke]: colors.body },
  svg: { display: "block", overflow: "visible", outline: "none" },
  sector: { stroke: sunburstVars.stroke },
  label: {
    fontWeight: "bold",
    fontSize: ".65rem",
    paintOrder: "stroke fill",
    stroke: sunburstVars.stroke,
    strokeWidth: 1,
    fill: colors.bright,
    pointerEvents: "none"
  }
})

const fillOf = (arc: SunburstArc) => (arc.color === undefined ? "#333" : themeColor(arc.color))

export const SunburstChart =
  (config: { readonly SunburstChart?: SunburstChartConfig }) =>
  <M>(h: HtmlBuilder<M>, input: SunburstChartProps): Html => {
    const props = withDefaults(config.SunburstChart, input)
    const getStyles = stylesApi<M, SunburstChartPart>(h, props, config.SunburstChart, "root")
    const size = props.size ?? 300
    const centre = size / 2
    const arcs = sunburstArcs(props.data, {
      radius: centre,
      innerRadius: props.innerRadius ?? 50,
      startAngle: props.startAngle ?? 0,
      endAngle: props.endAngle ?? 360
    })
    const format = props.valueFormatter ?? String
    const label = (arc: SunburstArc) => {
      const point = polar(centre, centre, (arc.innerRadius + arc.outerRadius) / 2, (arc.startAngle + arc.endAngle) / 2)

      return h.text(
        [
          ...sx(h, styles.label),
          h.Attribute("x", String(point.x)),
          h.Attribute("y", String(point.y)),
          h.Attribute("text-anchor", "middle"),
          h.Attribute("dominant-baseline", "middle")
        ],
        [arc.name]
      )
    }

    return h.div(
      [
        ...getStyles(
          "root",
          styles.root,
          setDefinedVars([
            sunburstVars.stroke,
            props.strokeColor === undefined ? undefined : themeColor(props.strokeColor)
          ]),
          setDefinedStyle(["width", `${size}px`], ["height", `${size}px`])
        ),
        chartHover(h)
      ],
      [
        h.svg(
          [
            ...sx(h, styles.svg),
            h.Attribute("width", String(size)),
            h.Attribute("height", String(size)),
            h.Attribute("viewBox", `0 0 ${size} ${size}`)
          ],
          [
            ...arcs.map((arc, index) =>
              h.path(
                [
                  ...sx(h, styles.sector),
                  h.Attribute(
                    "d",
                    sectorPath(
                      {
                        cx: centre,
                        cy: centre,
                        innerRadius: arc.innerRadius,
                        outerRadius: arc.outerRadius,
                        startAngle: arc.startAngle,
                        endAngle: arc.endAngle,
                        paddingAngle: 0
                      },
                      arc.startAngle,
                      arc.endAngle
                    )
                  ),
                  h.Style({ fill: fillOf(arc) }),
                  h.Attribute("stroke-width", String(props.gap ?? 1)),
                  h.DataAttribute("segment", String(index)),
                  h.DataAttribute("depth", String(arc.depth))
                ],
                []
              )
            ),
            ...(props.withLabels === true ? arcs.map(label) : [])
          ]
        ),
        ...(props.withTooltip === false
          ? []
          : arcs.map((arc, index) =>
              chartTooltip(h, getStyles, {
                key: String(index),
                format,
                items: [
                  {
                    name: arc.name,
                    value: arc.value,
                    color: arc.color === undefined ? palette.blue6 : themeColor(arc.color)
                  }
                ]
              })
            ))
      ]
    )
  }
