import * as stylex from "@stylexjs/stylex"
import * as FoldkitPopover from "@foldkit/ui/popover"
import { Option, Struct } from "effect"
import { childAttributes } from "foldkit/html"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { mapDefined, setDefinedVars, setVars, stylesApi, sx, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { accent, colors, fontSize, radius, space } from "../../theme/tokens.stylex.ts"
import { sizeValue } from "../../styles/styleProps.ts"
import { AccordionChevron } from "../Accordion/Accordion.ts"
import { checkIconPath, chevronIcon, sectionButtonStyles } from "../Combobox/Combobox.ts"
import { Input } from "../Input/Input.ts"
import type { InputConfig, InputSize } from "../Input/Input.ts"
import { inputBase } from "../Input/InputBase.ts"
import type { InputBasePart, InputBaseProps } from "../Input/InputBase.ts"
import { comboboxChevron } from "../NativeSelect/NativeSelect.ts"
import { Popover } from "../Popover/Popover.ts"
import { cascaderVars as columnVars } from "./Cascader.stylex.ts"
import type { FloatingPosition, PopoverConfig } from "../Popover/Popover.ts"
import {
  columnsOf,
  defaultFilter,
  flattenPaths,
  hasChildren,
  isCascaderKey,
  labelOf,
  Message,
  pathOptions
} from "./model.ts"
import type { CascaderContext, CascaderOption, Model } from "./model.ts"

export { init, Message, Model, OutMessage, update } from "./model.ts"
export type { CascaderContext, CascaderOption, Result } from "./model.ts"

export type CascaderPart =
  | InputBasePart
  | "dropdown"
  | "search"
  | "columnsList"
  | "column"
  | "columnScroll"
  | "columnOption"
  | "columnOptionLabel"
  | "columnOptionIcon"
  | "columnOptionCheck"
  | "columnEmpty"
  | "flatOption"

export type CascaderOptions = {
  readonly size?: InputSize
  readonly withCheckIcon?: boolean
  readonly checkIconPosition?: "left" | "right"
  readonly withColumns?: boolean
  readonly separator?: string
  readonly columnWidth?: number | string
  readonly maxDropdownHeight?: number
  readonly clearable?: boolean
  readonly searchable?: boolean
  readonly position?: FloatingPosition
  readonly withinPortal?: boolean
}

export type CascaderProps<M> = CascaderOptions &
  StylesApiProps<CascaderPart> &
  Omit<
    InputBaseProps<M>,
    "id" | "value" | "onInput" | "onChange" | "component" | "children" | "fieldBind" | "styles"
  > & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly data: ReadonlyArray<CascaderOption>
    readonly value: ReadonlyArray<string> | null
    readonly changeOnSelect?: boolean
    readonly closeOnSelect?: boolean
    readonly allowDeselect?: boolean
    readonly expandTrigger?: "click" | "hover"
    readonly dir?: "ltr" | "rtl"
    readonly formatValue?: (input: {
      readonly value: ReadonlyArray<string>
      readonly options: ReadonlyArray<CascaderOption>
    }) => Child
    readonly renderOption?: (option: CascaderOption, level: number) => Child
    readonly filter?: (query: string, options: ReadonlyArray<CascaderOption>) => boolean
    readonly nothingFoundMessage?: Child
  }

export type CascaderConfig = ComponentConfig<CascaderOptions, CascaderPart>

const styles = stylex.create({
  dropdown: { paddingBlock: 0, paddingInline: 0, overflow: "hidden" },
  columnsList: {
    [columnVars.width]: "200px",
    display: "flex",
    flexDirection: "row",
    alignItems: "stretch",
    outline: "none"
  },
  column: {
    display: "flex",
    flexDirection: "column",
    width: columnVars.width,
    minWidth: columnVars.width,
    borderInlineEndWidth: "1px",
    borderInlineEndStyle: "solid",
    borderInlineEndColor: colors.defaultBorder
  },
  lastColumn: { borderInlineEndColor: "transparent" },
  columnScroll: {
    flex: 1,
    paddingBlock: "4px",
    paddingInline: "4px",
    maxHeight: columnVars.maxHeight,
    overflowY: "auto"
  },
  option: {
    display: "flex",
    alignItems: "center",
    gap: space.xs,
    width: "100%",
    paddingBlock: "6px",
    paddingInline: "10px",
    fontSize: fontSize.sm,
    borderRadius: radius.default,
    color: colors.text,
    cursor: "pointer",
    backgroundColor: { default: "transparent", ":hover": `light-dark(${palette.gray0}, ${palette.dark7})` }
  },
  inPath: {
    backgroundColor: {
      default: `light-dark(${palette.gray1}, ${palette.dark6})`,
      ":hover": `light-dark(${palette.gray1}, ${palette.dark6})`
    }
  },
  active: {
    backgroundColor: { default: accent.filled, ":hover": accent.filledHover },
    color: palette.white
  },
  disabled: {
    color: colors.dimmed,
    cursor: "not-allowed",
    opacity: 0.5,
    backgroundColor: { default: "transparent", ":hover": "transparent" }
  },
  label: { flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  icon: { display: "flex", alignItems: "center", justifyContent: "center", rotate: "-90deg" },
  iconRtl: { rotate: "90deg" },
  check: { width: "0.8em", height: "0.8em", flexShrink: 0 },
  empty: {
    paddingBlock: "6px",
    paddingInline: "10px",
    fontSize: fontSize.sm,
    textAlign: "center",
    color: colors.dimmed
  },
  flat: {
    paddingBlock: "4px",
    paddingInline: "4px",
    overflowY: "auto",
    maxHeight: columnVars.maxHeight,
    outline: "none"
  },
  placeholder: { color: colors.placeholder },
  value: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "start", width: "100%" },
  searchWrapper: { marginBottom: 0 },
  search: {
    borderTopWidth: 0,
    borderInlineWidth: 0,
    borderEndStartRadius: 0,
    borderEndEndRadius: 0,
    borderColor: `light-dark(${palette.gray2}, ${palette.dark4})`
  }
})

export const cascaderContext = <M>(
  props: Pick<
    CascaderProps<M>,
    "data" | "value" | "changeOnSelect" | "closeOnSelect" | "allowDeselect" | "expandTrigger" | "dir"
  >
): CascaderContext => ({
  ...Struct.pick(props, ["changeOnSelect", "closeOnSelect", "allowDeselect", "expandTrigger", "dir"]),
  data: props.data,
  value: props.value
})

const samePrefix = (value: ReadonlyArray<string> | null, path: ReadonlyArray<string>): boolean =>
  value !== null && value.length === path.length && path.every((item, index) => value[index] === item)

export const Cascader = (
  config: {
    readonly Cascader?: CascaderConfig
    readonly Popover?: PopoverConfig
    readonly Input?: InputConfig
  } & Parameters<ReturnType<typeof inputBase<"CascaderInput">>>[0]
) => {
  const base = inputBase("CascaderInput")(config)

  return <M>(h: HtmlBuilder<M>, input: CascaderProps<M>): Html => {
    const props = withDefaults(config.Cascader, input)
    const getStyles = stylesApi<M, CascaderPart>(h, props, config.Cascader, "dropdown")
    const id = props.model.popover.id
    const separator = props.separator ?? "/"
    const toParent = props.toParentMessage
    const rtl = props.dir === "rtl"
    const check = (show: boolean) =>
      props.withCheckIcon === false || !show
        ? []
        : [
            h.svg(
              [
                ...getStyles("columnOptionCheck", styles.check),
                h.Attribute("viewBox", "0 0 10 7"),
                h.Attribute("fill", "none"),
                h.AriaHidden(true)
              ],
              [h.path([h.Attribute("d", checkIconPath), h.Attribute("fill", "currentColor")], [])]
            )
          ]
    const left = props.checkIconPosition === "left"
    const optionView = (level: number, option: CascaderOption): Html => {
      const path = [...props.model.active.slice(0, level), option.value]
      const isActive = props.model.active.length - 1 === level && props.model.active[level] === option.value
      const inPath = !isActive && props.model.active[level] === option.value
      const disabled = option.disabled === true
      const checked = samePrefix(props.value, path)

      return h.div(
        [
          ...getStyles(
            "columnOption",
            styles.option,
            inPath && styles.inPath,
            isActive && styles.active,
            disabled && styles.disabled
          ),
          h.Role("option"),
          h.Id(`${id}-${path.join("-")}`),
          h.AriaSelected(checked),
          ...(isActive ? [h.DataAttribute("active", "")] : []),
          ...(inPath ? [h.DataAttribute("in-path", "")] : []),
          ...(disabled
            ? [h.DataAttribute("disabled", ""), h.AriaDisabled(true)]
            : [
                h.OnClick(toParent(Message.ClickedOption({ level, value: option.value }))),
                h.OnMouseEnter(toParent(Message.HoveredOption({ level, value: option.value })))
              ])
        ],
        [
          ...(left ? check(checked) : []),
          h.span(getStyles("columnOptionLabel", styles.label), [
            props.renderOption?.(option, level) ?? labelOf(option)
          ]),
          ...(hasChildren(option)
            ? [h.span(getStyles("columnOptionIcon", styles.icon, rtl && styles.iconRtl), [AccordionChevron(h, 14)])]
            : []),
          ...(left ? [] : check(checked))
        ]
      )
    }
    const columns = columnsOf(props.data, props.model.active)
    const keys = (key: string) =>
      Option.map(Option.liftPredicate(key, isCascaderKey), () => toParent(Message.PressedKey({ key })))
    const columnsView = h.div(
      [
        ...getStyles(
          "columnsList",
          styles.columnsList,
          setDefinedVars([columnVars.width, mapDefined(props.columnWidth, sizeValue)])
        ),
        h.Id(`${id}-columns`),
        h.Tabindex(-1),
        h.OnKeyDownPreventDefault(keys)
      ],
      columns.map((column, level) =>
        h.div(
          [
            ...getStyles("column", styles.column, level === columns.length - 1 && styles.lastColumn),
            h.Role("listbox"),
            ...(level === columns.length - 1 ? [h.DataAttribute("last", "")] : [])
          ],
          [
            h.div(
              getStyles("columnScroll", styles.columnScroll),
              column.map((option) => optionView(level, option))
            )
          ]
        )
      )
    )
    const query = props.model.search.trim()
    const flatEntries = flattenPaths(props.data).filter(
      (entry) => (entry.leaf || props.changeOnSelect === true) && (props.filter ?? defaultFilter)(query, entry.options)
    )
    const flatView = h.div(
      [...getStyles("columnsList", styles.flat), h.Id(`${id}-columns`), h.Tabindex(-1), h.Role("listbox")],
      flatEntries.length === 0
        ? Option.toArray(Option.fromNullishOr(props.nothingFoundMessage)).map((message) =>
            h.div(getStyles("columnEmpty", styles.empty), [message])
          )
        : flatEntries.map((entry) =>
            h.div(
              [
                ...getStyles("columnOption", styles.option, entry.disabled && styles.disabled),
                ...getStyles("flatOption"),
                h.Role("option"),
                h.AriaSelected(samePrefix(props.value, entry.path)),
                ...(entry.disabled
                  ? [h.AriaDisabled(true), h.DataAttribute("disabled", "")]
                  : [h.OnClick(toParent(Message.ChosePath({ path: entry.path })))])
              ],
              [
                h.span(getStyles("columnOptionLabel", styles.label), [
                  entry.options.map(labelOf).join(` ${separator} `)
                ]),
                ...check(samePrefix(props.value, entry.path))
              ]
            )
          )
    )
    const search = Input(config)(h, {
      id: `${id}-search`,
      value: props.model.search,
      placeholder: "Search...",
      size: props.size ?? "sm",
      onInput: (value) => toParent(Message.Searched({ value })),
      styles: { wrapper: [styles.searchWrapper], input: [styles.search] }
    })
    const flat = props.withColumns === false || query !== ""
    const options = pathOptions(props.data, props.value)
    const shown =
      props.value === null
        ? h.span(sx(h, styles.value, styles.placeholder), [props.placeholder ?? ""])
        : h.span(sx(h, styles.value), [
            props.formatValue?.({ value: props.value, options }) ?? options.map(labelOf).join(` ${separator} `)
          ])
    const clearable = props.clearable === true && props.value !== null && props.disabled !== true
    const field = Struct.omit(props, [
      "model",
      "toParentMessage",
      "data",
      "value",
      "styles",
      "formatValue",
      "renderOption",
      "filter",
      "nothingFoundMessage",
      "placeholder"
    ])

    return h.div(
      [],
      [
        Popover(config)(h, {
          model: props.model.popover,
          toParentMessage: (message) => toParent(Message.GotPopover({ message })),
          position: props.position ?? "bottom-start",
          width: "auto",
          withinPortal: props.withinPortal ?? true,
          disabled: props.disabled === true,
          focusSelector: props.searchable === true ? `#${id}-search` : `#${id}-columns`,
          styles: { dropdown: [styles.dropdown] },
          target: (bind) =>
            base(h, {
              ...field,
              ...Struct.pick(props, ["styles"]),
              id: FoldkitPopover.buttonId(id),
              component: "button",
              pointer: true,
              fieldBind: [...bind, ...childAttributes([h.AriaHasPopup("listbox")])],
              rightSectionPointerEvents: clearable ? "all" : "none",
              rightSection: clearable
                ? h.button(
                    [
                      ...sx(h, sectionButtonStyles),
                      h.Type("button"),
                      h.AriaLabel("Clear"),
                      h.OnClick(toParent(Message.Cleared()))
                    ],
                    [chevronIcon(h, true)]
                  )
                : comboboxChevron(h, props.size ?? "sm", props.error !== undefined && props.error !== false),
              children: [shown]
            }),
          children: [
            h.div(getStyles("dropdown", setVars([columnVars.maxHeight, `${props.maxDropdownHeight ?? 260}px`])), [
              ...(props.searchable === true ? [search] : []),
              flat ? flatView : columnsView
            ])
          ]
        }),
        ...(props.name === undefined
          ? []
          : [h.input([h.Type("hidden"), h.Name(props.name), h.Value((props.value ?? []).join(","))])])
      ]
    )
  }
}
