import * as stylex from "@stylexjs/stylex"
import { Option, Struct } from "effect"
import { childAttributes } from "foldkit/html"
import type { ChildAttribute, Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { listOf, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { listInputs, optionPadding } from "../Combobox/Combobox.ts"
import type { ComboboxData, ComboboxItem, ComboboxPart } from "../Combobox/Combobox.ts"
import { Input } from "../Input/Input.ts"
import { inputVars } from "../Input/Input.stylex.ts"
import type { InputConfig, InputSize } from "../Input/Input.ts"
import { Popover } from "../Popover/Popover.ts"
import type { FloatingPosition, PopoverConfig, PopoverOptions } from "../Popover/Popover.ts"
import { Message } from "./model.ts"
import type { ComboboxPopoverValue, Model } from "./model.ts"

export { init, Message, Model, OutMessage, update } from "./model.ts"
export type { ComboboxPopoverContext, ComboboxPopoverValue, Result } from "./model.ts"

export type ComboboxPopoverPart = ComboboxPart | "search" | "options" | "header" | "footer"

export type ComboboxPopoverOptions = {
  readonly size?: InputSize
  readonly withCheckIcon?: boolean
  readonly checkIconPosition?: "left" | "right"
  readonly maxDropdownHeight?: number
  readonly position?: FloatingPosition
  readonly width?: PopoverOptions["width"]
  readonly offset?: number
  readonly withinPortal?: boolean
}

export type ComboboxPopoverProps<M> = ComboboxPopoverOptions &
  StylesApiProps<ComboboxPopoverPart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly data: ComboboxData
    readonly value: ComboboxPopoverValue
    readonly target: (bind: ReadonlyArray<ChildAttribute>) => Html
    readonly searchable?: boolean
    readonly searchPlaceholder?: string
    readonly filter?: (query: string, item: ComboboxItem) => boolean
    readonly limit?: number
    readonly nothingFoundMessage?: Child
    readonly name?: string
    readonly form?: string
    readonly hiddenInputValuesDivider?: string
    readonly header?: Child
    readonly footer?: Child
  }

export type ComboboxPopoverConfig = ComponentConfig<ComboboxPopoverOptions, ComboboxPopoverPart>

const styles = stylex.create({
  dropdown: { paddingBlock: "4px", paddingInline: "4px" },
  edge: {
    fontSize: inputVars.fz,
    marginInline: "-4px",
    borderWidth: 0,
    borderStyle: "solid",
    borderColor: `light-dark(${palette.gray2}, ${palette.dark4})`
  },
  header: { borderBottomWidth: "1px", marginBottom: "4px", marginTop: "-4px" },
  footer: { borderTopWidth: "1px", marginTop: "4px", marginBottom: "-4px" },
  options: { overflowY: "auto", outline: "none" },
  searchWrapper: { marginInline: "-4px", marginTop: "-4px", marginBottom: "4px", position: "relative" },
  search: {
    borderTopWidth: 0,
    borderInlineWidth: 0,
    borderEndStartRadius: 0,
    borderEndEndRadius: 0,
    borderColor: `light-dark(${palette.gray2}, ${palette.dark4})`,
    backgroundColor: `light-dark(${palette.white}, ${palette.dark7})`
  }
})

const valuesOf = (value: ComboboxPopoverValue): ReadonlyArray<string> => {
  if (value === null) return []
  if (typeof value === "string") return [value]

  return value
}

const isMany = (value: ComboboxPopoverValue): boolean => value !== null && typeof value !== "string"

const isChosen = (value: ComboboxPopoverValue) => (option: string) => valuesOf(value).includes(option)

const keyMessage = (key: string): Option.Option<Message> => {
  if (key === "ArrowDown") return Option.some(Message.Moved({ direction: "next" }))
  if (key === "ArrowUp") return Option.some(Message.Moved({ direction: "previous" }))
  if (key === "Enter") return Option.some(Message.PressedEnter())

  return Option.none()
}

export const optionsOf = (props: {
  readonly data: ComboboxData
  readonly filter?: (query: string, item: ComboboxItem) => boolean
  readonly limit?: number
  readonly searchable?: boolean
  readonly model: Model
}): ReadonlyArray<string> => {
  const query = props.searchable === true ? props.model.search : ""
  const items = props.data.map((item) => (typeof item === "string" ? { value: item, label: item } : item))
  const matching = items.filter((item) => (props.filter ?? defaultFilter)(query, item))
  const shown = props.limit === undefined ? matching : matching.slice(0, props.limit)

  return shown.filter((item) => item.disabled !== true).map((item) => item.value)
}

const defaultFilter = (query: string, item: ComboboxItem): boolean =>
  item.label.toLowerCase().includes(query.trim().toLowerCase())

export const ComboboxPopover =
  (config: {
    readonly ComboboxPopover?: ComboboxPopoverConfig
    readonly Popover?: PopoverConfig
    readonly Input?: InputConfig
  }) =>
  <M>(h: HtmlBuilder<M>, input: ComboboxPopoverProps<M>): Html => {
    const props = withDefaults(config.ComboboxPopover, input)
    const getStyles = stylesApi<M, ComboboxPopoverPart>(h, props, config.ComboboxPopover, "dropdown")
    const id = props.model.popover.id
    const searchable = props.searchable === true
    const chosen = isChosen(props.value)
    const list = listInputs(
      h,
      {
        data: props.data,
        size: props.size ?? "sm",
        withCheckIcon: props.withCheckIcon !== false,
        checkIconPosition: props.checkIconPosition ?? "left",
        ...Struct.pick(props, ["filter", "limit", "nothingFoundMessage"])
      },
      getStyles,
      { query: searchable ? props.model.search : "", showAll: !searchable, isChosen: chosen }
    )
    const optionId = (index: number) => `${id}-option-${index}`
    const activeIndex = list.items.findIndex((value) => value === props.model.active)
    const keys = (key: string) => Option.map(keyMessage(key), props.toParentMessage)
    const keyOf = list.itemGroupKey ?? (() => "")
    const headingOf = list.groupToHeading ?? (() => undefined)
    const optionView = (value: string, index: number): Child =>
      h.div(
        [
          h.Role("option"),
          h.Id(optionId(index)),
          h.AriaSelected(chosen(value)),
          ...(list.isItemDisabled(value)
            ? [h.AriaDisabled(true)]
            : [h.OnClick(props.toParentMessage(Message.Chose({ value })))])
        ],
        [list.itemToConfig(value, { isActive: value === props.model.active }).content]
      )
    const listed = list.items.reduce<{ readonly previous: string | null; readonly children: ReadonlyArray<Child> }>(
      (state, value, index) => {
        const key = keyOf(value)
        const heading = key === state.previous ? [] : Option.toArray(Option.fromNullishOr(headingOf(key)?.content))

        return { previous: key, children: [...state.children, ...heading, optionView(value, index)] }
      },
      { previous: null, children: [] }
    ).children
    const search = Input(config)(h, {
      id: `${id}-search`,
      value: props.model.search,
      placeholder: props.searchPlaceholder ?? "Search...",
      size: props.size ?? "sm",
      onInput: (value) => props.toParentMessage(Message.Searched({ value })),
      onKeyDown: keys,
      styles: { wrapper: [styles.searchWrapper], input: [styles.search, ...listOf(props.styles?.search)] }
    })
    const edge = (part: "header" | "footer", content: Child | undefined): ReadonlyArray<Html> =>
      Option.toArray(
        Option.map(Option.fromNullishOr(content), (shown) =>
          h.div(getStyles(part, styles.edge, styles[part], optionPadding[props.size ?? "sm"]), [shown])
        )
      )
    const options = h.div(
      [
        ...getStyles("options", styles.options),
        h.Id(`${id}-options`),
        h.Role("listbox"),
        h.Tabindex(-1),
        h.Style({ maxHeight: `${props.maxDropdownHeight ?? 220}px` }),
        ...(isMany(props.value) ? [h.AriaMultiSelectable(true)] : []),
        ...(activeIndex === -1 ? [] : [h.AriaActiveDescendant(optionId(activeIndex))]),
        ...(searchable ? [] : [h.OnKeyDownPreventDefault(keys)])
      ],
      listed
    )

    return h.div(
      [],
      [
        Popover(config)(h, {
          model: props.model.popover,
          toParentMessage: (message) => props.toParentMessage(Message.GotPopover({ message })),
          position: props.position ?? "bottom",
          width: props.width ?? "target",
          offset: props.offset ?? 8,
          withinPortal: props.withinPortal ?? true,
          focusSelector: searchable ? `#${id}-search` : `#${id}-options`,
          styles: { dropdown: [styles.dropdown, ...listOf(props.styles?.dropdown)] },
          target: (bind) => props.target([...bind, ...childAttributes([h.AriaHasPopup("listbox")])]),
          children: [
            ...edge("header", props.header),
            ...(searchable ? [search] : []),
            options,
            ...edge("footer", props.footer)
          ]
        }),
        ...(props.name === undefined
          ? []
          : [
              h.input([
                h.Type("hidden"),
                h.Name(props.name),
                h.Value(valuesOf(props.value).join(props.hiddenInputValuesDivider ?? ",")),
                ...(props.form === undefined ? [] : [h.Attribute("form", props.form)])
              ])
            ])
      ]
    )
  }
