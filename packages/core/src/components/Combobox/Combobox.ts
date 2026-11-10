import * as stylex from "@stylexjs/stylex"
import * as FoldkitCombobox from "@foldkit/ui/combobox"
import { Array as Arr, Option, Predicate, Struct } from "effect"
import { childAttributes } from "foldkit/html"
import type { ChildAttribute, Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { radiusValue, stylePropNames } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, setVars, stylesApi, sx, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { accent, colors, fontSize, fontWeight, radius } from "../../theme/tokens.stylex.ts"
import { inputVars } from "../Input/Input.stylex.ts"
import { inputLook, isShown } from "../Input/Input.ts"
import type { InputSize, InputVariant } from "../Input/Input.ts"
import { InputWrapper } from "../Input/InputWrapper.ts"
import type { InputWrapperConfig, InputWrapperOptions } from "../Input/InputWrapper.ts"
import { dropdownStyles } from "../Popover/Popover.ts"
import { popoverVars } from "../Popover/Popover.stylex.ts"

const bundle = FoldkitCombobox.create()

export const { Message, OutMessage } = FoldkitCombobox

export const { update, open, close, selectItem } = bundle

export const Model = FoldkitCombobox.Model

export type Model = FoldkitCombobox.Model

export type Message = FoldkitCombobox.Message

export type OutMessage = FoldkitCombobox.OutMessage

export const init = (config: FoldkitCombobox.InitConfig & { readonly inputValue?: string }): Model => ({
  ...FoldkitCombobox.init({ isAnimated: true, ...config }),
  inputValue: config.inputValue ?? ""
})

export type ComboboxItem = {
  readonly value: string
  readonly label: string
  readonly disabled?: boolean
  readonly group?: string
}

export type ComboboxData = ReadonlyArray<string | ComboboxItem>

export type ComboboxPart = "wrapper" | "input" | "section" | "dropdown" | "option" | "empty" | "groupLabel"

export type ComboboxOptions = InputWrapperOptions & {
  readonly size?: InputSize
  readonly radius?: StyleValue
  readonly variant?: InputVariant
  readonly withCheckIcon?: boolean
  readonly checkIconPosition?: "left" | "right"
  readonly searchable?: boolean
  readonly maxDropdownHeight?: number
  readonly hiddenDropdown?: boolean
  readonly withinPortal?: boolean
}

export type ComboboxProps<M> = ComboboxOptions &
  StylesApiProps<ComboboxPart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly data: ComboboxData
    readonly value?: string | null
    readonly label?: Child
    readonly description?: Child
    readonly error?: boolean | Child
    readonly required?: boolean
    readonly withAsterisk?: boolean
    readonly placeholder?: string
    readonly disabled?: boolean
    readonly readOnly?: boolean
    readonly name?: string
    readonly nothingFoundMessage?: Child
    readonly filter?: (query: string, item: ComboboxItem) => boolean
    readonly limit?: number
    readonly withChevron?: boolean
    readonly clearMessage?: M
    readonly freeText?: boolean
    readonly ariaLabel?: string
  }

export type ComboboxConfig = ComponentConfig<ComboboxOptions, ComboboxPart>

export const optionPadding = stylex.create({
  xs: { paddingBlock: "4px", paddingInline: "8px" },
  sm: { paddingBlock: "6px", paddingInline: "10px" },
  md: { paddingBlock: "8px", paddingInline: "12px" },
  lg: { paddingBlock: "10px", paddingInline: "16px" },
  xl: { paddingBlock: "14px", paddingInline: "20px" }
})

const styles = stylex.create({
  root: { display: "block" },
  dropdown: { paddingBlock: "4px", paddingInline: "4px", [popoverVars.width]: "var(--button-width)" },
  scroll: { overflowY: "auto" },
  reverse: { justifyContent: "space-between" },
  option: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: inputVars.fz,
    borderRadius: radius.default,
    backgroundColor: { default: "transparent", ":hover": `light-dark(${palette.gray0}, ${palette.dark7})` },
    color: "inherit",
    cursor: "pointer",
    overflowWrap: "break-word"
  },
  active: {
    backgroundColor: { default: accent.filled, ":hover": accent.filled },
    color: palette.white
  },
  hovered: { backgroundColor: `light-dark(${palette.gray0}, ${palette.dark7})` },
  disabled: { cursor: "not-allowed", opacity: 0.35 },
  check: { width: "0.8em", height: "0.8em", flexShrink: 0, opacity: 0.4 },
  checkActive: { opacity: 1 },
  empty: { fontSize: inputVars.fz, textAlign: "center", color: colors.dimmed, cursor: "default" },
  groupLabel: {
    color: colors.dimmed,
    fontSize: `calc(${fontSize.sm} * 0.85)`,
    fontWeight: fontWeight.medium,
    display: "flex",
    alignItems: "center"
  },
  chevron: {
    position: "absolute",
    zIndex: 1,
    top: "1px",
    bottom: "1px",
    insetInlineEnd: "1px",
    width: inputVars.rightSize,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    color: inputVars.section,
    cursor: "pointer"
  },
  chevronIcon: { width: "15px", height: "15px" },
  pointer: { cursor: "pointer" },
  hiddenDropdown: { display: "none" },
  withRight: { paddingInlineEnd: inputVars.rightSize }
})

const empty = "\u0000empty"

const nothing: ComboboxItem = { value: empty, label: "", disabled: true }

export const chevronPath =
  "M4.93179 5.43179C4.75605 5.60753 4.75605 5.89245 4.93179 6.06819C5.10753 6.24392 5.39245 6.24392 5.56819 6.06819L7.49999 4.13638L9.43179 6.06819C9.60753 6.24392 9.89245 6.24392 10.0682 6.06819C10.2439 5.89245 10.2439 5.60753 10.0682 5.43179L7.81819 3.18179C7.73379 3.0974 7.61933 3.04999 7.49999 3.04999C7.38064 3.04999 7.26618 3.0974 7.18179 3.18179L4.93179 5.43179ZM10.0682 9.56819C10.2439 9.39245 10.2439 9.10753 10.0682 8.93179C9.89245 8.75606 9.60753 8.75606 9.43179 8.93179L7.49999 10.8636L5.56819 8.93179C5.39245 8.75606 5.10753 8.75606 4.93179 8.93179C4.75605 9.10753 4.75605 9.39245 4.93179 9.56819L7.18179 11.8182C7.26618 11.9026 7.38064 11.95 7.49999 11.95C7.61933 11.95 7.73379 11.9026 7.81819 11.8182L10.0682 9.56819Z"

const crossPath =
  "M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"

const checkPath =
  "M4 4.586L1.707 2.293A1 1 0 1 0 .293 3.707l3 3a.997.997 0 0 0 1.414 0l5-5A1 1 0 1 0 8.293.293L4 4.586z"

export const toItem = (item: string | ComboboxItem): ComboboxItem =>
  Predicate.isString(item) ? { value: item, label: item } : item

const contains = (query: string, item: ComboboxItem) => item.label.toLowerCase().includes(query.trim().toLowerCase())

type ComboboxStyles<M> = ReturnType<typeof stylesApi<M, ComboboxPart>>

export type ComboboxListProps = Pick<
  ComboboxProps<never>,
  | "data"
  | "filter"
  | "limit"
  | "nothingFoundMessage"
  | "withCheckIcon"
  | "checkIconPosition"
  | "maxDropdownHeight"
  | "hiddenDropdown"
  | "size"
>

export type ListInputs = {
  readonly items: ReadonlyArray<string>
  readonly itemToConfig: (value: string, context: { readonly isActive: boolean }) => { readonly content: Html }
  readonly itemToValue: (value: string) => string
  readonly itemToDisplayText: (value: string) => string
  readonly isItemDisabled: (value: string) => boolean
  readonly itemsAttributes: ReadonlyArray<ChildAttribute>
  readonly itemsScrollAttributes?: ReadonlyArray<ChildAttribute>
  readonly itemGroupKey?: (value: string) => string
  readonly groupToHeading?: (key: string) => { readonly content: Html } | undefined
}

export const listInputs = <M>(
  h: HtmlBuilder<M>,
  props: ComboboxListProps,
  getStyles: ComboboxStyles<M>,
  list: {
    readonly query: string
    readonly showAll: boolean
    readonly isChosen: (value: string) => boolean
    readonly pointer?: boolean
  }
): ListInputs => {
  const size = props.size ?? "sm"
  const items = props.data.map(toItem)
  const filter = props.filter ?? contains
  const matching = list.showAll ? items : items.filter((item) => filter(list.query, item))
  const shown = props.limit === undefined ? matching : matching.slice(0, props.limit)
  const nothingFound = Option.filter(Option.fromNullishOr(props.nothingFoundMessage), () => shown.length === 0)
  const listed = Option.isSome(nothingFound) ? [nothing] : shown
  const itemOf = (value: string) => Option.getOrThrow(Arr.findFirst(listed, (item) => item.value === value))
  const reverse = props.checkIconPosition === "right"
  const check = (active: boolean) =>
    h.svg(
      [
        ...sx(h, styles.check, active && styles.checkActive),
        h.Attribute("viewBox", "0 0 10 7"),
        h.Attribute("fill", "none"),
        h.AriaHidden(true)
      ],
      [h.path([h.Attribute("d", checkPath), h.Attribute("fill", "currentColor")], [])]
    )
  const checkOf = (item: ComboboxItem, active: boolean) =>
    props.withCheckIcon !== false && list.isChosen(item.value) ? [check(active)] : []
  const optionOf = (item: ComboboxItem, context: { readonly isActive: boolean }) => {
    const selected = context.isActive && list.pointer !== true
    const hovered = context.isActive && list.pointer === true

    return h.div(
      [
        ...getStyles(
          "option",
          styles.option,
          optionPadding[size],
          selected && styles.active,
          hovered && styles.hovered,
          item.disabled === true && styles.disabled,
          reverse && styles.reverse
        ),
        ...(selected ? [h.DataAttribute("combobox-selected", "")] : []),
        ...(list.isChosen(item.value) ? [h.DataAttribute("checked", "")] : []),
        ...(list.isChosen(item.value) ? [h.DataAttribute("combobox-active", "")] : []),
        ...(item.disabled === true ? [h.DataAttribute("combobox-disabled", "")] : []),
        ...(reverse ? [h.DataAttribute("reverse", "")] : [])
      ],
      reverse
        ? [h.span([], [item.label]), ...checkOf(item, selected)]
        : [...checkOf(item, selected), h.span([], [item.label])]
    )
  }
  const optionView = (value: string, context: { readonly isActive: boolean }) =>
    value === empty
      ? h.div(getStyles("empty", styles.empty, optionPadding[size]), [Option.getOrThrow(nothingFound)])
      : optionOf(itemOf(value), context)
  const grouped = shown.some((item) => item.group !== undefined)

  return {
    items: listed.map((item) => item.value),
    itemToConfig: (value: string, context: { readonly isActive: boolean }) => ({ content: optionView(value, context) }),
    itemToValue: (value: string) => value,
    itemToDisplayText: (value: string) => itemOf(value).label,
    isItemDisabled: (value: string) => itemOf(value).disabled === true,
    itemsAttributes: childAttributes([
      ...getStyles("dropdown", dropdownStyles.dropdown, styles.dropdown, setVars([popoverVars.zIndex, "300"])),
      ...(listed.length === 0 || props.hiddenDropdown === true ? [h.DataAttribute("hidden", "")] : []),
      ...(props.hiddenDropdown === true ? sx(h, styles.hiddenDropdown) : [])
    ]),
    ...(props.maxDropdownHeight === undefined
      ? {}
      : {
          itemsScrollAttributes: childAttributes([
            ...sx(h, styles.scroll),
            h.Style({ maxHeight: `${props.maxDropdownHeight}px` })
          ])
        }),
    ...(grouped
      ? {
          itemGroupKey: (value: string) => itemOf(value).group ?? "",
          groupToHeading: (key: string) =>
            key === ""
              ? undefined
              : { content: h.div(getStyles("groupLabel", styles.groupLabel, optionPadding[size]), [key]) }
        }
      : {})
  }
}

export const chevronIcon = <M>(h: HtmlBuilder<M>, clear: boolean) =>
  h.svg(
    [...sx(h, styles.chevronIcon), h.Attribute("viewBox", "0 0 15 15"), h.Attribute("fill", "none")],
    [h.path([h.Attribute("d", clear ? crossPath : chevronPath), h.Attribute("fill", "currentColor")], [])]
  )

export const sectionButtonStyles = styles.chevron

export const optionStyles = {
  dropdown: [dropdownStyles.dropdown, styles.dropdown],
  scroll: styles.scroll,
  option: styles.option,
  active: styles.active,
  disabled: styles.disabled,
  empty: styles.empty,
  check: styles.check,
  checkActive: styles.checkActive
}

export const checkIconPath = checkPath

export const emptyItem = empty

const atChosen = (isOpen: boolean, chosen: Option.Option<number>, fallback: Message): Message =>
  isOpen
    ? fallback
    : Option.match(chosen, {
        onNone: () => fallback,
        onSome: (index) => Message.Opened({ maybeActiveItemIndex: Option.some(index) })
      })

export const comboboxWith = (
  own: ComboboxConfig | undefined,
  config: { readonly InputWrapper?: InputWrapperConfig }
) => {
  const wrapper = InputWrapper(config)

  return <M>(h: HtmlBuilder<M>, input: ComboboxProps<M>): Html => {
    const props = withDefaults(own, input)
    const getStyles = stylesApi<M, ComboboxPart>(h, props, own, "wrapper")
    const size = props.size ?? "sm"
    const variant = props.variant ?? "default"
    const items = props.data.map(toItem)
    const freeText = props.freeText === true
    const chosen = freeText ? null : props.value
    const selected = Arr.findFirst(items, (item) => item.value === chosen)
    const query = props.model.inputValue
    const resting = freeText ? query : Option.match(selected, { onNone: () => "", onSome: (item) => item.label })
    const error = isShown(props.error)
    const withChevron = props.withChevron !== false
    const withButton = withChevron || props.clearMessage !== undefined
    const searchable = props.searchable !== false
    const interactive = props.disabled !== true && props.readOnly !== true
    const list = listInputs(h, props, getStyles, {
      query,
      showAll: !freeText && query === resting,
      isChosen: (value) => value === chosen,
      pointer: props.model.activationTrigger === "Pointer"
    })
    const chosenIndex = Arr.findFirstIndex(list.items, (value) => value === chosen)
    const toggle = props.toParentMessage(
      atChosen(
        props.model.isOpen,
        chosenIndex,
        Message.PressedToggleButton({ restingInputValue: resting, isClearable: false })
      )
    )
    const button = (clear: M | undefined) =>
      clear === undefined
        ? {
            buttonContent: chevronIcon(h, false),
            buttonAttributes: childAttributes([...getStyles("section", styles.chevron), h.AriaLabel("Toggle options")])
          }
        : {
            buttonContent: chevronIcon(h, true),
            buttonAttributes: childAttributes([
              ...getStyles("section", styles.chevron),
              h.AriaLabel("Clear"),
              h.OnClick(clear)
            ])
          }

    return wrapper(h, {
      ...Struct.pick(props, stylePropNames),
      id: FoldkitCombobox.inputId(props.model.id),
      size,
      ...(props.label === undefined ? {} : { label: props.label }),
      ...(props.description === undefined ? {} : { description: props.description }),
      ...(props.error === undefined ? {} : { error: props.error }),
      ...(props.required === undefined ? {} : { required: props.required }),
      ...(props.withAsterisk === undefined ? {} : { withAsterisk: props.withAsterisk }),
      ...(props.inputWrapperOrder === undefined ? {} : { inputWrapperOrder: props.inputWrapperOrder }),
      input: (wiring) =>
        h.submodel({
          slotId: props.model.id,
          model: props.model,
          view: bundle.view,
          toParentMessage: (message: Message) =>
            props.toParentMessage(
              message._tag === "Opened" ? atChosen(props.model.isOpen, chosenIndex, message) : message
            ),
          viewInputs: {
            ...list,
            maybeSelectedValue: Option.map(selected, (item) => item.value),
            restingInputValue: resting,
            ...(props.placeholder === undefined ? {} : { inputPlaceholder: props.placeholder }),
            inputWrapperAttributes: childAttributes(
              getStyles(
                "wrapper",
                inputLook.styles.wrapper,
                inputLook.sizes[size],
                inputLook.variants[variant],
                wiring.offsetTop === true && inputLook.styles.offsetTop,
                wiring.offsetBottom === true && inputLook.styles.offsetBottom,
                error && inputLook.styles.error,
                error && inputLook.styles.errorBorder,
                setDefinedVars([inputVars.radius, mapDefined(props.radius, radiusValue)])
              )
            ),
            inputAttributes: childAttributes([
              ...getStyles(
                "input",
                inputLook.styles.input,
                withButton && styles.withRight,
                !searchable && styles.pointer,
                props.disabled === true && inputLook.styles.disabled
              ),
              ...(searchable ? [] : [h.Readonly(true)]),
              ...(!searchable && interactive ? [h.OnClick(toggle)] : []),
              ...(wiring.describedBy === undefined ? [] : [h.AriaDescribedBy(wiring.describedBy)]),
              ...(props.disabled === true ? [h.Disabled(true)] : []),
              h.DataAttribute("variant", variant)
            ]),
            ...(withButton ? button(props.clearMessage) : {}),
            ...(props.name === undefined ? {} : { formName: props.name }),
            isDisabled: props.disabled === true,
            isReadOnly: props.readOnly === true,
            isInvalid: error,
            anchor: { placement: "bottom", gap: 8, portal: props.withinPortal ?? true },
            ...(props.ariaLabel === undefined ? {} : { ariaLabel: props.ariaLabel })
          }
        })
    })
  }
}

export const Combobox = (config: { readonly Combobox?: ComboboxConfig; readonly InputWrapper?: InputWrapperConfig }) =>
  comboboxWith(config.Combobox, config)
