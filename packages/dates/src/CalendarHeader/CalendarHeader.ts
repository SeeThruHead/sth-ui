import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "@sth-ui/core/content.ts"
import { AccordionChevron } from "@sth-ui/core/components/Accordion/Accordion.ts"
import { stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, GetStyles, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { palette } from "@sth-ui/core/theme/palette.stylex.ts"
import { fontWeight, radius, space } from "@sth-ui/core/theme/tokens.stylex.ts"
import type { DaySize } from "../Day/Day.ts"
import { pickerControlVars } from "../PickerControl/pickerControl.stylex.ts"
import { pickerSizes } from "../PickerControl/PickerControl.ts"

export type CalendarHeaderPart =
  | "calendarHeader"
  | "calendarHeaderControl"
  | "calendarHeaderLevel"
  | "calendarHeaderControlIcon"

export type CalendarHeaderControl = "previous" | "next" | "level"

export type CalendarHeaderOptions = {
  readonly size?: DaySize
  readonly fullWidth?: boolean
  readonly headerControlsOrder?: ReadonlyArray<CalendarHeaderControl>
  readonly nextLabel?: string
  readonly previousLabel?: string
  readonly withNext?: boolean
  readonly withPrevious?: boolean
}

export type CalendarHeaderProps<M> = CalendarHeaderOptions &
  StylesApiProps<CalendarHeaderPart> & {
    readonly label: Child
    readonly levelLabel?: string
    readonly nextIcon?: Child
    readonly previousIcon?: Child
    readonly onNext?: M
    readonly onPrevious?: M
    readonly onLevelClick?: M
    readonly nextDisabled?: boolean
    readonly previousDisabled?: boolean
    readonly hasNextLevel?: boolean
  }

export type CalendarHeaderConfig = ComponentConfig<CalendarHeaderOptions, CalendarHeaderPart>

const hover = `light-dark(${palette.gray0}, ${palette.dark5})`

const styles = stylex.create({
  header: {
    display: "flex",
    maxWidth: `calc(${pickerControlVars.size} * 8 + 7px)`,
    marginBottom: space.xs
  },
  fullWidth: { maxWidth: "none", width: "100%" },
  control: {
    height: pickerControlVars.size,
    width: pickerControlVars.size,
    borderRadius: radius.default,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    userSelect: "none",
    opacity: 1,
    cursor: "pointer",
    padding: 0,
    borderWidth: 0,
    color: "inherit",
    backgroundColor: { default: "transparent", ":hover": hover }
  },
  level: {
    flexGrow: 1,
    width: "auto",
    fontSize: pickerControlVars.fontSize,
    fontWeight: fontWeight.medium,
    textTransform: "capitalize",
    font: "inherit"
  },
  static: { cursor: "default", backgroundColor: { default: "transparent", ":hover": "transparent" } },
  disabled: {
    opacity: 0.2,
    cursor: "not-allowed",
    backgroundColor: { default: "transparent", ":hover": "transparent" }
  },
  icon: { width: "60%", height: "60%", display: "flex" },
  next: { transform: "rotate(270deg)" },
  previous: { transform: "rotate(90deg)" }
})

const control = <M>(
  h: HtmlBuilder<M>,
  getStyles: GetStyles<M, CalendarHeaderPart>,
  direction: "previous" | "next",
  spec: {
    readonly label: string
    readonly icon: Child | undefined
    readonly disabled: boolean
    readonly onClick: M | undefined
  }
) =>
  h.button(
    [
      ...getStyles("calendarHeaderControl", styles.control, spec.disabled && styles.disabled),
      h.Type("button"),
      h.AriaLabel(spec.label),
      h.DataAttribute("direction", direction),
      ...(spec.disabled ? [h.Disabled(true), h.DataAttribute("disabled", "")] : []),
      ...(spec.onClick === undefined || spec.disabled ? [] : [h.OnClick(spec.onClick)])
    ],
    [
      spec.icon ??
        h.span(
          [
            ...getStyles(
              "calendarHeaderControlIcon",
              styles.icon,
              direction === "next" ? styles.next : styles.previous
            ),
            h.DataAttribute("direction", direction)
          ],
          [AccordionChevron(h, 16)]
        )
    ]
  )

export const CalendarHeader =
  (config: { readonly CalendarHeader?: CalendarHeaderConfig }) =>
  <M>(h: HtmlBuilder<M>, input: CalendarHeaderProps<M>): Html => {
    const props = withDefaults(config.CalendarHeader, input)
    const getStyles = stylesApi<M, CalendarHeaderPart>(h, props, config.CalendarHeader, "calendarHeader")
    const hasNextLevel = props.hasNextLevel !== false
    const pieces: Readonly<Record<CalendarHeaderControl, ReadonlyArray<Html>>> = {
      previous:
        props.withPrevious === false
          ? []
          : [
              control(h, getStyles, "previous", {
                label: props.previousLabel ?? "Previous",
                icon: props.previousIcon,
                disabled: props.previousDisabled === true,
                onClick: props.onPrevious
              })
            ],
      next:
        props.withNext === false
          ? []
          : [
              control(h, getStyles, "next", {
                label: props.nextLabel ?? "Next",
                icon: props.nextIcon,
                disabled: props.nextDisabled === true,
                onClick: props.onNext
              })
            ],
      level: [
        hasNextLevel
          ? h.button(
              [
                ...getStyles("calendarHeaderLevel", styles.control, styles.level),
                h.Type("button"),
                ...(props.levelLabel === undefined ? [] : [h.AriaLabel(props.levelLabel)]),
                ...(props.onLevelClick === undefined ? [] : [h.OnClick(props.onLevelClick)])
              ],
              [props.label]
            )
          : h.div(
              [
                ...getStyles("calendarHeaderLevel", styles.control, styles.level, styles.static),
                h.DataAttribute("static", "")
              ],
              [props.label]
            )
      ]
    }

    return h.div(
      [
        ...getStyles(
          "calendarHeader",
          styles.header,
          pickerSizes[props.size ?? "sm"],
          props.fullWidth === true && styles.fullWidth
        ),
        ...(props.fullWidth === true ? [h.DataAttribute("full-width", "")] : [])
      ],
      (props.headerControlsOrder ?? ["previous", "level", "next"]).flatMap((piece) => pieces[piece])
    )
  }
