import * as stylex from "@stylexjs/stylex"
import { anchorSetup } from "@foldkit/ui/anchor"
import type { Cause } from "effect"
import { Effect, Option, Queue, Schema, Stream } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import type { Child } from "@sth-ui/core/content.ts"
import type { CloseButtonConfig } from "@sth-ui/core/components/CloseButton/CloseButton.ts"
import { InputClearButton } from "@sth-ui/core/components/Input/Input.ts"
import type { InputConfig } from "@sth-ui/core/components/Input/Input.ts"
import { inputBase } from "@sth-ui/core/components/Input/InputBase.ts"
import type { InputBaseConfig, InputBasePart, InputBaseProps } from "@sth-ui/core/components/Input/InputBase.ts"
import type { InputWrapperConfig } from "@sth-ui/core/components/Input/InputWrapper.ts"
import { dropdownStyles } from "@sth-ui/core/components/Popover/Popover.ts"
import { popoverVars } from "@sth-ui/core/components/Popover/Popover.stylex.ts"
import { unstyledButtonStyles } from "@sth-ui/core/components/UnstyledButton/UnstyledButton.ts"
import { mergeStyles, setVars, stylesApi } from "@sth-ui/core/styles/StylesApi.ts"
import type { StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { palette } from "@sth-ui/core/theme/palette.stylex.ts"
import { accent, colors, fontSize, fontWeight, radius, space } from "@sth-ui/core/theme/tokens.stylex.ts"
import { defaultAmPmLabels, isSameTime, padTime, valuesRange } from "../time/clock.ts"
import { timeValue } from "../TimeValue/TimeValue.ts"
import { boundsOf, fieldId, formatOf, hiddenValue, Message } from "./model.ts"
import type { Model, NumberField, TimePickerContext } from "./model.ts"

export type TimePickerPart =
  | "fieldsRoot"
  | "fieldsGroup"
  | "field"
  | "controlsList"
  | "controlsListGroup"
  | "control"
  | "dropdown"
  | "presetsRoot"
  | "presetsGroup"
  | "presetsGroupLabel"
  | "presetControl"
  | "scrollarea"

export type TimePickerPresetGroup = { readonly label: Child; readonly values: ReadonlyArray<string> }

export type TimePickerPresets = ReadonlyArray<string> | ReadonlyArray<TimePickerPresetGroup>

export type TimePickerProps<M> = Omit<
  InputBaseProps<M>,
  | "id"
  | "value"
  | "onInput"
  | "onChange"
  | "onClick"
  | "onFocus"
  | "onBlur"
  | "onKeyDown"
  | "component"
  | "children"
  | "styles"
  | "type"
  | "placeholder"
> &
  TimePickerContext &
  StylesApiProps<TimePickerPart | InputBasePart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly clearable?: boolean
    readonly withDropdown?: boolean
    readonly presets?: TimePickerPresets
    readonly maxDropdownContentHeight?: number
    readonly reverseTimeControlsList?: boolean
    readonly hoursInputLabel?: string
    readonly minutesInputLabel?: string
    readonly secondsInputLabel?: string
    readonly amPmInputLabel?: string
    readonly hoursPlaceholder?: string
    readonly minutesPlaceholder?: string
    readonly secondsPlaceholder?: string
    readonly minHoursDigits?: number
    readonly withinPortal?: boolean
    readonly onEnter?: M
  }

export type TimePickerConfig = InputBaseConfig

const hover = `light-dark(${palette.gray1}, ${palette.dark5})`

const styles = stylex.create({
  fieldsRoot: { display: "flex", alignItems: "center", height: "100%", overflow: "hidden" },
  fieldsGroup: { display: "flex", alignItems: "center", height: "calc(var(--input-height) - 15px)" },
  field: {
    width: "calc(2ch + 0.3em)",
    caretColor: "transparent",
    fontVariantNumeric: "tabular-nums",
    position: "relative",
    height: "100%",
    lineHeight: 1,
    paddingInline: "0.15em",
    borderWidth: 0,
    textAlign: "center",
    textAlignLast: "center",
    backgroundColor: { default: "transparent", ":focus": accent.filled },
    color: { default: "inherit", ":focus": palette.white },
    borderRadius: "2px",
    appearance: "none",
    fontFamily: "inherit",
    fontSize: "inherit",
    outline: { default: null, ":focus": "0" },
    cursor: { default: null, ":disabled": "not-allowed" },
    "::selection": { backgroundColor: "transparent" },
    "::placeholder": { opacity: 1, color: "inherit" }
  },
  amPm: { width: "auto" },
  controlsList: { display: "flex", flexDirection: "column" },
  controlsListGroup: { display: "flex", gap: "4px" },
  dropdown: { padding: "4px" },
  scrollarea: { overflowY: "auto", scrollbarWidth: "none" },
  control: {
    textAlign: "center",
    minWidth: "2.5em",
    width: "max-content",
    height: "2em",
    borderRadius: radius.default,
    fontSize: fontSize.sm,
    color: { default: "inherit", ":hover": colors.bright },
    backgroundColor: { default: "transparent", ":hover": hover }
  },
  active: {
    backgroundColor: { default: accent.filled, ":hover": accent.filled },
    color: { default: palette.white, ":hover": palette.white }
  },
  presetControl: {
    textAlign: "center",
    height: "2em",
    paddingInline: "0.5em",
    borderRadius: radius.default,
    fontSize: fontSize.sm,
    color: { default: "inherit", ":hover": colors.bright },
    backgroundColor: { default: "transparent", ":hover": hover }
  },
  presetsGrid: { display: "grid", gap: "4px" },
  presetsGroup: { marginTop: { default: null, ":not(:first-child)": space.sm } },
  presetsGroupLabel: {
    marginBottom: "4px",
    color: colors.dimmed,
    fontSize: `calc(${fontSize.sm} - 2px)`,
    fontWeight: fontWeight.medium,
    display: "flex",
    alignItems: "center",
    paddingInlineStart: "7px",
    "::after": {
      content: "''",
      flex: 1,
      height: "1px",
      marginInlineStart: space.xs,
      backgroundColor: `light-dark(${palette.gray2}, ${palette.dark4})`
    }
  }
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

const isElement = (target: EventTarget | null): target is Element => target instanceof Element

const insideBox = (target: Element) => {
  if (target.closest("input, select, button") !== null) return false

  return target.closest("[data-time-picker], label") !== null
}

const pressedBox = (target: EventTarget | null) => Option.exists(Option.liftPredicate(target, isElement), insideBox)

const onFocusIn = (event: Event) => {
  const target = event.target
  if (target instanceof HTMLInputElement) target.select()
}

type ClickedRoot = ReturnType<typeof Message.ClickedRoot>

const rootEvents = (queue: Queue.Queue<ClickedRoot, Cause.Done>, element: Element) => {
  const onMouseDown = (event: Event) => {
    if (!pressedBox(event.target)) return
    event.preventDefault()
    Queue.offerUnsafe(queue, Message.ClickedRoot())
  }
  element.addEventListener("mousedown", onMouseDown)
  element.addEventListener("focusin", onFocusIn)

  return () => {
    element.removeEventListener("mousedown", onMouseDown)
    element.removeEventListener("focusin", onFocusIn)
  }
}

const RootEvents = Mount.defineStream("TimePickerRoot", {
  messages: [Message.ClickedRoot],
  execute: ({ element }) =>
    Stream.callback<ClickedRoot>((queue) =>
      Effect.acquireRelease(
        Effect.sync(() => rootEvents(queue, element)),
        (stop) => Effect.sync(stop)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

const keepFocus = (event: Event) => event.preventDefault()

const scrollActive = (element: Element) =>
  element.querySelectorAll("[data-scroll-list]").forEach((list) => {
    const active = list.querySelector("[data-active]")
    if (active instanceof HTMLElement) Reflect.set(list, "scrollTop", active.offsetTop - list.clientHeight / 2)
  })

const AnchorDropdown = Mount.define("TimePickerDropdown", {
  args: { rootId: Schema.String, portal: Schema.Boolean },
  messages: [Message.CompletedFocus],
  execute: Effect.fn("TimePickerDropdown")(function* ({ element, rootId, portal }) {
    yield* Effect.acquireRelease(
      Effect.sync(() => {
        const cleanup = anchorSetup(element, {
          buttonId: rootId,
          anchor: { placement: "bottom-start", gap: 8, padding: 8, portal },
          interceptTab: false,
          focusAfterPosition: false
        })
        element.addEventListener("mousedown", keepFocus)
        scrollActive(element)

        return () => {
          element.removeEventListener("mousedown", keepFocus)
          cleanup()
        }
      }),
      (stop) => Effect.sync(stop)
    )

    return Message.CompletedFocus()
  })
})

const enterKey = <M>(h: HtmlBuilder<M>, message: M) =>
  h.OnKeyDownPreventDefault((key) => (key === "Enter" ? Option.some(message) : Option.none()))

const isGroups = (presets: TimePickerPresets): presets is ReadonlyArray<TimePickerPresetGroup> =>
  presets.some((item) => typeof item !== "string")

const amPmKey = (key: string) => {
  if (key === "a" || key === "A") return "KeyA"

  return key === "p" || key === "P" ? "KeyP" : ""
}

const spinKeys = new Set(["Home", "End", "Backspace", "Delete", "ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"])

const amPmKeys = new Set([
  "Home",
  "End",
  "Backspace",
  "Delete",
  "ArrowLeft",
  "ArrowUp",
  "ArrowDown",
  "a",
  "A",
  "p",
  "P"
])

export const TimePicker = (config: {
  readonly Input?: InputConfig
  readonly InputWrapper?: InputWrapperConfig
  readonly CloseButton?: CloseButtonConfig
  readonly TimePicker?: TimePickerConfig
}) => {
  const base = inputBase("TimePicker")(config)
  const clear = InputClearButton(config)

  return <M>(h: HtmlBuilder<M>, props: TimePickerProps<M>): Html => {
    const send = props.toParentMessage
    const getStyles = stylesApi<M, TimePickerPart>(h, props, undefined, "fieldsRoot")
    const id = props.model.id
    const rootId = `${id}-root`
    const fields = props.model.fields
    const format = formatOf(props)
    const duration = props.type === "duration"
    const blocked = props.readOnly === true || props.disabled === true
    const labels = props.amPmLabels ?? defaultAmPmLabels
    const withSeconds = props.withSeconds === true
    const minHoursDigits = props.minHoursDigits ?? 2
    const hasValue = fields.hours !== null || fields.minutes !== null || fields.seconds !== null || fields.amPm !== null
    const clearable = props.clearable === true && !blocked && hasValue
    const paste = h.OnPastePreventDefault((text) => Option.some(send(Message.Pasted({ text }))))
    const spin = (field: NumberField, label: string | undefined, placeholder: string) => {
      const bounds = boundsOf(field, props)
      const value = fields[field]
      const width =
        duration && field === "hours"
          ? [h.Style({ width: `calc(${Math.max(minHoursDigits, padTime(value ?? 0).length)}ch + 0.3em)` })]
          : []

      return h.input([
        ...getStyles("field", styles.field),
        ...width,
        h.Id(fieldId(id, field)),
        h.Type("text"),
        h.Role("spinbutton"),
        h.Attribute("aria-valuemin", String(bounds.min)),
        ...(Number.isFinite(bounds.max) ? [h.Attribute("aria-valuemax", String(bounds.max))] : []),
        h.Attribute("aria-valuenow", String(value ?? 0)),
        ...(value === null ? [h.DataAttribute("empty", "")] : []),
        h.Attribute("inputmode", "numeric"),
        h.Placeholder(placeholder),
        h.Value(value === null ? "" : padTime(value)),
        ...(label === undefined ? [] : [h.AriaLabel(label)]),
        ...(field === "hours" ? [] : [h.Tabindex(-1)]),
        ...(props.readOnly === true ? [h.Readonly(true)] : []),
        ...(props.disabled === true ? [h.Disabled(true)] : []),
        h.OnInput((text) => send(Message.Typed({ field, text }))),
        h.OnKeyDownPreventDefault((key) =>
          spinKeys.has(key) ? Option.some(send(Message.PressedKey({ field, key, wholeSelected: true }))) : Option.none()
        ),
        h.OnFocus(send(Message.FocusedField())),
        ...(field === "hours"
          ? [h.OnBlur(send(Message.LeftHours({ text: value === null ? "" : padTime(value) })))]
          : []),
        paste
      ])
    }
    const amPmField = () => {
      const common = [
        ...getStyles("field", styles.field, styles.amPm),
        h.Id(fieldId(id, "amPm")),
        h.DataAttribute("am-pm", ""),
        h.Tabindex(-1),
        ...(props.amPmInputLabel === undefined ? [] : [h.AriaLabel(props.amPmInputLabel)]),
        ...(props.disabled === true ? [h.Disabled(true)] : []),
        h.OnKeyDownPreventDefault((key) =>
          amPmKeys.has(key) ? Option.some(send(Message.PressedAmPmKey({ key, code: amPmKey(key) }))) : Option.none()
        ),
        h.OnFocus(send(Message.FocusedField())),
        paste
      ]
      if (props.withDropdown === true) {
        const shown = fields.amPm ?? "--"

        return h.input([...common, h.Value(shown), h.Attribute("size", String(shown.length + 1)), h.Readonly(true)])
      }

      return h.select(
        [...common, h.OnChange((value) => send(Message.ChoseAmPm({ value: value === "" ? null : value })))],
        [
          h.option([h.Value(""), h.Selected(fields.amPm === null)], ["--"]),
          ...[labels.am, labels.pm].map((label) =>
            h.option([h.Value(label), h.Selected(fields.amPm === label)], [label])
          )
        ]
      )
    }
    const fieldsGroup = h.div(
      [h.Attribute("dir", "ltr"), ...getStyles("fieldsRoot", styles.fieldsRoot)],
      [
        h.div(
          [
            ...getStyles("fieldsGroup", styles.fieldsGroup),
            h.OnFocusLeave(send(Message.LeftFields())),
            ...(props.onEnter === undefined ? [] : [enterKey(h, props.onEnter)])
          ],
          [
            spin(
              "hours",
              props.hoursInputLabel,
              duration && props.hoursPlaceholder === undefined
                ? "-".repeat(minHoursDigits)
                : (props.hoursPlaceholder ?? "--")
            ),
            h.span([], [":"]),
            spin("minutes", props.minutesInputLabel, props.minutesPlaceholder ?? "--"),
            ...(withSeconds
              ? [h.span([], [":"]), spin("seconds", props.secondsInputLabel, props.secondsPlaceholder ?? "--")]
              : []),
            ...(format === "12h" && !duration ? [amPmField()] : [])
          ]
        )
      ]
    )
    const maxHeight = props.maxDropdownContentHeight ?? 200
    const control = (label: string, active: boolean, message: Message, value: string) =>
      h.button(
        [
          ...getStyles("control", unstyledButtonStyles.root, styles.control, active && styles.active),
          h.Type("button"),
          h.Tabindex(-1),
          h.DataAttribute("value", value),
          ...(active ? [h.DataAttribute("active", "")] : []),
          h.OnClick(send(message))
        ],
        [label]
      )
    const list = (field: NumberField) => {
      const bounds = boundsOf(field, { ...props, type: "time" })
      const range = valuesRange(bounds.min, bounds.max, bounds.step)
      const ordered = props.reverseTimeControlsList === true ? range.toReversed() : range

      return h.div(
        [
          ...getStyles("scrollarea", styles.scrollarea),
          h.Style({ maxHeight: `${maxHeight}px` }),
          h.DataAttribute("scroll-list", "")
        ],
        [
          h.div(
            getStyles("controlsList", styles.controlsList),
            ordered.map((value) =>
              control(padTime(value), fields[field] === value, Message.ChoseNumber({ field, value }), String(value))
            )
          )
        ]
      )
    }
    const current = hiddenValue(props.model, props)
    const preset = (value: string) =>
      h.button(
        [
          ...getStyles(
            "presetControl",
            unstyledButtonStyles.root,
            styles.presetControl,
            isSameTime(value, current, withSeconds) && current !== "" && styles.active
          ),
          h.Type("button"),
          ...(isSameTime(value, current, withSeconds) && current !== "" ? [h.DataAttribute("active", "")] : []),
          h.OnClick(send(Message.ChosePreset({ value })))
        ],
        [timeValue({ value, format, amPmLabels: labels, withSeconds })]
      )
    const grid = (values: ReadonlyArray<string>) =>
      h.div(
        [
          ...getStyles("presetsRoot", styles.presetsGrid),
          h.Style({ gridTemplateColumns: `repeat(${withSeconds ? 2 : 3}, 1fr)` })
        ],
        values.map(preset)
      )
    const presetsBody = (presets: TimePickerPresets) => {
      if (!isGroups(presets)) return grid(presets.filter((item) => typeof item === "string"))

      return h.div(
        getStyles("presetsRoot"),
        presets.map((group) =>
          h.div(getStyles("presetsGroup", styles.presetsGroup), [
            h.div(getStyles("presetsGroupLabel", styles.presetsGroupLabel), [group.label]),
            grid(group.values)
          ])
        )
      )
    }
    const presetsView = (presets: TimePickerPresets) =>
      h.div(
        [...getStyles("scrollarea", styles.scrollarea), h.Style({ maxHeight: `${maxHeight}px` })],
        [presetsBody(presets)]
      )
    const showsDropdown = props.model.opened && props.withDropdown === true && !blocked && !duration
    const dropdown = showsDropdown
      ? [
          h.div(
            [
              ...getStyles("dropdown", dropdownStyles.dropdown, styles.dropdown, setVars([popoverVars.zIndex, "300"])),
              h.DataAttribute("time-picker-dropdown", ""),
              h.OnMount(Mount.mapMessage(AnchorDropdown({ rootId, portal: props.withinPortal ?? true }), send))
            ],
            [
              props.presets === undefined
                ? h.div(getStyles("controlsListGroup", styles.controlsListGroup), [
                    list("hours"),
                    list("minutes"),
                    ...(withSeconds ? [list("seconds")] : []),
                    ...(format === "12h"
                      ? [
                          h.div(
                            getStyles("controlsList", styles.controlsList),
                            [labels.am, labels.pm].map((label) =>
                              control(label, fields.amPm === label, Message.ChoseAmPm({ value: label }), label)
                            )
                          )
                        ]
                      : [])
                  ])
                : presetsView(props.presets)
            ]
          )
        ]
      : []
    const {
      model: _model,
      toParentMessage: _toParent,
      styles: _styles,
      clearable: _clearable,
      withDropdown: _withDropdown,
      presets: _presets,
      maxDropdownContentHeight: _maxHeight,
      reverseTimeControlsList: _reversed,
      hoursInputLabel: _hoursLabel,
      minutesInputLabel: _minutesLabel,
      secondsInputLabel: _secondsLabel,
      amPmInputLabel: _amPmLabel,
      hoursPlaceholder: _hoursPlaceholder,
      minutesPlaceholder: _minutesPlaceholder,
      secondsPlaceholder: _secondsPlaceholder,
      minHoursDigits: _digits,
      withinPortal: _portal,
      onEnter: _onEnter,
      type: _type,
      format: _format,
      withSeconds: _withSeconds,
      amPmLabels: _labels,
      min: _min,
      max: _max,
      hoursStep: _hoursStep,
      minutesStep: _minutesStep,
      secondsStep: _secondsStep,
      closeDropdownOnPresetSelect: _closeOnPreset,
      pasteSplit: _pasteSplit,
      name,
      ...field
    } = props

    return h.div(
      [h.OnMount(Mount.mapMessage(RootEvents(), send))],
      [
        base(h, {
          ...field,
          id: rootId,
          component: "div",
          styles: mergeStyles(inputParts, props.styles),
          attributes: {
            ...props.attributes,
            input: { ...props.attributes?.input, "data-time-picker": "" }
          },
          ...(clearable
            ? {
                rightSectionPointerEvents: "all" as const,
                rightSection: clear(h, { onClick: send(Message.Cleared()), label: "Clear" })
              }
            : {}),
          children: [fieldsGroup]
        }),
        ...dropdown,
        ...(name === undefined ? [] : [h.input([h.Type("hidden"), h.Name(name), h.Value(current)])])
      ]
    )
  }
}
