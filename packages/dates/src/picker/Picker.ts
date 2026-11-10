import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import { unstyledButtonStyles } from "@sth-ui/core/components/UnstyledButton/UnstyledButton.ts"
import { stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { palette } from "@sth-ui/core/theme/palette.stylex.ts"
import { fontSize, radius } from "@sth-ui/core/theme/tokens.stylex.ts"
import { Calendar } from "../Calendar/Calendar.ts"
import type { CalendarComponents, CalendarOptions, CalendarPart, CalendarProps } from "../Calendar/Calendar.ts"
import { isSameMonth, isSameYear } from "../date/date.ts"
import type { DateString } from "../date/date.ts"
import { Message, stateOf } from "./model.ts"
import type { Model } from "./model.ts"

export type PickerPreset = { readonly value: ReadonlyArray<DateString>; readonly label: string }

export type PickerRootPart = "datePickerRoot" | "monthPickerRoot" | "yearPickerRoot"

export type PickerPart<Root extends PickerRootPart> = CalendarPart | Root | "presetsList" | "presetButton"

export type PickerProps<M, Root extends PickerRootPart> = Omit<
  CalendarProps<M>,
  "model" | "toParentMessage" | "onMouseLeave" | keyof StylesApiProps<CalendarPart>
> &
  StylesApiProps<PickerPart<Root>> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly presets?: ReadonlyArray<PickerPreset>
  }

export type PickerConfig<Root extends PickerRootPart> = ComponentConfig<CalendarOptions, PickerPart<Root>>

export const presetStyles = stylex.create({
  root: { display: "flex" },
  presetsList: {
    display: "flex",
    flexDirection: "column",
    borderInlineEndWidth: "1px",
    borderInlineEndStyle: "solid",
    borderInlineEndColor: `light-dark(${palette.gray2}, ${palette.dark5})`,
    paddingInlineEnd: "0.5em",
    marginInlineEnd: "0.5em"
  },
  presetButton: {
    padding: "0.52em 0.8em",
    borderRadius: radius.default,
    fontSize: fontSize.sm,
    whiteSpace: "nowrap",
    backgroundColor: { default: "transparent", ":hover": `light-dark(${palette.gray0}, ${palette.dark5})` }
  }
})

const lowestLevel = { month: "year", year: "decade" } as const

const single = (model: Model) => (model.selection.type === "default" ? model.selection.value[0] : undefined)

export const picker =
  <Root extends PickerRootPart>(root: Root, config: CalendarComponents, own: PickerConfig<Root> | undefined) =>
  <M>(h: HtmlBuilder<M>, input: PickerProps<M, Root>): Html => {
    const props = withDefaults(own, input)
    const getStyles = stylesApi<M, PickerPart<Root>>(h, props, own, root)
    const send = props.toParentMessage
    const value = single(props.model)
    const level = props.model.level
    const calendar = Calendar(config)(h, {
      ...props,
      model: props.model.calendar,
      toParentMessage: (message) => send(Message.GotCalendar({ message })),
      minLevel: level === "day" ? (props.minLevel ?? "month") : lowestLevel[level],
      onMouseLeave: send(Message.Left()),
      hideOutsideDates: props.hideOutsideDates ?? (props.numberOfColumns ?? 1) !== 1,
      getDayProps: (date) => ({ ...stateOf(props.model, date), ...props.getDayProps?.(date) }),
      onDayClick: (date) => send(Message.Picked({ date })),
      onDayMouseEnter: (date) => send(Message.Hovered({ date })),
      getMonthControlProps: (month) => ({
        ...(level === "month"
          ? stateOf(props.model, month)
          : { selected: value !== undefined && isSameMonth(month, value) }),
        ...props.getMonthControlProps?.(month)
      }),
      getYearControlProps: (year) => ({
        ...(level === "year"
          ? stateOf(props.model, year)
          : { selected: value !== undefined && isSameYear(year, value) }),
        ...props.getYearControlProps?.(year)
      }),
      ...(level === "month"
        ? { onMonthMouseEnter: (month: DateString) => send(Message.Hovered({ date: month })) }
        : {}),
      ...(level === "year" ? { onYearMouseEnter: (year: DateString) => send(Message.Hovered({ date: year })) } : {})
    })
    if (props.presets === undefined) return calendar

    return h.div(getStyles(root, presetStyles.root), [
      h.div(
        getStyles("presetsList", presetStyles.presetsList),
        props.presets.map((preset) =>
          h.button(
            [
              ...getStyles("presetButton", unstyledButtonStyles.root, presetStyles.presetButton),
              h.Type("button"),
              h.OnClick(send(Message.ChosePreset({ value: preset.value })))
            ],
            [preset.label]
          )
        )
      ),
      calendar
    ])
  }
