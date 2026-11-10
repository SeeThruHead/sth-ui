import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import { setDefinedStyle, setDefinedVars, stylesApi, sx, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { themeColor } from "@sth-ui/core/theme/accent.ts"
import { palette } from "@sth-ui/core/theme/palette.stylex.ts"
import { colors } from "@sth-ui/core/theme/tokens.stylex.ts"
import { chartHover, chartTooltip } from "../shared/chartParts.ts"
import type { ChartTooltipPart } from "../shared/chartParts.ts"
import { golden, treemapNodes } from "./squarify.ts"
import type { TreemapData, TreemapNode } from "./squarify.ts"
import { treemapVars } from "./treemap.stylex.ts"

export type { TreemapData } from "./squarify.ts"

export type TreemapPart = "root" | ChartTooltipPart

export type TreemapOptions = {
  readonly aspectRatio?: number
  readonly withTooltip?: boolean
  readonly strokeColor?: string
  readonly textColor?: string
  readonly height?: number
  readonly strokeWidth?: number
  readonly autoContrast?: boolean
}

export type TreemapProps = TreemapOptions &
  StylesApiProps<TreemapPart> & {
    readonly data: ReadonlyArray<TreemapData>
    readonly valueFormatter?: (value: number) => string
  }

export type TreemapConfig = ComponentConfig<TreemapOptions, TreemapPart>

const width = 600

const blues = [
  palette.blue1,
  palette.blue2,
  palette.blue3,
  palette.blue4,
  palette.blue5,
  palette.blue6,
  palette.blue7,
  palette.blue8,
  palette.blue9
]

const styles = stylex.create({
  root: { position: "relative", width: "100%", [treemapVars.stroke]: colors.body },
  node: {
    position: "absolute",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderStyle: "solid",
    borderColor: treemapVars.stroke,
    fontSize: "12px",
    color: palette.white,
    textAlign: "center",
    lineHeight: 1
  }
})

const percent = (value: number, of: number) => `${(value / of) * 100}%`

const fillOf = (node: TreemapNode) =>
  node.color === undefined ? String(blues[node.index % 9]) : themeColor(node.color)

export const Treemap =
  (config: { readonly Treemap?: TreemapConfig }) =>
  <M>(h: HtmlBuilder<M>, input: TreemapProps): Html => {
    const props = withDefaults(config.Treemap, input)
    const getStyles = stylesApi<M, TreemapPart>(h, props, config.Treemap, "root")
    const height = props.height ?? 300
    const nodes = treemapNodes(props.data, width, height, props.aspectRatio ?? golden)
    const format = props.valueFormatter ?? String
    const labelColor = (fill: string) => {
      if (props.textColor !== undefined) return themeColor(props.textColor)
      if (props.autoContrast === true) return `oklch(from ${fill} clamp(0, (0.62 - l) * 999, 1) 0 0)`

      return undefined
    }

    return h.div(
      [
        ...getStyles(
          "root",
          styles.root,
          setDefinedVars([
            treemapVars.stroke,
            props.strokeColor === undefined ? undefined : themeColor(props.strokeColor)
          ]),
          setDefinedStyle(["height", `${height}px`])
        ),
        chartHover(h)
      ],
      [
        ...nodes.map((node, index) => {
          const fill = fillOf(node)
          const color = labelColor(fill)

          return h.div(
            [
              ...sx(h, styles.node),
              h.Style({
                left: percent(node.x, width),
                top: percent(node.y, height),
                width: percent(node.width, width),
                height: percent(node.height, height),
                backgroundColor: fill,
                borderWidth: `${props.strokeWidth ?? 1}px`,
                ...(color === undefined ? {} : { color })
              }),
              h.DataAttribute("segment", String(index)),
              h.DataAttribute("depth", String(node.depth))
            ],
            node.width > 30 && node.height > 20 ? [node.name] : []
          )
        }),
        ...(props.withTooltip === false
          ? []
          : nodes.map((node, index) =>
              chartTooltip(h, getStyles, {
                key: String(index),
                format,
                items: [{ name: node.name, value: node.value, color: fillOf(node) }]
              })
            ))
      ]
    )
  }
