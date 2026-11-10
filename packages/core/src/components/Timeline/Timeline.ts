import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { radiusValue } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, setVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { themeColor } from "../../theme/accent.ts"
import { contrastColor } from "../../theme/contrast.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { accent, colors, fontWeight, space } from "../../theme/tokens.stylex.ts"
import { rem } from "../../theme/units.ts"
import { timelineVars } from "./Timeline.stylex.ts"

export type TimelinePart = "root" | "item" | "itemBullet" | "itemBody" | "itemTitle" | "itemContent" | "itemOpposite"

export type TimelineAlign = "left" | "right"

export type TimelineItem = {
  readonly title?: Child
  readonly children?: ReadonlyArray<Child>
  readonly bullet?: Child
  readonly opposite?: Child
  readonly alternate?: boolean
  readonly radius?: StyleValue
  readonly color?: string
  readonly lineVariant?: "solid" | "dashed" | "dotted"
  readonly active?: boolean
  readonly lineActive?: boolean
}

export type TimelineOptions = {
  readonly color?: string
  readonly radius?: StyleValue
  readonly bulletSize?: number
  readonly lineWidth?: number
  readonly align?: TimelineAlign
  readonly autoContrast?: boolean
}

export type TimelineProps = TimelineOptions &
  StylesApiProps<TimelinePart> & {
    readonly items: ReadonlyArray<TimelineItem>
    readonly active?: number
    readonly reverseActive?: boolean
  }

export type TimelineConfig = ComponentConfig<TimelineOptions, TimelinePart>

const offset = `calc(${timelineVars.bulletSize} / 2 + ${timelineVars.lineWidth} / 2)`

const lineColor = `light-dark(${palette.gray3}, ${palette.dark4})`

const styles = stylex.create({
  root: { [timelineVars.color]: accent.filled },
  rootLeft: { paddingInlineStart: offset },
  rootRight: { paddingInlineEnd: offset },
  item: {
    position: "relative",
    color: colors.text,
    "::before": {
      content: "''",
      pointerEvents: "none",
      position: "absolute",
      top: 0,
      bottom: `calc(${space.xl} * -1)`,
      borderInlineStartWidth: timelineVars.lineWidth,
      borderInlineStartStyle: timelineVars.borderStyle,
      borderInlineStartColor: lineColor
    }
  },
  noLine: { "::before": { display: "none" } },
  lineLeft: { "::before": { insetInlineStart: `calc(${timelineVars.lineWidth} * -1)`, insetInlineEnd: "auto" } },
  lineRight: { "::before": { insetInlineStart: "auto", insetInlineEnd: `calc(${timelineVars.lineWidth} * -1)` } },
  lineMiddle: { "::before": { insetInlineStart: `calc(50% - ${timelineVars.lineWidth} / 2)`, insetInlineEnd: "auto" } },
  lineActive: { "::before": { borderInlineStartColor: timelineVars.itemColor } },
  notFirst: { marginTop: space.xl },
  startPadded: { paddingInlineStart: offset, textAlign: "start" },
  endPadded: { paddingInlineEnd: offset, textAlign: "end" },
  grid: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)" },
  bullet: {
    width: timelineVars.bulletSize,
    height: timelineVars.bulletSize,
    borderRadius: timelineVars.itemRadius,
    borderWidth: timelineVars.lineWidth,
    borderStyle: "solid",
    borderColor: lineColor,
    backgroundColor: colors.body,
    position: "absolute",
    top: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: colors.text
  },
  bulletLeft: { insetInlineStart: `calc(${offset} * -1)`, insetInlineEnd: "auto" },
  bulletRight: { insetInlineStart: "auto", insetInlineEnd: `calc(${offset} * -1)` },
  bulletMiddle: { position: "relative", gridColumnStart: 2, gridRowStart: 1 },
  withChild: { backgroundColor: lineColor },
  bulletActive: { borderColor: timelineVars.itemColor, backgroundColor: palette.white, color: timelineVars.iconColor },
  bulletActiveChild: { backgroundColor: timelineVars.itemColor },
  title: { fontWeight: fontWeight.medium, lineHeight: 1, marginBottom: `calc(${space.xs} / 2)` },
  column1: { gridColumnStart: 1, gridRowStart: 1 },
  column3: { gridColumnStart: 3, gridRowStart: 1 }
})

export const Timeline =
  (config: { readonly Timeline?: TimelineConfig }) =>
  <M>(h: HtmlBuilder<M>, input: TimelineProps): Html => {
    const props = withDefaults(config.Timeline, input)
    const getStyles = stylesApi<M, TimelinePart>(h, props, config.Timeline, "root")
    const align = props.align ?? "left"
    const active = props.active ?? -1
    const count = props.items.length
    const opposite = props.items.some((item) => item.opposite !== undefined)
    const left = align === "left"
    const reached = (index: number, step: number) =>
      props.reverseActive === true ? active >= count - index - 1 : active - step >= index
    const item = (entry: TimelineItem, index: number): Html => {
      const isActive = entry.active === true || reached(index, 0)
      const isLineActive = entry.lineActive === true || reached(index, 1)
      const alternate = entry.alternate === true
      const towardStart = left !== alternate
      const body = h.div(
        getStyles(
          "itemBody",
          ...(opposite ? [towardStart ? styles.column3 : styles.column1] : []),
          (opposite ? towardStart : left) ? styles.startPadded : styles.endPadded
        ),
        [
          ...(entry.title === undefined ? [] : [h.div(getStyles("itemTitle", styles.title), [entry.title])]),
          h.div(getStyles("itemContent"), entry.children ?? [])
        ]
      )
      const side =
        entry.opposite === undefined
          ? []
          : [
              h.div(
                getStyles(
                  "itemOpposite",
                  towardStart ? styles.column1 : styles.column3,
                  towardStart ? styles.endPadded : styles.startPadded
                ),
                [entry.opposite]
              )
            ]
      const bullet = h.div(
        [
          ...getStyles(
            "itemBullet",
            styles.bullet,
            opposite ? styles.bulletMiddle : left ? styles.bulletLeft : styles.bulletRight,
            entry.bullet !== undefined && styles.withChild,
            isActive && styles.bulletActive,
            isActive && entry.bullet !== undefined && styles.bulletActiveChild
          ),
          ...(entry.bullet === undefined ? [] : [h.DataAttribute("with-child", "")]),
          ...(isActive ? [h.DataAttribute("active", "")] : [])
        ],
        entry.bullet === undefined ? [] : [entry.bullet]
      )

      return h.div(
        [
          ...getStyles(
            "item",
            styles.item,
            opposite ? styles.lineMiddle : left ? styles.lineLeft : styles.lineRight,
            index === count - 1 && styles.noLine,
            isLineActive && styles.lineActive,
            index > 0 && styles.notFirst,
            opposite ? styles.grid : left ? styles.startPadded : styles.endPadded,
            setDefinedVars(
              [timelineVars.itemRadius, mapDefined(entry.radius, radiusValue)],
              [timelineVars.itemColor, mapDefined(entry.color, themeColor)],
              [timelineVars.borderStyle, entry.lineVariant]
            )
          ),
          ...(isActive ? [h.DataAttribute("active", "")] : []),
          ...(isLineActive ? [h.DataAttribute("line-active", "")] : []),
          ...(alternate ? [h.DataAttribute("alternate", "")] : [])
        ],
        [...side, bullet, body]
      )
    }
    const color = props.color === undefined ? undefined : themeColor(props.color)

    return h.div(
      [
        ...getStyles(
          "root",
          styles.root,
          !opposite && (left ? styles.rootLeft : styles.rootRight),
          setVars([timelineVars.itemColor, timelineVars.color], [timelineVars.itemRadius, timelineVars.radius]),
          setDefinedVars(
            [timelineVars.bulletSize, mapDefined(props.bulletSize, rem)],
            [timelineVars.lineWidth, mapDefined(props.lineWidth, rem)],
            [timelineVars.radius, mapDefined(props.radius, radiusValue)],
            [timelineVars.color, color],
            [timelineVars.iconColor, props.autoContrast === true ? mapDefined(color, contrastColor) : undefined]
          )
        ),
        h.DataAttribute("align", align),
        ...(opposite ? [h.DataAttribute("opposite", "")] : [])
      ],
      props.items.map(item)
    )
  }
