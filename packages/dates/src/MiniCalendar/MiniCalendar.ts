import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "@sth-ui/core/content.ts"
import { AccordionChevron } from "@sth-ui/core/components/Accordion/Accordion.ts"
import { unstyledButtonStyles } from "@sth-ui/core/components/UnstyledButton/UnstyledButton.ts"
import { stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { palette } from "@sth-ui/core/theme/palette.stylex.ts"
import { accent, colors, fontSize, fontWeight, radius } from "@sth-ui/core/theme/tokens.stylex.ts"
import { addDays, compare, formatDate, isSameDay, normalize } from "../date/date.ts"
import type { DateString } from "../date/date.ts"

export type MiniCalendarPart = "root" | "control" | "days" | "day" | "dayMonth" | "dayNumber"

export type MiniCalendarSize = "xs" | "sm" | "md" | "lg" | "xl"

export type MiniCalendarOptions = {
  readonly size?: MiniCalendarSize
  readonly numberOfDays?: number
  readonly monthLabelFormat?: string
  readonly locale?: string
}

export type MiniCalendarDayProps = {
  readonly disabled?: boolean
  readonly selected?: boolean
  readonly attributes?: Readonly<Record<string, string>>
}

export type MiniCalendarProps<M> = MiniCalendarOptions &
  StylesApiProps<MiniCalendarPart> & {
    readonly date: DateString
    readonly value?: DateString | null
    readonly onChange?: (date: DateString) => M
    readonly onDateChange?: (date: DateString) => M
    readonly minDate?: DateString
    readonly maxDate?: DateString
    readonly getDayProps?: (date: DateString) => MiniCalendarDayProps
    readonly formatMonthLabel?: (date: DateString) => string
    readonly nextLabel?: string
    readonly previousLabel?: string
    readonly nextIcon?: Child
    readonly previousIcon?: Child
  }

export type MiniCalendarConfig = ComponentConfig<MiniCalendarOptions, MiniCalendarPart>

const hover = `light-dark(${palette.gray1}, ${palette.dark5})`

const sizes = stylex.create({
  xs: { fontSize: fontSize.xs },
  sm: { fontSize: fontSize.sm },
  md: { fontSize: fontSize.md },
  lg: { fontSize: fontSize.lg },
  xl: { fontSize: fontSize.xl }
})

const styles = stylex.create({
  root: { width: "fit-content", display: "flex", alignItems: "center" },
  days: { display: "flex", fontSize: "inherit" },
  day: {
    display: "flex",
    minWidth: "3em",
    gap: "0.5em",
    fontSize: "inherit",
    flexDirection: "column",
    alignItems: "center",
    lineHeight: 1,
    padding: "0.75em",
    borderRadius: radius.default,
    backgroundColor: { default: "transparent", ":hover": hover }
  },
  selected: {
    color: accent.contrast,
    backgroundColor: { default: accent.filled, ":hover": accent.filledHover }
  },
  disabled: {
    opacity: 0.3,
    cursor: "not-allowed",
    backgroundColor: { default: "transparent", ":hover": "transparent" }
  },
  dayMonth: { fontSize: "0.75em", fontWeight: fontWeight.medium, opacity: 0.65 },
  dayNumber: { fontSize: "0.9em", fontWeight: fontWeight.medium },
  control: {
    alignSelf: "stretch",
    fontSize: "inherit",
    width: "2em",
    borderRadius: radius.default,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: colors.bright,
    backgroundColor: { default: "transparent", ":hover": hover }
  },
  chevron: { display: "flex", width: "60%" },
  previous: { transform: { default: "rotate(90deg)", ":dir(rtl)": "rotate(-90deg)" } },
  next: { transform: { default: "rotate(-90deg)", ":dir(rtl)": "rotate(90deg)" } }
})

export const MiniCalendar =
  (config: { readonly MiniCalendar?: MiniCalendarConfig }) =>
  <M>(h: HtmlBuilder<M>, input: MiniCalendarProps<M>): Html => {
    const props = withDefaults(config.MiniCalendar, input)
    const getStyles = stylesApi<M, MiniCalendarPart>(h, props, config.MiniCalendar, "root")
    const start = normalize(props.date)
    const count = props.numberOfDays ?? 7
    const locale = props.locale ?? "en"
    const before = (date: DateString) => props.minDate !== undefined && compare(date, props.minDate) < 0
    const after = (date: DateString) => props.maxDate !== undefined && compare(date, props.maxDate) > 0
    const control = (direction: "previous" | "next", disabled: boolean, target: DateString) =>
      h.button(
        [
          ...getStyles("control", unstyledButtonStyles.root, styles.control, disabled && styles.disabled),
          h.Type("button"),
          h.AriaLabel(
            (direction === "next" ? props.nextLabel : props.previousLabel) ??
              (direction === "next" ? "Next" : "Previous")
          ),
          h.DataAttribute("direction", direction),
          ...(disabled ? [h.Disabled(true), h.DataAttribute("disabled", "")] : []),
          ...(disabled || props.onDateChange === undefined ? [] : [h.OnClick(props.onDateChange(target))])
        ],
        [
          (direction === "next" ? props.nextIcon : props.previousIcon) ??
            h.span(
              [
                ...getStyles("control", styles.chevron, direction === "next" ? styles.next : styles.previous),
                h.DataAttribute("chevron", "")
              ],
              [AccordionChevron(h, 16)]
            )
        ]
      )
    const day = (date: DateString) => {
      const custom = props.getDayProps?.(date) ?? {}
      const disabled = custom.disabled ?? (before(date) || after(date))
      const selected =
        custom.selected ?? (props.value !== undefined && props.value !== null && isSameDay(date, props.value))

      return h.button(
        [
          ...getStyles(
            "day",
            unstyledButtonStyles.root,
            styles.day,
            selected && styles.selected,
            disabled && styles.disabled
          ),
          h.Type("button"),
          h.AriaLabel(date),
          ...(disabled ? [h.Disabled(true), h.DataAttribute("disabled", "")] : []),
          ...(selected ? [h.DataAttribute("selected", "")] : []),
          ...Object.entries(custom.attributes ?? {}).map(([name, value]) => h.Attribute(name, value)),
          ...(props.onChange === undefined ? [] : [h.OnClick(props.onChange(date))])
        ],
        [
          h.span(getStyles("dayMonth", styles.dayMonth), [
            props.formatMonthLabel?.(date) ?? formatDate(date, props.monthLabelFormat ?? "MMM", locale)
          ]),
          h.span(getStyles("dayNumber", styles.dayNumber), [String(Number(date.slice(8, 10)))])
        ]
      )
    }

    return h.div(getStyles("root", styles.root, sizes[props.size ?? "sm"]), [
      control("previous", before(addDays(start, -1)), addDays(start, -count)),
      h.div(
        getStyles("days", styles.days),
        Array.from({ length: count }, (_day, index) => day(addDays(start, index)))
      ),
      control("next", after(addDays(start, count)), addDays(start, count))
    ])
  }
