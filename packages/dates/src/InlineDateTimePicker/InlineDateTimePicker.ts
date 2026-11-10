import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import { ActionIcon } from "@sth-ui/core/components/ActionIcon/ActionIcon.ts"
import type { ActionIconConfig } from "@sth-ui/core/components/ActionIcon/ActionIcon.ts"
import type { CloseButtonConfig } from "@sth-ui/core/components/CloseButton/CloseButton.ts"
import { checkIconPath } from "@sth-ui/core/components/Combobox/Combobox.ts"
import type { InputConfig } from "@sth-ui/core/components/Input/Input.ts"
import type { InputWrapperConfig } from "@sth-ui/core/components/Input/InputWrapper.ts"
import { stylesApi } from "@sth-ui/core/styles/StylesApi.ts"
import type { StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { colors, fontSize, space } from "@sth-ui/core/theme/tokens.stylex.ts"
import type { CalendarComponents } from "../Calendar/Calendar.ts"
import { formatDate } from "../date/date.ts"
import { picker } from "../picker/Picker.ts"
import type { PickerConfig, PickerProps } from "../picker/Picker.ts"
import { datePart, timePart } from "../time/datetime.ts"
import { TimePicker } from "../TimePicker/TimePicker.ts"
import type { TimePickerConfig, TimePickerProps } from "../TimePicker/TimePicker.ts"
import { dateLimits, Message, timeContext } from "./model.ts"
import type { DateTimeContext, Model } from "./model.ts"

export type InlineDateTimePickerPart =
  | "root"
  | "timeWrapper"
  | "timeInput"
  | "submitButton"
  | "rangeInfo"
  | "rangeTimeWrapper"
  | "rangeTimeInput"

type TimeProps<M> = Omit<TimePickerProps<M>, "model" | "toParentMessage" | "onEnter">

export type InlineDateTimePickerProps<M> = Omit<
  PickerProps<M, "datePickerRoot">,
  "model" | "toParentMessage" | "minDate" | "maxDate" | "styles" | "unstyled"
> &
  DateTimeContext &
  StylesApiProps<InlineDateTimePickerPart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly valueFormat?: string
    readonly labelSeparator?: string
    readonly timePickerProps?: TimeProps<M>
    readonly endTimePickerProps?: TimeProps<M>
    readonly submitLabel?: string
  }

export type InlineDateTimePickerConfig = PickerConfig<"datePickerRoot">

const styles = stylex.create({
  root: {},
  timeWrapper: { display: "flex", alignItems: "stretch", marginTop: space.md },
  timeInput: { flexGrow: 1, marginInlineEnd: space.md },
  rangeInfo: {
    marginTop: space.md,
    fontSize: `calc(${fontSize.sm} - 2px)`,
    color: colors.text,
    lineHeight: 1.4,
    height: `calc((${fontSize.sm} - 2px) * 1.4)`,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  rangeTimeWrapper: { display: "flex", alignItems: "stretch", gap: space.md, marginTop: space.md },
  rangeTimeInput: { flexGrow: 1 },
  check: { width: "30%" }
})

type Configs = CalendarComponents & {
  readonly Input?: InputConfig
  readonly InputWrapper?: InputWrapperConfig
  readonly CloseButton?: CloseButtonConfig
  readonly ActionIcon?: ActionIconConfig
  readonly TimePicker?: TimePickerConfig
  readonly InlineDateTimePicker?: InlineDateTimePickerConfig
}

export const formatDateTime = (value: string, format: string, locale: string): string =>
  formatDate(
    datePart(value),
    format
      .replaceAll("HH", timePart(value).slice(0, 2))
      .replaceAll("mm", timePart(value).slice(3, 5))
      .replaceAll("ss", timePart(value).slice(6, 8)),
    locale
  )

export const formattedRange = (
  value: ReadonlyArray<string>,
  format: string,
  locale: string,
  separator: string
): string => {
  const [start, end] = value
  if (start === undefined) return ""
  if (end === undefined) return `${formatDateTime(start, format, locale)} ${separator} ...`

  return `${formatDateTime(start, format, locale)} ${separator} ${formatDateTime(end, format, locale)}`
}

export const InlineDateTimePicker = (config: Configs) => {
  const dates = picker("datePickerRoot", config, config.InlineDateTimePicker)
  const time = TimePicker(config)
  const actionIcon = ActionIcon(config)

  return <M>(h: HtmlBuilder<M>, props: InlineDateTimePickerProps<M>): Html => {
    const send = props.toParentMessage
    const getStyles = stylesApi<M, InlineDateTimePickerPart>(h, props, undefined, "root")
    const model = props.model
    const range = model.picker.selection.type === "range"
    const withSeconds = props.withSeconds === true
    const format = props.valueFormat ?? (withSeconds ? "DD/MM/YYYY HH:mm:ss" : "DD/MM/YYYY HH:mm")
    const submit = h.div(getStyles("submitButton"), [
      actionIcon(h, {
        variant: "default",
        size: `input-${props.size ?? "sm"}`,
        label: props.submitLabel ?? "Submit",
        onClick: send(Message.Submitted()),
        children: [
          h.svg(
            [
              ...getStyles("submitButton", styles.check),
              h.Attribute("viewBox", "0 0 10 7"),
              h.Attribute("fill", "none"),
              h.AriaHidden(true)
            ],
            [h.path([h.Attribute("d", checkIconPath), h.Attribute("fill", "currentColor")], [])]
          )
        ]
      })
    ])
    const timeInput = (which: "start" | "end", part: "timeInput" | "rangeTimeInput") =>
      h.div(getStyles(part, part === "timeInput" ? styles.timeInput : styles.rangeTimeInput), [
        time(h, {
          ...(which === "start" ? props.timePickerProps : props.endTimePickerProps),
          ...timeContext(model, which, props),
          ...(props.size === undefined ? {} : { size: props.size }),
          model: model[which],
          toParentMessage: (message) =>
            send(which === "start" ? Message.GotStart({ message }) : Message.GotEnd({ message })),
          onEnter: send(Message.Submitted())
        })
      ])
    const {
      model: _model,
      toParentMessage: _toParent,
      minDate: _minDate,
      maxDate: _maxDate,
      withSeconds: _withSeconds,
      defaultTimeValue: _defaultTime,
      timePicker: _timePicker,
      valueFormat: _valueFormat,
      labelSeparator: _separator,
      timePickerProps: _startProps,
      endTimePickerProps: _endProps,
      submitLabel: _submitLabel,
      styles: _styles,
      unstyled: _unstyled,
      ...calendar
    } = props
    const month = model.picker.calendar.level === "month"
    const times = range
      ? [
          h.div(getStyles("rangeInfo", styles.rangeInfo), [
            formattedRange(model.value, format, props.locale ?? "en", props.labelSeparator ?? "–")
          ]),
          h.div(getStyles("rangeTimeWrapper", styles.rangeTimeWrapper), [
            timeInput("start", "rangeTimeInput"),
            timeInput("end", "rangeTimeInput"),
            submit
          ])
        ]
      : [h.div(getStyles("timeWrapper", styles.timeWrapper), [timeInput("start", "timeInput"), submit])]

    return h.div(getStyles("root", styles.root), [
      dates(h, {
        fullWidth: true,
        ...calendar,
        ...dateLimits(props),
        model: model.picker,
        toParentMessage: (message) => send(Message.GotPicker({ message }))
      }),
      ...(month ? times : [])
    ])
  }
}
