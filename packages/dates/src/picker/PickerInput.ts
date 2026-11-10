import * as stylex from "@stylexjs/stylex"
import * as FoldkitPopover from "@foldkit/ui/popover"
import { Struct } from "effect"
import { childAttributes } from "foldkit/html"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { CloseButtonConfig } from "@sth-ui/core/components/CloseButton/CloseButton.ts"
import { InputClearButton, InputPlaceholder } from "@sth-ui/core/components/Input/Input.ts"
import type { InputConfig } from "@sth-ui/core/components/Input/Input.ts"
import { inputBase } from "@sth-ui/core/components/Input/InputBase.ts"
import type { InputBaseConfig, InputBasePart, InputBaseProps } from "@sth-ui/core/components/Input/InputBase.ts"
import type { InputWrapperConfig } from "@sth-ui/core/components/Input/InputWrapper.ts"
import { Popover } from "@sth-ui/core/components/Popover/Popover.ts"
import type { PopoverConfig, PopoverOptions } from "@sth-ui/core/components/Popover/Popover.ts"
import type { CalendarComponents } from "../Calendar/Calendar.ts"
import { defaultDateFormatter, hiddenValue } from "./format.ts"
import type { DateFormatter } from "./format.ts"
import { Message } from "./inputModel.ts"
import type { Model } from "./inputModel.ts"
import { picker } from "./Picker.ts"
import type { PickerConfig, PickerPart, PickerProps, PickerRootPart } from "./Picker.ts"

export type PickerInputProps<M, Root extends PickerRootPart> = Omit<
  InputBaseProps<M>,
  "id" | "value" | "onInput" | "onChange" | "component" | "children" | "fieldBind" | "styles"
> &
  Omit<PickerProps<M, Root>, "model" | "toParentMessage" | "size" | "styles" | "classNames" | "unstyled"> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly styles?: Partial<Record<InputBasePart | PickerPart<Root>, stylex.StyleXStyles>>
    readonly clearable?: boolean
    readonly valueFormat?: string
    readonly labelSeparator?: string
    readonly valueFormatter?: DateFormatter
    readonly popoverProps?: PopoverOptions
  }

type Configs = CalendarComponents & {
  readonly Input?: InputConfig
  readonly InputWrapper?: InputWrapperConfig
  readonly CloseButton?: CloseButtonConfig
  readonly Popover?: PopoverConfig
}

export const pickerOnly = [
  "presets",
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

export const pickerInput =
  <Name extends string, PickerName extends string, Root extends PickerRootPart>(
    name: Name,
    pickerName: PickerName,
    root: Root,
    defaultFormat: string
  ) =>
  (
    config: Configs & { readonly [Key in Name]?: InputBaseConfig } & {
      readonly [Key in PickerName]?: PickerConfig<Root>
    }
  ) => {
    const base = inputBase(name)(config)
    const clear = InputClearButton(config)
    const placeholder = InputPlaceholder({})
    const popover = Popover(config)
    const own: PickerConfig<Root> | undefined = config[pickerName]
    const dropdown = picker(root, config, own)

    return <M>(h: HtmlBuilder<M>, props: PickerInputProps<M, Root>): Html => {
      const send = props.toParentMessage
      const id = props.model.popover.id
      const selection = props.model.picker.selection
      const formatted = (props.valueFormatter ?? defaultDateFormatter)({
        type: selection.type,
        value: selection.value,
        locale: props.locale ?? "en",
        format: props.valueFormat ?? defaultFormat,
        labelSeparator: props.labelSeparator ?? "–"
      })
      const blocked = props.readOnly === true || props.disabled === true
      const clearable = props.clearable === true && selection.value.length > 0 && !blocked
      const field = Struct.omit(props, [
        "model",
        "toParentMessage",
        "styles",
        "clearable",
        "valueFormat",
        "labelSeparator",
        "valueFormatter",
        "popoverProps",
        "placeholder",
        ...pickerOnly
      ])

      return h.div(
        [],
        [
          popover(h, {
            position: "bottom-start",
            ...props.popoverProps,
            model: props.model.popover,
            toParentMessage: (message) => send(Message.GotPopover({ message })),
            disabled: blocked,
            focusSelector: "[data-calendar] [tabindex='0']",
            target: (bind) =>
              base(h, {
                ...field,
                ...(props.styles === undefined ? {} : { styles: props.styles }),
                id: FoldkitPopover.buttonId(id),
                component: "button",
                type: "button",
                pointer: true,
                multiline: true,
                fieldBind: [
                  ...bind,
                  ...childAttributes([
                    h.DataAttribute("dates-input", ""),
                    ...(props.readOnly === true ? [h.DataAttribute("read-only", "")] : [])
                  ])
                ],
                ...(clearable
                  ? {
                      rightSectionPointerEvents: "all" as const,
                      rightSection: clear(h, { onClick: send(Message.Cleared()), label: "Clear" })
                    }
                  : {}),
                children: [formatted === "" ? placeholder(h, { children: [props.placeholder ?? ""] }) : formatted]
              }),
            children: [
              dropdown(h, {
                ...Struct.pick(props, pickerOnly),
                ...(props.size === undefined ? {} : { size: props.size }),
                model: props.model.picker,
                toParentMessage: (message) => send(Message.GotPicker({ message }))
              })
            ]
          }),
          ...(props.name === undefined
            ? []
            : [h.input([h.Type("hidden"), h.Name(props.name), h.Value(hiddenValue(selection.type, selection.value))])])
        ]
      )
    }
  }
