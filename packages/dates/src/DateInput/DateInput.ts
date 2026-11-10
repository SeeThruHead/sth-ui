import * as stylex from "@stylexjs/stylex"
import { anchorSetup } from "@foldkit/ui/anchor"
import { Effect, Option, Schema, Struct } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import type { CloseButtonConfig } from "@sth-ui/core/components/CloseButton/CloseButton.ts"
import { InputClearButton } from "@sth-ui/core/components/Input/Input.ts"
import type { InputConfig } from "@sth-ui/core/components/Input/Input.ts"
import { inputBase } from "@sth-ui/core/components/Input/InputBase.ts"
import type { InputBaseConfig, InputBasePart, InputBaseProps } from "@sth-ui/core/components/Input/InputBase.ts"
import type { InputWrapperConfig } from "@sth-ui/core/components/Input/InputWrapper.ts"
import { dropdownStyles } from "@sth-ui/core/components/Popover/Popover.ts"
import { popoverVars } from "@sth-ui/core/components/Popover/Popover.stylex.ts"
import { unstyledButtonStyles } from "@sth-ui/core/components/UnstyledButton/UnstyledButton.ts"
import { setVars, sx } from "@sth-ui/core/styles/StylesApi.ts"
import { Calendar } from "../Calendar/Calendar.ts"
import type { CalendarComponents, CalendarProps } from "../Calendar/Calendar.ts"
import { isSameMonth, isSameYear } from "../date/date.ts"
import type { DateString } from "../date/date.ts"
import { presetStyles } from "../picker/Picker.ts"
import { Message } from "./model.ts"
import type { Model } from "./model.ts"

export type DateInputPreset = { readonly value: DateString | null; readonly label: string }

export type DateInputProps<M> = Omit<
  InputBaseProps<M>,
  | "id"
  | "value"
  | "onInput"
  | "onChange"
  | "onFocus"
  | "onBlur"
  | "onClick"
  | "onKeyDown"
  | "component"
  | "children"
  | "styles"
> &
  Omit<
    CalendarProps<M>,
    "model" | "toParentMessage" | "size" | "styles" | "classNames" | "unstyled" | "static" | "onDayClick"
  > & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly styles?: Partial<Record<InputBasePart | "dropdown", stylex.StyleXStyles>>
    readonly clearable?: boolean
    readonly presets?: ReadonlyArray<DateInputPreset>
    readonly withinPortal?: boolean
  }

export type DateInputConfig = InputBaseConfig

const keepFocus = (event: Event) => event.preventDefault()

const AnchorDropdown = Mount.define("DateInputDropdown", {
  args: { inputId: Schema.String, portal: Schema.Boolean },
  messages: [Message.Anchored],
  execute: Effect.fn("DateInputDropdown")(function* ({ element, inputId, portal }) {
    yield* Effect.acquireRelease(
      Effect.sync(() => {
        const cleanup = anchorSetup(element, {
          buttonId: inputId,
          anchor: { placement: "bottom-start", gap: 8, padding: 8, portal },
          interceptTab: false,
          focusAfterPosition: false
        })
        element.addEventListener("mousedown", keepFocus)

        return () => {
          element.removeEventListener("mousedown", keepFocus)
          cleanup()
        }
      }),
      (stop) => Effect.sync(stop)
    )

    return Message.Anchored()
  })
})

const inputParts: ReadonlyArray<InputBasePart> = [
  "wrapper",
  "input",
  "section",
  "bottomSection",
  "root",
  "label",
  "required",
  "description",
  "error",
  "success"
]

const calendarKeys = [
  "numberOfColumns",
  "columnsToScroll",
  "minLevel",
  "maxLevel",
  "today",
  "minDate",
  "maxDate",
  "excludeDate",
  "getDayProps",
  "getMonthControlProps",
  "getYearControlProps",
  "renderDay",
  "firstDayOfWeek",
  "weekendDays",
  "hideOutsideDates",
  "hideWeekdays",
  "withWeekNumbers",
  "highlightToday",
  "locale",
  "monthLabelFormat",
  "yearLabelFormat",
  "decadeLabelFormat",
  "monthsListFormat",
  "yearsListFormat",
  "weekdayFormat",
  "ariaLabels",
  "nextLabel",
  "previousLabel",
  "headerControlsOrder",
  "enableKeyboardNavigation"
] as const

export const DateInput = (
  config: CalendarComponents & {
    readonly Input?: InputConfig
    readonly InputWrapper?: InputWrapperConfig
    readonly CloseButton?: CloseButtonConfig
    readonly DateInput?: DateInputConfig
  }
) => {
  const base = inputBase("DateInput")(config)
  const clear = InputClearButton(config)
  const calendar = Calendar(config)

  return <M>(h: HtmlBuilder<M>, props: DateInputProps<M>): Html => {
    const send = props.toParentMessage
    const id = `${props.model.id}-input`
    const value = props.model.value
    const blocked = props.readOnly === true || props.disabled === true
    const clearable = props.clearable === true && value !== null && !blocked
    const days = calendar(h, {
      ...Struct.pick(props, calendarKeys),
      ...(props.size === undefined ? {} : { size: props.size }),
      model: props.model.calendar,
      toParentMessage: (message) => send(Message.GotCalendar({ message })),
      getDayProps: (date) => ({ ...props.getDayProps?.(date), selected: value === date }),
      onDayClick: (date) => send(Message.PickedDay({ date })),
      getMonthControlProps: (month) => ({
        selected: value !== null && isSameMonth(month, value),
        ...props.getMonthControlProps?.(month)
      }),
      getYearControlProps: (year) => ({
        selected: value !== null && isSameYear(year, value),
        ...props.getYearControlProps?.(year)
      })
    })
    const presets = (list: ReadonlyArray<DateInputPreset>) =>
      h.div(sx(h, presetStyles.root), [
        h.div(
          sx(h, presetStyles.presetsList),
          list.map((preset) =>
            h.button(
              [
                ...sx(h, unstyledButtonStyles.root, presetStyles.presetButton),
                h.Type("button"),
                h.OnClick(send(Message.ChosePreset({ value: preset.value })))
              ],
              [preset.label]
            )
          )
        ),
        days
      ])
    const dropdown =
      props.model.opened && !blocked
        ? [
            h.div(
              [
                ...sx(h, dropdownStyles.dropdown, setVars([popoverVars.zIndex, "300"]), props.styles?.dropdown),
                h.DataAttribute("dates-dropdown", ""),
                h.OnMount(Mount.mapMessage(AnchorDropdown({ inputId: id, portal: props.withinPortal ?? true }), send))
              ],
              [props.presets === undefined ? days : presets(props.presets)]
            )
          ]
        : []

    return h.div(
      [],
      [
        base(h, {
          ...Struct.omit(props, [
            "model",
            "toParentMessage",
            "styles",
            "clearable",
            "presets",
            "withinPortal",
            "name",
            "onMonthMouseEnter",
            "onYearMouseEnter",
            "onDayMouseEnter",
            "nextIcon",
            "previousIcon",
            "fullWidth",
            ...calendarKeys
          ]),
          ...(props.styles === undefined ? {} : { styles: Struct.pick(props.styles, inputParts) }),
          id,
          value: props.model.text,
          autoComplete: "off",
          attributes: {
            ...props.attributes,
            input: {
              ...props.attributes?.input,
              "data-dates-input": "",
              ...(props.readOnly === true ? { "data-read-only": "" } : {})
            }
          },
          onInput: (text) => send(Message.Typed({ text })),
          onFocus: send(Message.Focused()),
          onBlur: send(Message.Blurred()),
          onClick: send(Message.Clicked()),
          onKeyDown: (key) => (key === "Escape" ? Option.some(send(Message.PressedEscape())) : Option.none()),
          ...(clearable
            ? {
                rightSectionPointerEvents: "all" as const,
                rightSection: clear(h, { onClick: send(Message.Cleared()), label: "Clear" })
              }
            : {})
        }),
        ...dropdown,
        ...(props.name === undefined ? [] : [h.input([h.Type("hidden"), h.Name(props.name), h.Value(value ?? "")])])
      ]
    )
  }
}
