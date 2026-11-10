import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { mapDefined, setDefinedVars, setVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { themeColor } from "../../theme/accent.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { rem } from "../../theme/units.ts"
import { ringVars } from "./RingProgress.stylex.ts"

export type RingProgressPart = "root" | "svg" | "curve" | "label"

export type RingProgressSection<M> = {
  readonly value: number
  readonly color: string
  readonly onMouseEnter?: M
  readonly onMouseLeave?: M
  readonly onClick?: M
}

export type RingProgressOptions = {
  readonly size?: number
  readonly thickness?: number
  readonly roundCaps?: boolean
  readonly rootColor?: string
  readonly transitionDuration?: number
  readonly sectionGap?: number
  readonly startAngle?: number
}

export type RingProgressProps<M> = RingProgressOptions &
  StylesApiProps<RingProgressPart> & {
    readonly sections: ReadonlyArray<RingProgressSection<M>>
    readonly label?: Child
  }

export type RingProgressConfig = ComponentConfig<RingProgressOptions, RingProgressPart>

const styles = stylex.create({
  root: {
    [ringVars.rootColor]: `light-dark(${palette.gray2}, ${palette.dark4})`,
    position: "relative",
    width: ringVars.size,
    height: ringVars.size,
    minWidth: ringVars.size,
    minHeight: ringVars.size
  },
  svg: {
    width: ringVars.size,
    height: ringVars.size,
    minWidth: ringVars.size,
    minHeight: ringVars.size,
    transform: `rotate(calc(${ringVars.startAngle} - 360deg))`
  },
  curve: {
    stroke: ringVars.curveColor,
    transitionProperty: "stroke-dashoffset, stroke-dasharray, stroke",
    transitionDuration: ringVars.duration,
    transitionTimingFunction: "ease"
  },
  rootCurve: { stroke: ringVars.rootColor },
  label: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    insetInlineStart: ringVars.labelOffset,
    insetInlineEnd: ringVars.labelOffset
  }
})

type Curve<M> = {
  readonly section?: RingProgressSection<M>
  readonly dash: string
  readonly offset: number
  readonly roundCaps: boolean
}

export const RingProgress =
  (config: { readonly RingProgress?: RingProgressConfig }) =>
  <M>(h: HtmlBuilder<M>, input: RingProgressProps<M>): Html => {
    const props = withDefaults(config.RingProgress, input)
    const getStyles = stylesApi<M, RingProgressPart>(h, props, config.RingProgress, "root")
    const size = props.size ?? 120
    const thickness = Math.min(props.thickness ?? 12, size / 4)
    const radius = (size * 0.9 - thickness * 2) / 2
    const circumference = Math.PI * radius * 2
    const deg = circumference / 100
    const sum = props.sections.reduce((total, section) => total + section.value, 0)
    const gap = ((props.sectionGap ?? 0) / 360) * 100
    const roundCaps = props.roundCaps === true
    const offsetAt = (index: number) =>
      circumference -
      props.sections.slice(0, index).reduce((total, section) => total + (section.value / 100) * circumference, 0)
    const sectionCurve = (section: RingProgressSection<M>, index: number, round: boolean): Curve<M> => {
      const value = Math.max(0, section.value - gap)

      return { section, dash: `${value * deg}, ${(100 - value) * deg}`, offset: offsetAt(index), roundCaps: round }
    }
    const last = props.sections.length - 1
    const ordered: ReadonlyArray<Curve<M>> = [
      { dash: `${(100 - sum) * deg}, ${sum * deg}`, offset: 0, roundCaps: false },
      ...props.sections.slice(0, 1).map((section) => sectionCurve(section, 0, roundCaps)),
      ...props.sections
        .slice(1)
        .slice(-1)
        .map((section) => sectionCurve(section, last, roundCaps)),
      ...props.sections.slice(1, -1).map((section, index) => sectionCurve(section, index + 1, false))
    ]
    const curve = ({ section, dash, offset, roundCaps: round }: Curve<M>) =>
      h.circle(
        [
          ...getStyles(
            "curve",
            styles.curve,
            section === undefined && styles.rootCurve,
            setDefinedVars([ringVars.curveColor, mapDefined(section?.color, themeColor)])
          ),
          h.Attribute("fill", "none"),
          h.Attribute("stroke-linecap", round ? "round" : "butt"),
          h.Attribute("stroke-width", String(thickness)),
          h.Attribute("cx", String(size / 2)),
          h.Attribute("cy", String(size / 2)),
          h.Attribute("r", String(radius)),
          h.Attribute("stroke-dasharray", dash),
          h.Attribute("stroke-dashoffset", String(offset)),
          ...(section === undefined
            ? [h.Attribute("transform", `scale(1, -1) translate(0, -${size})`), h.DataAttribute("root", "")]
            : []),
          ...(section?.onMouseEnter === undefined ? [] : [h.OnMouseEnter(section.onMouseEnter)]),
          ...(section?.onMouseLeave === undefined ? [] : [h.OnMouseLeave(section.onMouseLeave)]),
          ...(section?.onClick === undefined ? [] : [h.OnClick(section.onClick)])
        ],
        []
      )

    return h.div(
      getStyles(
        "root",
        styles.root,
        setVars([ringVars.size, rem(size)], [ringVars.labelOffset, rem(thickness * 2)]),
        setDefinedVars(
          [ringVars.duration, mapDefined(props.transitionDuration, (duration) => `${duration}ms`)],
          [ringVars.rootColor, mapDefined(props.rootColor, themeColor)]
        )
      ),
      [
        h.svg(
          [
            ...getStyles("svg", styles.svg, setVars([ringVars.startAngle, `${props.startAngle ?? 270}deg`])),
            h.Attribute("viewBox", `0 0 ${size} ${size}`)
          ],
          ordered.map(curve)
        ),
        ...(props.label === undefined ? [] : [h.div(getStyles("label", styles.label), [props.label])])
      ]
    )
  }
