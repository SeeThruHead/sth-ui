import * as stylex from "@stylexjs/stylex"
import * as FoldkitCombobox from "@foldkit/ui/combobox"
import { Array as Arr, Option, Schema, Struct } from "effect"
import * as Command from "foldkit/command"
import { childAttributes } from "foldkit/html"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Child } from "../../content.ts"
import { listOf, mergeStyles, stylesApi, sx, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps, Sx } from "../../styles/StylesApi.ts"
import { inputVars } from "../Input/Input.stylex.ts"
import { isShown } from "../Input/Input.ts"
import { inputBase } from "../Input/InputBase.ts"
import type { InputConfig } from "../Input/Input.ts"
import type { InputWrapperConfig } from "../Input/InputWrapper.ts"
import type { LoaderConfig } from "../Loader/Loader.ts"
import { chevronIcon, listInputs, sectionButtonStyles, toItem } from "../Combobox/Combobox.ts"
import type { ComboboxOptions, ComboboxPart, ComboboxProps } from "../Combobox/Combobox.ts"
import type { CloseButtonConfig } from "../CloseButton/CloseButton.ts"
import { Pill, PillGroup } from "../Pill/Pill.ts"
import type { PillConfig, PillGroupConfig } from "../Pill/Pill.ts"

const bundle = FoldkitCombobox.Multi.create()

export const Model = Schema.Struct({ combobox: FoldkitCombobox.Multi.Model, ignoreClick: Schema.Boolean })

export type Model = typeof Model.Type

export const init = (config: { readonly id: string }): Model => ({
  combobox: FoldkitCombobox.Multi.init({ id: config.id, isAnimated: true }),
  ignoreClick: false
})

export const Message = defineMessageUnion({
  GotCombobox: { message: FoldkitCombobox.Message },
  ClickedBox: {},
  RemovedPill: { value: Schema.String },
  PressedBackspace: {},
  Cleared: {}
})

export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({ Changed: { values: Schema.Array(Schema.String) } })

export type OutMessage = typeof OutMessage.Type

type Update = {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessage?: OutMessage
}

const changed = (values: ReadonlyArray<string>) => ({ outMessage: OutMessage.Changed({ values }) })

const toggled = (values: ReadonlyArray<string>, value: string, maxValues: number) => {
  if (values.includes(value)) return values.filter((kept) => kept !== value)
  if (values.length >= maxValues) return values

  return [...values, value]
}

export const update = (
  model: Model,
  message: Message,
  context: {
    readonly values: ReadonlyArray<string>
    readonly maxValues?: number
    readonly clearSearchOnChange?: boolean
  }
): Update =>
  Message.match(message, {
    GotCombobox: ({ message: inner }) => {
      const result = bundle.update(model.combobox, inner)
      const picked = result.outMessage?._tag === "Selected" ? Option.some(result.outMessage.value) : Option.none()
      const clear = Option.isSome(picked) && context.clearSearchOnChange !== false

      return {
        model: { ...model, combobox: clear ? { ...result.model, inputValue: "" } : result.model },
        commands: (result.commands ?? []).map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotCombobox({ message: lifted }))
        ),
        ...Option.match(picked, {
          onNone: () => ({}),
          onSome: (value) => changed(toggled(context.values, value, context.maxValues ?? Infinity))
        })
      }
    },
    ClickedBox: () =>
      model.ignoreClick
        ? { model: { ...model, ignoreClick: false }, commands: [] }
        : update(model, Message.GotCombobox({ message: toggleMessage }), context),
    RemovedPill: ({ value }) => ({
      model: { ...model, ignoreClick: true },
      commands: [],
      ...changed(context.values.filter((kept) => kept !== value))
    }),
    PressedBackspace: () => ({ model, commands: [], ...changed(context.values.slice(0, -1)) }),
    Cleared: () => ({
      model: { ...model, combobox: { ...model.combobox, inputValue: "" } },
      commands: [],
      ...changed([])
    })
  })

const toggleMessage = FoldkitCombobox.Message.PressedToggleButton({ restingInputValue: "", isClearable: false })

export type MultiSelectPart = ComboboxPart | "pill" | "pillsList" | "inputField"

export type MultiSelectOptions = ComboboxOptions & {
  readonly clearable?: boolean
  readonly hidePickedOptions?: boolean
}

export type MultiSelectProps<M> = Omit<
  ComboboxProps<M>,
  "model" | "toParentMessage" | "value" | "clearMessage" | "freeText" | "withChevron" | "styles"
> &
  MultiSelectOptions &
  StylesApiProps<MultiSelectPart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly value: ReadonlyArray<string>
    readonly leftSection?: Child
  }

export type MultiSelectConfig = ComponentConfig<MultiSelectOptions, MultiSelectPart>

const styles = stylex.create({
  root: { display: "contents" },
  fieldWrapper: { display: "flex", flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: "100px" },
  field: {
    backgroundColor: "transparent",
    appearance: "none",
    width: "100%",
    minWidth: "100px",
    borderWidth: 0,
    fontSize: "inherit",
    height: "1.6em",
    color: "inherit",
    padding: 0,
    outline: { default: null, ":focus": "none" },
    "::placeholder": { color: inputVars.placeholder, opacity: 1 }
  },
  hiddenField: {
    height: "1px",
    width: "1px",
    minWidth: 0,
    position: "absolute",
    top: 0,
    left: 0,
    opacity: 0,
    pointerEvents: "none"
  },
  pointer: { cursor: "pointer" },
  sections: { display: "flex", alignItems: "center", gap: "2px", height: "100%" },
  inlineButton: { position: "static", width: "22px", minWidth: "22px", height: "22px" },
  chevron: { display: "flex", alignItems: "center", justifyContent: "center", width: "18px" }
})

export type PillsComboboxStyles<M> = ReturnType<typeof stylesApi<M, MultiSelectPart>>

export type PillsComboboxList = Pick<
  FoldkitCombobox.Multi.ViewInputs<string>,
  "items" | "itemToConfig" | "itemToValue" | "itemToDisplayText" | "isItemDisabled" | "itemsAttributes"
> &
  Partial<Pick<FoldkitCombobox.Multi.ViewInputs<string>, "itemsScrollAttributes">> & {
    readonly selectedValues: ReadonlyArray<string>
  }

export type PillsComboboxWiring<M> = {
  readonly gotCombobox: (message: FoldkitCombobox.Message) => M
  readonly clickedBox: M
  readonly removedPill: (value: string) => M
  readonly cleared: M
  readonly keyDown: (key: string) => Option.Option<M>
  readonly list?: (getStyles: PillsComboboxStyles<M>) => PillsComboboxList
  readonly pills?: (pillStyles: ReadonlyArray<Sx>) => ReadonlyArray<Html>
  readonly restingInputValue?: string
  readonly showField?: boolean
}

export type PillsComboboxProps<M> = Omit<MultiSelectProps<M>, "toParentMessage"> & { readonly withChevron: boolean }

type PillsComboboxConfigs = {
  readonly Input?: InputConfig
  readonly InputWrapper?: InputWrapperConfig
  readonly Loader?: LoaderConfig
  readonly Pill?: PillConfig
  readonly PillGroup?: PillGroupConfig
  readonly CloseButton?: CloseButtonConfig
}

export const pillsCombobox = (own: MultiSelectConfig | undefined, config: PillsComboboxConfigs) => {
  const base = inputBase("PillsComboboxInput")(config)
  const pill = Pill(config)
  const group = PillGroup(config)

  return <M>(h: HtmlBuilder<M>, input: PillsComboboxProps<M>, wiring: PillsComboboxWiring<M>): Html => {
    const props = withDefaults(own, input)
    const getStyles = stylesApi<M, MultiSelectPart>(h, props, own, "wrapper")
    const size = props.size ?? "sm"
    const parts = mergeStyles(["pill", "pillsList", "input", "wrapper"], own?.styles, props.styles)
    const comboboxId = props.model.combobox.id
    const inputId = FoldkitCombobox.inputId(comboboxId)
    const items = props.data.map(toItem)
    const disabled = props.disabled === true
    const interactive = !disabled && props.readOnly !== true
    const searchable = props.searchable === true
    const query = props.model.combobox.inputValue
    const picked = props.value
    const labelOf = (value: string) =>
      Option.match(
        Arr.findFirst(items, (item) => item.value === value),
        { onNone: () => value, onSome: (item) => item.label }
      )
    const data = props.hidePickedOptions === true ? items.filter((item) => !picked.includes(item.value)) : items
    const clear = props.clearable === true && picked.length > 0 && interactive
    const placeholder = props.placeholder
    const hidden = !searchable && placeholder === undefined && wiring.showField !== true
    const describedBy = [
      isShown(props.error) ? `${inputId}-error` : "",
      props.description === undefined ? "" : `${inputId}-description`
    ]
      .filter((part) => part !== "")
      .join(" ")
    const defaultPills = () =>
      picked.map((value) =>
        pill(h, {
          size,
          disabled,
          withRemoveButton: interactive,
          onRemove: wiring.removedPill(value),
          ...(props.variant === "filled" ? { variant: "contrast" as const } : {}),
          children: [labelOf(value)],
          styles: { root: listOf(parts.pill) }
        })
      )
    const pills = wiring.pills === undefined ? defaultPills() : wiring.pills(listOf(parts.pill))
    const list =
      wiring.list === undefined
        ? {
            ...listInputs(h, { ...props, data }, getStyles, {
              query,
              showAll: query === "",
              isChosen: (value) => picked.includes(value),
              pointer: props.model.combobox.activationTrigger === "Pointer"
            }),
            selectedValues: picked
          }
        : wiring.list(getStyles)
    const field = h.submodel({
      slotId: comboboxId,
      model: props.model.combobox,
      view: bundle.view,
      toParentMessage: wiring.gotCombobox,
      viewInputs: {
        ...list,
        restingInputValue: wiring.restingInputValue ?? "",
        ...(placeholder === undefined ? {} : { inputPlaceholder: placeholder }),
        attributes: childAttributes(sx(h, styles.root)),
        inputWrapperAttributes: childAttributes([h.Id(`${comboboxId}-field-wrapper`), ...sx(h, styles.fieldWrapper)]),
        inputAttributes: childAttributes([
          ...getStyles("inputField", styles.field, hidden && styles.hiddenField, !searchable && styles.pointer),
          ...(searchable ? [] : [h.Readonly(true)]),
          ...(describedBy === "" ? [] : [h.AriaDescribedBy(describedBy)]),
          ...(disabled ? [h.Disabled(true)] : [])
        ]),
        ...(props.name === undefined ? {} : { formName: props.name }),
        isDisabled: disabled,
        isReadOnly: props.readOnly === true,
        isInvalid: isShown(props.error),
        anchor: { placement: "bottom", gap: 8, portal: props.withinPortal ?? true },
        ...(props.ariaLabel === undefined ? {} : { ariaLabel: props.ariaLabel })
      }
    })
    const sections = h.div(sx(h, styles.sections), [
      ...(clear
        ? [
            h.button(
              [
                ...getStyles("section", sectionButtonStyles, styles.inlineButton),
                h.Type("button"),
                h.AriaLabel("Clear"),
                h.OnClick(wiring.cleared)
              ],
              [chevronIcon(h, true)]
            )
          ]
        : []),
      ...(props.withChevron
        ? [h.span([...sx(h, styles.pointer, styles.chevron), h.AriaHidden(true)], [chevronIcon(h, false)])]
        : [])
    ])

    return base(h, {
      ...Struct.omit(props, ["styles", "value", "attributes", "placeholder", "model", "withChevron"]),
      id: inputId,
      component: "div",
      multiline: true,
      withAria: false,
      pointer: !searchable,
      styles: { input: listOf(parts.input), wrapper: listOf(parts.wrapper) },
      rightSection: sections,
      rightSectionPointerEvents: clear ? "all" : "none",
      ...(clear ? { rightSectionWidth: 52 } : {}),
      ...(interactive ? { onClick: wiring.clickedBox, onKeyDown: wiring.keyDown } : {}),
      attributes: { input: { id: `${comboboxId}-input-wrapper` } },
      children: [group(h, { size, styles: { group: listOf(parts.pillsList) }, children: [...pills, field] })]
    })
  }
}

export const MultiSelect = (config: PillsComboboxConfigs & { readonly MultiSelect?: MultiSelectConfig }) => {
  const view = pillsCombobox(config.MultiSelect, config)

  return <M>(h: HtmlBuilder<M>, props: MultiSelectProps<M>): Html => {
    const lift = props.toParentMessage
    const query = props.model.combobox.inputValue

    return view(
      h,
      { ...Struct.omit(props, ["toParentMessage"]), withChevron: true },
      {
        gotCombobox: (message) => lift(Message.GotCombobox({ message })),
        clickedBox: lift(Message.ClickedBox()),
        removedPill: (value) => lift(Message.RemovedPill({ value })),
        cleared: lift(Message.Cleared()),
        keyDown: (key) =>
          key === "Backspace" && query === "" && props.value.length > 0
            ? Option.some(lift(Message.PressedBackspace()))
            : Option.none()
      }
    )
  }
}
