import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "@sth-ui/core/content.ts"
import { stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { palette } from "@sth-ui/core/theme/palette.stylex.ts"
import { accent, colors, radius } from "@sth-ui/core/theme/tokens.stylex.ts"
import { isSameDay, normalize } from "../date/date.ts"
import type { DateString } from "../date/date.ts"
import { dayVars } from "./day.stylex.ts"

export type DaySize = "xs" | "sm" | "md" | "lg" | "xl"

export type DayPart = "day"

export type DayState = {
  readonly selected?: boolean
  readonly inRange?: boolean
  readonly firstInRange?: boolean
  readonly lastInRange?: boolean
  readonly disabled?: boolean
}

export type DayOptions = {
  readonly size?: DaySize
  readonly highlightToday?: boolean
  readonly fullWidth?: boolean
}

export type DayProps<M> = DayOptions &
  DayState &
  StylesApiProps<DayPart> & {
    readonly date: DateString
    readonly today?: DateString
    readonly weekend?: boolean
    readonly outside?: boolean
    readonly hidden?: boolean
    readonly static?: boolean
    readonly renderDay?: (date: DateString) => Child
    readonly ariaLabel?: string
    readonly tabIndex?: number
    readonly onClick?: M
    readonly onMouseEnter?: M
  }

export type DayConfig = ComponentConfig<DayOptions, DayPart>

export const daySizes = stylex.create({
  xs: { [dayVars.size]: "30px" },
  sm: { [dayVars.size]: "36px" },
  md: { [dayVars.size]: "42px" },
  lg: { [dayVars.size]: "48px" },
  xl: { [dayVars.size]: "54px" }
})

const hover = `light-dark(${palette.gray0}, ${palette.dark5})`

const styles = stylex.create({
  day: {
    width: dayVars.size,
    height: dayVars.size,
    fontSize: `calc(${dayVars.size} / 2.8)`,
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    userSelect: "none",
    cursor: "pointer",
    padding: 0,
    borderWidth: 0,
    font: "inherit",
    backgroundColor: { default: "transparent", ":hover": hover },
    borderRadius: radius.default,
    color: colors.text,
    opacity: 1,
    outlineOffset: "2px"
  },
  static: {
    userSelect: "auto",
    cursor: "default",
    backgroundColor: { default: "transparent", ":hover": "transparent" }
  },
  weekend: { color: palette.red6 },
  outside: { color: colors.dimmed, opacity: 0.5 },
  disabled: {
    color: colors.disabledColor,
    cursor: "not-allowed",
    opacity: 0.5,
    backgroundColor: { default: "transparent", ":hover": "transparent" }
  },
  hidden: { display: "none" },
  today: { borderWidth: "1px", borderStyle: "solid", borderColor: `light-dark(${palette.gray4}, ${palette.dark4})` },
  inRange: { backgroundColor: { default: accent.light, ":hover": accent.light }, borderRadius: 0 },
  first: { borderStartStartRadius: radius.default, borderEndStartRadius: radius.default },
  last: { borderStartEndRadius: radius.default, borderEndEndRadius: radius.default },
  fullWidth: { width: "100%", height: "auto", minHeight: dayVars.size, aspectRatio: "1" },
  selected: {
    backgroundColor: { default: accent.filled, ":hover": accent.filledHover },
    color: accent.contrast
  }
})

const dayNumberOf = (date: DateString) => String(Number(normalize(date).slice(-2)))

export const Day =
  (config: { readonly Day?: DayConfig }) =>
  <M>(h: HtmlBuilder<M>, input: DayProps<M>): Html => {
    const props = withDefaults(config.Day, input)
    const getStyles = stylesApi<M, DayPart>(h, props, config.Day, "day")
    const disabled = props.disabled === true
    const selected = !disabled && props.selected === true
    const inRange = !disabled && props.inRange === true
    const isToday = props.today !== undefined && isSameDay(props.date, props.today)
    const flags: ReadonlyArray<readonly [string, boolean]> = [
      ["today", isToday],
      ["hidden", props.hidden === true],
      ["highlight-today", props.highlightToday === true],
      ["disabled", disabled],
      ["weekend", !disabled && props.outside !== true && props.weekend === true],
      ["outside", !disabled && props.outside === true],
      ["selected", selected],
      ["in-range", inRange],
      ["first-in-range", !disabled && props.firstInRange === true],
      ["last-in-range", !disabled && props.lastInRange === true],
      ["static", props.static === true],
      ["full-width", props.fullWidth === true]
    ]
    const attributes = [
      ...getStyles(
        "day",
        styles.day,
        daySizes[props.size ?? "sm"],
        props.static === true && styles.static,
        !disabled && props.outside !== true && props.weekend === true && styles.weekend,
        !disabled && props.outside === true && styles.outside,
        isToday && props.highlightToday === true && !selected && !inRange && styles.today,
        inRange && styles.inRange,
        inRange && props.firstInRange === true && styles.first,
        inRange && props.lastInRange === true && styles.last,
        props.fullWidth === true && styles.fullWidth,
        selected && styles.selected,
        disabled && styles.disabled,
        props.hidden === true && styles.hidden
      ),
      ...flags.flatMap(([name, on]) => (on ? [h.DataAttribute(name, "")] : [])),
      h.DataAttribute("date", props.date),
      ...(props.ariaLabel === undefined ? [] : [h.AriaLabel(props.ariaLabel)]),
      ...(props.tabIndex === undefined ? [] : [h.Tabindex(props.tabIndex)]),
      ...(props.onClick === undefined || disabled ? [] : [h.OnClick(props.onClick)]),
      ...(props.onMouseEnter === undefined ? [] : [h.OnMouseEnter(props.onMouseEnter)])
    ]
    const children = [props.renderDay === undefined ? dayNumberOf(props.date) : props.renderDay(props.date)]

    return props.static === true
      ? h.div(attributes, children)
      : h.button([...attributes, h.Type("button"), ...(disabled ? [h.Disabled(true)] : [])], children)
  }
