import type * as stylex from "@stylexjs/stylex"
import * as FoldkitPopover from "@foldkit/ui/popover"
import { Struct } from "effect"
import { childAttributes } from "foldkit/html"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { ActionIconConfig } from "@sth-ui/core/components/ActionIcon/ActionIcon.ts"
import type { CloseButtonConfig } from "@sth-ui/core/components/CloseButton/CloseButton.ts"
import { InputClearButton, InputPlaceholder } from "@sth-ui/core/components/Input/Input.ts"
import type { InputConfig } from "@sth-ui/core/components/Input/Input.ts"
import { inputBase } from "@sth-ui/core/components/Input/InputBase.ts"
import type { InputBaseConfig, InputBasePart, InputBaseProps } from "@sth-ui/core/components/Input/InputBase.ts"
import type { InputWrapperConfig } from "@sth-ui/core/components/Input/InputWrapper.ts"
import { Popover } from "@sth-ui/core/components/Popover/Popover.ts"
import type { PopoverConfig, PopoverOptions } from "@sth-ui/core/components/Popover/Popover.ts"
import type { CalendarComponents } from "../Calendar/Calendar.ts"
import { formatDateTime, formattedRange, InlineDateTimePicker } from "../InlineDateTimePicker/InlineDateTimePicker.ts"
import type {
  InlineDateTimePickerConfig,
  InlineDateTimePickerPart,
  InlineDateTimePickerProps
} from "../InlineDateTimePicker/InlineDateTimePicker.ts"
import { pickerOnly } from "../picker/PickerInput.ts"
import type { TimePickerConfig } from "../TimePicker/TimePicker.ts"
import { Message } from "./model.ts"
import type { Model } from "./model.ts"

const inlineOnly = [
  ...pickerOnly,
  "minDate",
  "maxDate",
  "withSeconds",
  "defaultTimeValue",
  "timePicker",
  "timePickerProps",
  "endTimePickerProps",
  "submitLabel",
  "allowDeselect",
  "allowSingleDateInRange"
] as const

export type DateTimePickerProps<M> = Omit<
  InputBaseProps<M>,
  "id" | "value" | "onInput" | "onChange" | "component" | "children" | "fieldBind" | "styles"
> &
  Omit<InlineDateTimePickerProps<M>, "model" | "toParentMessage" | "size" | "styles" | "unstyled"> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly styles?: Partial<Record<InputBasePart | InlineDateTimePickerPart, stylex.StyleXStyles>>
    readonly clearable?: boolean
    readonly popoverProps?: PopoverOptions
  }

export type DateTimePickerConfig = InputBaseConfig

const hiddenValue = (value: ReadonlyArray<string>, range: boolean) => {
  if (!range) return value.join("")
  const [start, end] = value
  if (start === undefined) return ""

  return end === undefined ? `${start} –` : `${start} – ${end}`
}

export const DateTimePicker = (
  config: CalendarComponents & {
    readonly Input?: InputConfig
    readonly InputWrapper?: InputWrapperConfig
    readonly CloseButton?: CloseButtonConfig
    readonly Popover?: PopoverConfig
    readonly ActionIcon?: ActionIconConfig
    readonly TimePicker?: TimePickerConfig
    readonly InlineDateTimePicker?: InlineDateTimePickerConfig
    readonly DateTimePicker?: DateTimePickerConfig
  }
) => {
  const base = inputBase("DateTimePicker")(config)
  const clear = InputClearButton(config)
  const placeholder = InputPlaceholder({})
  const popover = Popover(config)
  const inline = InlineDateTimePicker(config)

  return <M>(h: HtmlBuilder<M>, props: DateTimePickerProps<M>): Html => {
    const send = props.toParentMessage
    const value = props.model.inline.value
    const range = props.model.inline.picker.selection.type === "range"
    const format = props.valueFormat ?? (props.withSeconds === true ? "DD/MM/YYYY HH:mm:ss" : "DD/MM/YYYY HH:mm")
    const locale = props.locale ?? "en"
    const formatted = range
      ? formattedRange(value, format, locale, props.labelSeparator ?? "–")
      : value.map((item) => formatDateTime(item, format, locale)).join("")
    const blocked = props.readOnly === true || props.disabled === true
    const clearable = props.clearable === true && value.length > 0 && !blocked
    const field = Struct.omit(props, [
      "model",
      "toParentMessage",
      "styles",
      "clearable",
      "popoverProps",
      "placeholder",
      "valueFormat",
      "labelSeparator",
      ...inlineOnly
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
              id: FoldkitPopover.buttonId(props.model.popover.id),
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
            inline(h, {
              ...Struct.pick(props, inlineOnly),
              ...(props.size === undefined ? {} : { size: props.size }),
              ...(props.valueFormat === undefined ? {} : { valueFormat: props.valueFormat }),
              ...(props.labelSeparator === undefined ? {} : { labelSeparator: props.labelSeparator }),
              fullWidth: false,
              model: props.model.inline,
              toParentMessage: (message) => send(Message.GotInline({ message }))
            })
          ]
        }),
        ...(props.name === undefined
          ? []
          : [h.input([h.Type("hidden"), h.Name(props.name), h.Value(hiddenValue(value, range))])])
      ]
    )
  }
}
