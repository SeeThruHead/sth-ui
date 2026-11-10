import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { setDefinedVars, setStyle, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps, Sx } from "../../styles/StylesApi.ts"
import { themeColor } from "../../theme/accent.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { accent, colors } from "../../theme/tokens.stylex.ts"
import { rem } from "../../theme/units.ts"
import { semiCircleVars } from "./SemiCircleProgress.stylex.ts"

export type SemiCircleProgressPart = "root" | "svg" | "emptySegment" | "filledSegment" | "label"

export type SemiCircleProgressOptions = {
  readonly size?: number
  readonly thickness?: number
  readonly orientation?: "up" | "down"
  readonly fillDirection?: "right-to-left" | "left-to-right"
  readonly filledSegmentColor?: string
  readonly emptySegmentColor?: string
  readonly transitionDuration?: number
  readonly labelPosition?: "center" | "bottom"
}

export type SemiCircleProgressProps = SemiCircleProgressOptions &
  StylesApiProps<SemiCircleProgressPart> & { readonly value: number; readonly label?: Child }

export type SemiCircleProgressConfig = ComponentConfig<SemiCircleProgressOptions, SemiCircleProgressPart>

const styles = stylex.create({
  root: {
    [semiCircleVars.filled]: accent.filled,
    [semiCircleVars.empty]: `light-dark(${palette.gray2}, ${palette.dark4})`,
    position: "relative",
    width: "fit-content"
  },
  svg: { display: "block", transform: semiCircleVars.rotation, overflow: "hidden" },
  filled: {
    transitionProperty: "stroke-dashoffset, stroke-dasharray, stroke-opacity, stroke",
    transitionDuration: semiCircleVars.duration,
    transitionTimingFunction: "ease"
  },
  label: {
    position: "absolute",
    marginTop: 0,
    marginBottom: 0,
    marginInline: 0,
    paddingTop: 0,
    paddingBottom: 0,
    insetInline: 0,
    textAlign: "center",
    zIndex: 1
  },
  bottom: { bottom: 0, paddingInline: `calc(${semiCircleVars.thickness} * 2)` },
  bottomDown: { bottom: "auto", top: 0 },
  center: { top: "50%", transform: "translateY(-50%)", paddingInline: `calc(${semiCircleVars.thickness} * 3)` }
})

const rotationOf = (orientation: "up" | "down", fill: "right-to-left" | "left-to-right"): string => {
  if (orientation === "down") return fill === "right-to-left" ? "rotate(180deg) rotateY(180deg)" : "rotate(180deg)"

  return fill === "left-to-right" ? "rotateY(180deg)" : "none"
}

const segmentColor = (color: string): string => (color === "dimmed" ? colors.dimmed : themeColor(color))

export const SemiCircleProgress =
  (config: { readonly SemiCircleProgress?: SemiCircleProgressConfig }) =>
  <M>(h: HtmlBuilder<M>, input: SemiCircleProgressProps): Html => {
    const props = withDefaults(config.SemiCircleProgress, input)
    const getStyles = stylesApi<M, SemiCircleProgressPart>(h, props, config.SemiCircleProgress, "root")
    const size = props.size ?? 200
    const thickness = props.thickness ?? 12
    const orientation = props.orientation ?? "up"
    const position = props.labelPosition ?? "bottom"
    const radius = (size - 2 * thickness) / 2
    const circumference = Math.PI * radius
    const filled = Math.min(100, Math.max(0, props.value)) * (circumference / 100)
    const circle = (
      part: "emptySegment" | "filledSegment",
      stroke: string,
      inline: ReadonlyArray<readonly [string, string]>,
      extra: Sx
    ) =>
      h.circle(
        [
          ...getStyles(part, extra, setStyle(...inline)),
          h.Attribute("cx", String(size / 2)),
          h.Attribute("cy", String(size / 2)),
          h.Attribute("r", String(radius)),
          h.Attribute("fill", "none"),
          h.Attribute("stroke", stroke),
          h.Attribute("stroke-width", String(thickness)),
          h.Attribute("stroke-dasharray", String(circumference))
        ],
        []
      )

    return h.div(
      [
        ...getStyles(
          "root",
          styles.root,
          setDefinedVars(
            [
              semiCircleVars.filled,
              props.filledSegmentColor === undefined ? undefined : segmentColor(props.filledSegmentColor)
            ],
            [
              semiCircleVars.empty,
              props.emptySegmentColor === undefined ? undefined : segmentColor(props.emptySegmentColor)
            ],
            [semiCircleVars.rotation, rotationOf(orientation, props.fillDirection ?? "left-to-right")],
            [
              semiCircleVars.duration,
              props.transitionDuration === undefined ? undefined : `${props.transitionDuration}ms`
            ],
            [semiCircleVars.thickness, rem(thickness)]
          )
        )
      ],
      [
        ...(props.label === undefined
          ? []
          : [
              h.div(
                [
                  ...getStyles(
                    "label",
                    styles.label,
                    position === "bottom" ? styles.bottom : styles.center,
                    position === "bottom" && orientation === "down" && styles.bottomDown
                  ),
                  h.DataAttribute("position", position),
                  h.DataAttribute("orientation", orientation)
                ],
                [props.label]
              )
            ]),
        h.svg(
          [
            ...getStyles("svg", styles.svg),
            h.Attribute("width", String(size)),
            h.Attribute("height", String(size / 2)),
            h.Attribute("viewBox", `0 0 ${size} ${size / 2}`)
          ],
          [
            circle("emptySegment", semiCircleVars.empty, [["strokeDashoffset", String(circumference)]], null),
            circle(
              "filledSegment",
              semiCircleVars.filled,
              [["strokeDashoffset", String(filled)], ...(filled === 0 ? [["strokeOpacity", "0"] as const] : [])],
              styles.filled
            )
          ]
        )
      ]
    )
  }
