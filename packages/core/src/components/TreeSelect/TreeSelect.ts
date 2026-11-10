import * as stylex from "@stylexjs/stylex"
import { Effect, Option, Predicate, Schema, Struct } from "effect"
import { identity } from "effect/Function"
import { childAttributes } from "foldkit/html"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import type { Child } from "../../content.ts"
import { setVars, sx, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, Sx } from "../../styles/StylesApi.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { accent, colors, radius } from "../../theme/tokens.stylex.ts"
import { CheckboxIcon } from "../Checkbox/Checkbox.ts"
import { checkIconPath, emptyItem, optionStyles } from "../Combobox/Combobox.ts"
import { inputVars } from "../Input/Input.stylex.ts"
import { pillsCombobox } from "../MultiSelect/MultiSelect.ts"
import type {
  MultiSelectOptions,
  MultiSelectPart,
  PillsComboboxProps,
  PillsComboboxStyles
} from "../MultiSelect/MultiSelect.ts"
import { Pill } from "../Pill/Pill.ts"
import { popoverVars } from "../Popover/Popover.stylex.ts"
import { findNode } from "../Tree/model.ts"
import type { TreeNodeData } from "../Tree/Tree.ts"
import { labelOf, Message, nodeState, update, visibleNodes } from "./model.ts"
import type {
  CheckedStrategy,
  Model,
  TreeSelectContext,
  TreeSelectFlatNode,
  TreeSelectMode,
  TreeSelectNode
} from "./model.ts"

export {
  ancestorsOf,
  checkedToValue,
  expandToLeafChecked,
  flattenTreeSelectData,
  init,
  Message,
  Model,
  OutMessage
} from "./model.ts"
export type {
  CheckedStrategy,
  InitConfig,
  TreeSelectContext,
  TreeSelectFlatNode,
  TreeSelectMode,
  TreeSelectNode
} from "./model.ts"

export type TreeSelectRenderNodePayload<M> = {
  readonly node: TreeNodeData
  readonly level: number
  readonly expanded: boolean
  readonly hasChildren: boolean
  readonly selected: boolean
  readonly checked: boolean
  readonly indeterminate: boolean
  readonly expand: M
}

export type TreeSelectRenderPillPayload<M> = {
  readonly node: TreeNodeData
  readonly value: string
  readonly onRemove: M
  readonly disabled: boolean
  readonly readOnly: boolean
}

export type TreeSelectChevronAriaLabels = { readonly expand?: string; readonly collapse?: string }

export type TreeSelectPart = MultiSelectPart

export type TreeSelectOptions = Omit<MultiSelectOptions, "hidePickedOptions"> & {
  readonly mode?: TreeSelectMode
  readonly checkStrictly?: boolean
  readonly checkedStrategy?: CheckedStrategy
  readonly expandOnClick?: boolean
  readonly allowDeselect?: boolean
  readonly clearSearchOnChange?: boolean
  readonly maxValues?: number
  readonly maxDisplayedValues?: number
  readonly withLines?: boolean
  readonly chevronAriaLabels?: TreeSelectChevronAriaLabels
}

export type TreeSelectProps<M> = Omit<
  PillsComboboxProps<M>,
  "data" | "value" | "withChevron" | "model" | "hidePickedOptions" | "filter" | "limit" | "withCheckIcon"
> &
  TreeSelectOptions & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly data: ReadonlyArray<TreeNodeData>
    readonly value: string | null | ReadonlyArray<string>
    readonly filter?: (query: string, node: TreeNodeData) => boolean
    readonly maxDisplayedValuesContent?: Child | ((overflow: number) => Child)
    readonly renderNode?: (payload: TreeSelectRenderNodePayload<M>) => Html
    readonly renderPill?: (payload: TreeSelectRenderPillPayload<M>) => Html
  }

export type TreeSelectConfig = ComponentConfig<TreeSelectOptions, TreeSelectPart>

export const valuesOf = (value: string | null | ReadonlyArray<string>): ReadonlyArray<string> =>
  Predicate.isString(value) ? [value] : (value ?? [])

const contextKeys = [
  "mode",
  "checkStrictly",
  "checkedStrategy",
  "expandOnClick",
  "allowDeselect",
  "maxValues",
  "clearSearchOnChange",
  "searchable",
  "filter"
] as const

export const treeSelectContext = (
  props: Pick<TreeSelectProps<never>, "data" | "value" | (typeof contextKeys)[number]>
): TreeSelectContext => ({
  ...Struct.pick(props, contextKeys),
  data: props.data,
  value: valuesOf(props.value)
})

export const contextProps = <Setup extends Partial<Pick<TreeSelectContext, (typeof contextKeys)[number]>>>(
  setup: Setup
) => Struct.pick(setup, contextKeys)

export { update }

const levelOffset = 20

const basePadding = 8

const lineGap = 5

const optionGap = 6

const mirrored = [
  ["aria-level", "data-level"],
  ["aria-expanded", "data-aria-expanded"],
  ["aria-checked", "data-aria-checked"]
] as const

const setAria = (element: Element, name: string, value: string | null) => {
  if (element.getAttribute(name) === value) return
  if (value === null) element.removeAttribute(name)
  else element.setAttribute(name, value)
}

const keepFocus = (event: Event) => event.preventDefault()

const stayInside = (event: Event) => event.stopPropagation()

const SyncOptions = Mount.define("SyncTreeSelectOptions", {
  args: { multiple: Schema.Boolean },
  messages: [Message.SyncedOptions],
  execute: Effect.fn("SyncTreeSelectOptions")(function* ({ element, multiple }) {
    const sync = () => {
      Option.map(Option.fromNullishOr(element.closest("[role='listbox']")), (list) =>
        setAria(list, "aria-multiselectable", String(multiple))
      )
      element
        .querySelectorAll<HTMLElement>("[data-tree-select-option]")
        .forEach((content) =>
          Option.map(Option.fromNullishOr(content.closest("[role='option']")), (option) =>
            mirrored.forEach(([name, source]) => setAria(option, name, content.getAttribute(source)))
          )
        )
    }
    yield* Effect.acquireRelease(
      Effect.sync(() => {
        sync()
        const observer = new MutationObserver(sync)
        observer.observe(element, {
          childList: true,
          subtree: true,
          attributeFilter: mirrored.map(([, source]) => source)
        })
        element.addEventListener("pointerdown", keepFocus, { capture: true })
        element.addEventListener("click", stayInside)

        return () => {
          observer.disconnect()
          element.removeEventListener("pointerdown", keepFocus, { capture: true })
          element.removeEventListener("click", stayInside)
        }
      }),
      (stop) => Effect.sync(stop)
    )

    return Message.SyncedOptions()
  })
})

const styles = stylex.create({
  option: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    position: "relative",
    paddingBlock: "4px",
    paddingInline: "8px"
  },
  expandIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: `calc(1.45 * ${inputVars.fz})`,
    minWidth: `calc(1.45 * ${inputVars.fz})`,
    height: `calc(1.45 * ${inputVars.fz})`,
    borderRadius: radius.sm,
    cursor: "pointer",
    color: colors.dimmed,
    transform: "rotate(-90deg)",
    backgroundColor: { default: null, ":hover": `light-dark(${palette.gray1}, ${palette.dark5})` }
  },
  expandIconOnActive: { color: palette.white },
  expanded: { transform: "rotate(0deg)" },
  chevron: { width: "80%", height: "80%" },
  check: { marginInlineStart: "auto", minWidth: "0.8em" },
  label: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  line: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 0,
    borderInlineStartWidth: "1px",
    borderInlineStartStyle: "solid",
    borderInlineStartColor: colors.defaultBorder,
    pointerEvents: "none"
  },
  lineLast: { bottom: "auto", height: "50%" },
  branch: {
    position: "absolute",
    top: "50%",
    height: 0,
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: colors.defaultBorder,
    pointerEvents: "none"
  },
  box: {
    position: "relative",
    flexShrink: 0,
    width: "18px",
    height: "18px",
    boxSizing: "border-box",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: `light-dark(${palette.gray4}, ${palette.dark4})`,
    borderRadius: radius.sm,
    backgroundColor: `light-dark(${palette.white}, ${palette.dark6})`
  },
  boxOn: { backgroundColor: accent.filled, borderColor: accent.filled },
  boxIcon: {
    position: "absolute",
    inset: 0,
    width: "60%",
    margin: "auto",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    color: palette.white
  },
  dropdown: { [popoverVars.zIndex]: "300" },
  scroll: { overflowY: "auto" }
})

const chevronPath =
  "M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z"

const findData = (value: string, data: ReadonlyArray<TreeNodeData>): TreeNodeData =>
  Option.getOrElse(findNode(data, value), () => ({ value, label: value }))

export const TreeSelect = (
  config: Parameters<typeof pillsCombobox>[1] & { readonly TreeSelect?: TreeSelectConfig }
) => {
  const view = pillsCombobox(config.TreeSelect, config)
  const pill = Pill(config)

  return <M>(h: HtmlBuilder<M>, input: TreeSelectProps<M>): Html => {
    const props = withDefaults(config.TreeSelect, input)
    const lift = props.toParentMessage
    const context = treeSelectContext(props)
    const mode = props.mode ?? "single"
    const multi = mode !== "single"
    const values = context.value
    const disabled = props.disabled === true
    const readOnly = props.readOnly === true
    const withLines = props.withLines !== false
    const flat = visibleNodes(props.model, context)
    const byValue = new Map(flat.map((item) => [item.node.value, item]))
    const nothingFound = Option.filter(Option.fromNullishOr(props.nothingFoundMessage), () => flat.length === 0)
    const items = Option.isSome(nothingFound) ? [emptyItem] : flat.map((item) => item.node.value)
    const labelFor = (value: string) => labelOf(value, props.data)
    const removed = (value: string) => lift(Message.RemovedPill({ value }))
    const labels = {
      expand: props.chevronAriaLabels?.expand ?? "Expand",
      collapse: props.chevronAriaLabels?.collapse ?? "Collapse"
    }

    const lines = (item: TreeSelectFlatNode<TreeSelectNode>) => {
      const at = (column: number, extra: Readonly<Record<string, string>> = {}) =>
        h.Style({ insetInlineStart: `${basePadding + column * levelOffset - levelOffset / 2}px`, ...extra })

      return [
        ...item.lineGuides.flatMap((show, guide) => (show ? [h.span([...sx(h, styles.line), at(guide + 1)], [])] : [])),
        h.span([...sx(h, styles.line, item.isLastChild && styles.lineLast), at(item.level - 1)], []),
        h.span([...sx(h, styles.branch), at(item.level - 1, { width: `${levelOffset / 2}px` })], [])
      ]
    }

    const chevron = (item: TreeSelectFlatNode<TreeSelectNode>, active: boolean) =>
      h.span(
        [
          ...sx(h, styles.expandIcon, active && styles.expandIconOnActive, item.expanded && styles.expanded),
          h.Role("button"),
          h.Tabindex(-1),
          h.AriaLabel(item.expanded ? labels.collapse : labels.expand),
          ...(item.expanded ? [h.DataAttribute("expanded", "")] : []),
          h.OnPointerDown(() => Option.some(lift(Message.PressedChevron({ value: item.node.value }))))
        ],
        [
          h.svg(
            [
              ...sx(h, styles.chevron),
              h.Attribute("viewBox", "0 0 15 15"),
              h.Attribute("fill", "none"),
              h.AriaHidden(true)
            ],
            [h.path([h.Attribute("d", chevronPath), h.Attribute("fill", "currentColor")], [])]
          )
        ]
      )

    const box = (checked: boolean, indeterminate: boolean) =>
      h.span(
        [...sx(h, styles.box, (checked || indeterminate) && styles.boxOn), h.AriaHidden(true)],
        checked || indeterminate ? [h.span(sx(h, styles.boxIcon), [CheckboxIcon(h, !checked)])] : []
      )

    const checkMark = (active: boolean) =>
      h.svg(
        [
          ...sx(h, optionStyles.check, styles.check, active && optionStyles.checkActive),
          h.Attribute("viewBox", "0 0 10 7"),
          h.Attribute("fill", "none"),
          h.AriaHidden(true)
        ],
        [h.path([h.Attribute("d", checkIconPath), h.Attribute("fill", "currentColor")], [])]
      )

    const option = (getStyles: PillsComboboxStyles<M>, item: TreeSelectFlatNode<TreeSelectNode>, active: boolean) => {
      const state = nodeState(item.node.value, context)
      const checkbox = mode === "checkbox"
      const ticked = state.selected || state.checked
      const ariaChecked = state.indeterminate && !state.checked ? "mixed" : String(state.checked)
      const indent =
        basePadding +
        (item.level - 1) * levelOffset +
        (withLines && item.level > 1 ? lineGap : 0) +
        (item.hasChildren ? 0 : optionGap)
      const content = Option.match(Option.fromNullishOr(props.renderNode), {
        onNone: () => [
          ...(item.hasChildren ? [chevron(item, active)] : []),
          ...(checkbox ? [box(state.checked, state.indeterminate)] : []),
          h.span(sx(h, styles.label), [item.node.label]),
          ...(!checkbox && ticked ? [checkMark(active)] : [])
        ],
        onSome: (render) => [
          render({
            node: item.node,
            level: item.level,
            expanded: item.expanded,
            hasChildren: item.hasChildren,
            selected: state.selected,
            checked: state.checked,
            indeterminate: state.indeterminate,
            expand: lift(Message.PressedChevron({ value: item.node.value }))
          })
        ]
      })

      return h.div(
        [
          ...getStyles(
            "option",
            optionStyles.option,
            styles.option,
            active && optionStyles.active,
            item.node.nodeProps?.disabled === true && optionStyles.disabled
          ),
          h.Style({ paddingInlineStart: `${indent}px` }),
          h.DataAttribute("tree-select-option", ""),
          h.DataAttribute("level", String(item.level)),
          ...(item.hasChildren ? [h.DataAttribute("aria-expanded", String(item.expanded))] : []),
          ...(checkbox ? [h.DataAttribute("aria-checked", ariaChecked)] : []),
          ...(active ? [h.DataAttribute("combobox-selected", "")] : []),
          ...(ticked ? [h.DataAttribute("checked", ""), h.DataAttribute("combobox-active", "")] : []),
          ...(item.node.nodeProps?.disabled === true ? [h.DataAttribute("combobox-disabled", "")] : [])
        ],
        [...(withLines && item.level > 1 ? lines(item) : []), ...content]
      )
    }

    const empty = (getStyles: PillsComboboxStyles<M>) =>
      h.div(getStyles("empty", optionStyles.empty, styles.option), [Option.getOrThrow(nothingFound)])

    const nodeOf = (value: string) => Option.getOrThrow(Option.fromNullishOr(byValue.get(value)))

    const list = (getStyles: PillsComboboxStyles<M>) => ({
      items,
      itemToConfig: (value: string, itemContext: { readonly isActive: boolean }) => ({
        content: value === emptyItem ? empty(getStyles) : option(getStyles, nodeOf(value), itemContext.isActive)
      }),
      itemToValue: identity,
      itemToDisplayText: labelFor,
      isItemDisabled: (value: string) => value === emptyItem || nodeOf(value).node.nodeProps?.disabled === true,
      itemsAttributes: childAttributes([
        ...getStyles("dropdown", ...optionStyles.dropdown, styles.dropdown, setVars([popoverVars.zIndex, "300"]))
      ]),
      itemsScrollAttributes: childAttributes([
        ...sx(h, styles.scroll),
        h.OnMount(Mount.mapMessage(SyncOptions({ multiple: multi }), lift)),
        h.Style({ maxHeight: `${props.maxDropdownHeight ?? 220}px` })
      ]),
      selectedValues: flat
        .filter((item) => {
          const state = nodeState(item.node.value, context)

          return state.selected || state.checked
        })
        .map((item) => item.node.value)
    })

    const pills = (pillStyles: ReadonlyArray<Sx>) => {
      const shown = props.maxDisplayedValues === undefined ? values : values.slice(0, props.maxDisplayedValues)
      const overflow = values.length - shown.length
      const content = props.maxDisplayedValuesContent
      const overflowContent = Predicate.isFunction(content) ? content(overflow) : (content ?? `+${overflow} more`)
      const removable = !readOnly

      return [
        ...shown.map((value) =>
          Option.match(Option.fromNullishOr(props.renderPill), {
            onNone: () =>
              pill(h, {
                size: props.size ?? "sm",
                disabled,
                withRemoveButton: removable,
                onRemove: removed(value),
                ...(props.variant === "filled" ? { variant: "contrast" as const } : {}),
                children: [labelFor(value)],
                styles: { root: pillStyles }
              }),
            onSome: (render) =>
              render({
                node: findData(value, props.data),
                value,
                onRemove: removed(value),
                disabled,
                readOnly
              })
          })
        ),
        ...(overflow > 0
          ? [pill(h, { size: props.size ?? "sm", disabled, children: [overflowContent], styles: { root: pillStyles } })]
          : [])
      ]
    }

    return view(
      h,
      {
        ...Struct.omit(props, [
          "toParentMessage",
          "data",
          "value",
          "filter",
          "renderNode",
          "renderPill",
          "maxDisplayedValuesContent",
          "mode",
          "checkStrictly",
          "checkedStrategy",
          "expandOnClick",
          "allowDeselect",
          "clearSearchOnChange",
          "maxValues",
          "maxDisplayedValues",
          "withLines",
          "chevronAriaLabels"
        ]),
        data: [],
        value: values,
        withChevron: true
      },
      {
        gotCombobox: (message) => lift(Message.GotCombobox({ message })),
        clickedBox: lift(Message.ClickedBox()),
        removedPill: removed,
        cleared: lift(Message.Cleared()),
        keyDown: (key) =>
          ["Backspace", "ArrowRight", "ArrowLeft", " "].includes(key)
            ? Option.some(lift(Message.PressedKey({ key })))
            : Option.none(),
        list,
        pills: multi ? pills : () => [],
        restingInputValue: multi
          ? ""
          : Option.match(Option.fromNullishOr(values[0]), {
              onNone: () => "",
              onSome: labelFor
            }),
        showField: !multi
      }
    )
  }
}
