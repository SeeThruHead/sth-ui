import * as stylex from "@stylexjs/stylex"
import { Array as Arr } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { setDefinedStyle, setDefinedVars, stylesApi, sx, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { themeColor } from "@sth-ui/core/theme/accent.ts"
import { palette } from "@sth-ui/core/theme/palette.stylex.ts"
import { colors as tokens, fontSize } from "@sth-ui/core/theme/tokens.stylex.ts"
import { chartHover, chartTooltip } from "../shared/chartParts.ts"
import type { ChartTooltipPart } from "../shared/chartParts.ts"
import { sankeyLayout } from "./sankey.ts"
import type { SankeyChartData, SankeyLink, SankeyNode } from "./sankey.ts"
import { sankeyVars } from "./sankey.stylex.ts"

export type { SankeyChartData, SankeyChartLink, SankeyChartNode } from "./sankey.ts"

export type SankeyChartPart = "root" | ChartTooltipPart

export type SankeyChartOptions = {
  readonly height?: number
  readonly nodeWidth?: number
  readonly nodePadding?: number
  readonly linkCurvature?: number
  readonly iterations?: number
  readonly nodeColor?: string
  readonly colors?: ReadonlyArray<string>
  readonly linkColor?: string
  readonly linkOpacity?: number
  readonly withTooltip?: boolean
  readonly textColor?: string
}

export type SankeyChartProps = SankeyChartOptions &
  StylesApiProps<SankeyChartPart> & {
    readonly data: SankeyChartData
    readonly valueFormatter?: (value: number) => string
  }

export type SankeyChartConfig = ComponentConfig<SankeyChartOptions, SankeyChartPart>

const defaultColors = [
  "blue",
  "cyan",
  "teal",
  "green",
  "lime",
  "yellow",
  "orange",
  "red",
  "pink",
  "grape",
  "violet",
  "indigo"
]

const margin = 5

const ownColor = (node: SankeyNode) => (node.color === undefined ? undefined : themeColor(node.color))

const styles = stylex.create({
  root: {
    position: "relative",
    [sankeyVars.link]: palette.gray4,
    [sankeyVars.text]: tokens.text
  },
  content: { position: "absolute", top: margin, right: margin, bottom: margin, left: margin },
  node: { position: "absolute" },
  link: { position: "absolute", top: 0, bottom: 0, overflow: "visible", pointerEvents: "none" },
  path: { pointerEvents: "visiblePainted" },
  label: {
    position: "absolute",
    transform: "translateY(-50%)",
    color: sankeyVars.text,
    fontSize: fontSize.xs,
    lineHeight: "14px",
    whiteSpace: "nowrap",
    pointerEvents: "none"
  },
  leaf: { textAlign: "end" },
  value: { opacity: 0.8 },
  stacked: { display: "block" }
})

export const SankeyChart =
  (config: { readonly SankeyChart?: SankeyChartConfig }) =>
  <M>(h: HtmlBuilder<M>, input: SankeyChartProps): Html => {
    const props = withDefaults(config.SankeyChart, input)
    const getStyles = stylesApi<M, SankeyChartPart>(h, props, config.SankeyChart, "root")
    const height = props.height ?? 300
    const nodeWidth = props.nodeWidth ?? 10
    const curvature = props.linkCurvature ?? 0.5
    const inner = height - margin * 2
    const layout = sankeyLayout(props.data, {
      height: inner,
      nodePadding: props.nodePadding ?? 10,
      iterations: props.iterations ?? 32
    })
    const cycle = (props.colors ?? defaultColors).map(themeColor)
    const format = props.valueFormatter ?? String
    const defaultFill = (index: number) => String(cycle[index % cycle.length])
    const fill = (node: SankeyNode) => {
      const own = ownColor(node)
      if (own !== undefined) return own
      if (props.nodeColor !== undefined) return themeColor(props.nodeColor)

      return defaultFill(node.index)
    }
    const along = (share: number, plus: number) => `calc((100% - ${nodeWidth}px) * ${share} + ${plus}px)`
    const nodeAt = (index: number) => Arr.getUnsafe(layout.nodes, index)
    const label = (node: SankeyNode) => {
      const share = node.share
      const side = node.isLeaf
        ? { right: `calc(100% - (100% - ${nodeWidth}px) * ${share} + 6px)` }
        : { left: along(share, nodeWidth + 6) }
      const value = format(node.value)
      const stacked = node.dy >= 28

      return h.span(
        [...sx(h, styles.label, node.isLeaf && styles.leaf), h.Style({ top: `${node.y + node.dy / 2}px`, ...side })],
        stacked
          ? [h.span(sx(h, styles.stacked), [node.name]), h.span(sx(h, styles.stacked, styles.value), [value])]
          : [`${node.name} `, h.span(sx(h, styles.value), [value])]
      )
    }
    const link = (entry: SankeyLink) => {
      const source = nodeAt(entry.source)
      const target = nodeAt(entry.target)
      const from = source.share
      const to = target.share
      const sourceY = source.y + entry.sy + entry.dy / 2
      const targetY = target.y + entry.ty + entry.dy / 2
      const half = entry.dy / 2
      const c1 = curvature * 100
      const c2 = (1 - curvature) * 100

      return h.svg(
        [
          ...sx(h, styles.link),
          h.Style({
            left: along(from, nodeWidth),
            width: `calc((100% - ${nodeWidth}px) * ${to - from} - ${nodeWidth}px)`,
            height: `${inner}px`
          }),
          h.Attribute("viewBox", `0 0 100 ${inner}`),
          h.Attribute("preserveAspectRatio", "none")
        ],
        [
          h.path(
            [
              ...sx(h, styles.path),
              h.Attribute(
                "d",
                `M0,${sourceY + half}C${c1},${sourceY + half} ${c2},${targetY + half} 100,${targetY + half}L100,${targetY - half}C${c2},${targetY - half} ${c1},${sourceY - half} 0,${sourceY - half}Z`
              ),
              h.Style({ fill: ownColor(source) ?? sankeyVars.link, opacity: String(props.linkOpacity ?? 0.4) }),
              h.DataAttribute("segment", `link-${entry.index}`)
            ],
            []
          )
        ]
      )
    }
    const tooltips =
      props.withTooltip === false
        ? []
        : [
            ...layout.nodes.map((node) =>
              chartTooltip(h, getStyles, {
                key: `node-${node.index}`,
                format,
                items: [{ name: node.name, value: node.value, color: ownColor(node) ?? defaultFill(node.index) }]
              })
            ),
            ...layout.links.map((entry) => {
              const source = nodeAt(entry.source)

              return chartTooltip(h, getStyles, {
                key: `link-${entry.index}`,
                format,
                items: [
                  {
                    name: `${source.name} - ${nodeAt(entry.target).name}`,
                    value: entry.value,
                    color: ownColor(source) ?? defaultFill(entry.source)
                  }
                ]
              })
            })
          ]

    return h.div(
      [
        ...getStyles(
          "root",
          styles.root,
          setDefinedVars(
            [sankeyVars.link, props.linkColor === undefined ? undefined : themeColor(props.linkColor)],
            [sankeyVars.text, props.textColor === undefined ? undefined : themeColor(props.textColor)]
          ),
          setDefinedStyle(["height", `${height}px`])
        ),
        chartHover(h)
      ],
      [
        h.div(sx(h, styles.content), [
          ...layout.links.map(link),
          ...layout.nodes.map((node) =>
            h.div(
              [
                ...sx(h, styles.node),
                h.Style({
                  left: along(node.share, 0),
                  top: `${node.y}px`,
                  width: `${nodeWidth}px`,
                  height: `${node.dy}px`,
                  backgroundColor: fill(node)
                }),
                h.DataAttribute("segment", `node-${node.index}`)
              ],
              []
            )
          ),
          ...layout.nodes.map(label)
        ]),
        ...tooltips
      ]
    )
  }
