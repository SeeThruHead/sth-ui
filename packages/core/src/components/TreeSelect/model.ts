import * as FoldkitCombobox from "@foldkit/ui/combobox"
import { Option, Predicate, Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import {
  filterTreeData,
  findNode,
  getAllCheckedNodes,
  getChildrenNodesValues,
  getTreeExpandedState,
  isNodeChecked,
  isNodeIndeterminate,
  nodeLabelText
} from "../Tree/model.ts"
import type { Child } from "../../content.ts"
import type { TreeExpandedState, TreeNodeFilter } from "../Tree/model.ts"

export const bundle = FoldkitCombobox.Multi.create()

export type TreeSelectNode = {
  readonly value: string
  readonly label: Child
  readonly children?: ReadonlyArray<TreeSelectNode> | undefined
  readonly hasChildren?: boolean | undefined
  readonly nodeProps?: { readonly disabled?: boolean } | undefined
}

export type TreeSelectMode = "single" | "multiple" | "checkbox"

export type CheckedStrategy = "all" | "parent" | "child"

export type TreeSelectFlatNode<Node> = {
  readonly node: Node
  readonly level: number
  readonly parent: string | null
  readonly hasChildren: boolean
  readonly expanded: boolean
  readonly isLastChild: boolean
  readonly lineGuides: ReadonlyArray<boolean>
}

type Branch<Node> = {
  readonly value: string
  readonly children?: ReadonlyArray<Node> | undefined
  readonly hasChildren?: boolean | undefined
}

const childrenOf = <Node extends Branch<Node>>(node: Node): ReadonlyArray<Node> => node.children ?? []

export const flattenTreeSelectData = <Node extends Branch<Node>>(
  data: ReadonlyArray<Node>,
  expanded: TreeExpandedState,
  parent: string | null = null,
  level = 1,
  guides: ReadonlyArray<boolean> = []
): ReadonlyArray<TreeSelectFlatNode<Node>> =>
  data.flatMap((node, index) => {
    const last = index === data.length - 1
    const loaded = childrenOf(node).length > 0
    const open = expanded[node.value] === true
    const flat = {
      node,
      level,
      parent,
      hasChildren: loaded || node.hasChildren === true,
      expanded: open,
      isLastChild: last,
      lineGuides: guides
    }
    if (!open || !loaded) return [flat]

    return [
      flat,
      ...flattenTreeSelectData(childrenOf(node), expanded, node.value, level + 1, level >= 2 ? [...guides, !last] : [])
    ]
  })

export const expandToLeafChecked = (
  value: ReadonlyArray<string>,
  data: ReadonlyArray<TreeSelectNode>
): ReadonlyArray<string> => [...new Set(value.flatMap((item) => getChildrenNodesValues(item, data)))]

const topmostChecked = (data: ReadonlyArray<TreeSelectNode>, checked: ReadonlyArray<string>): ReadonlyArray<string> =>
  data.flatMap((node) =>
    isNodeChecked(node.value, data, checked) ? [node.value] : topmostChecked(childrenOf(node), checked)
  )

export const checkedToValue = (
  checked: ReadonlyArray<string>,
  data: ReadonlyArray<TreeSelectNode>,
  strategy: CheckedStrategy
): ReadonlyArray<string> => {
  if (strategy === "child") return checked
  if (strategy === "parent") return topmostChecked(data, checked)

  return getAllCheckedNodes(data, checked)
    .filter((node) => node.checked)
    .map((node) => node.value)
}

export const ancestorsOf = (value: string, data: ReadonlyArray<TreeSelectNode>): Option.Option<ReadonlyArray<string>> =>
  data.reduce<Option.Option<ReadonlyArray<string>>>((found, node) => {
    if (Option.isSome(found)) return found
    if (node.value === value) return Option.some([])

    return Option.map(ancestorsOf(value, childrenOf(node)), (path) => [node.value, ...path])
  }, Option.none())

export const Model = Schema.Struct({
  combobox: FoldkitCombobox.Multi.Model,
  expanded: Schema.Record(Schema.String, Schema.Boolean),
  skip: Schema.NullOr(Schema.String),
  ignoreClick: Schema.Boolean
})

export type Model = typeof Model.Type

export type InitConfig = {
  readonly id: string
  readonly data: ReadonlyArray<TreeSelectNode>
  readonly mode?: TreeSelectMode
  readonly value?: ReadonlyArray<string>
  readonly defaultExpandedValues?: ReadonlyArray<string>
  readonly defaultExpandAll?: boolean
  readonly defaultSearchValue?: string
}

export const labelOf = (value: string, data: ReadonlyArray<TreeSelectNode>): string =>
  Option.match(findNode(data, value), { onNone: () => value, onSome: nodeLabelText })

const singleLabel = (config: Pick<InitConfig, "mode" | "value" | "data">) =>
  Option.match(Option.fromNullishOr(config.value?.[0]), {
    onNone: () => "",
    onSome: (value) => (config.mode === undefined || config.mode === "single" ? labelOf(value, config.data) : "")
  })

export const init = (config: InitConfig): Model => ({
  combobox: {
    ...FoldkitCombobox.Multi.init({ id: config.id, isAnimated: true }),
    inputValue: config.defaultSearchValue ?? singleLabel(config)
  },
  expanded: getTreeExpandedState(
    config.data,
    config.defaultExpandAll === true ? "*" : (config.defaultExpandedValues ?? [])
  ),
  skip: null,
  ignoreClick: false
})

export const Message = defineMessageUnion({
  GotCombobox: { message: FoldkitCombobox.Message },
  PressedChevron: { value: Schema.String },
  ClickedBox: {},
  RemovedPill: { value: Schema.String },
  PressedKey: { key: Schema.String },
  Cleared: {},
  SyncedOptions: {}
})

export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({
  Changed: { value: Schema.NullOr(Schema.String), values: Schema.Array(Schema.String) },
  Removed: { value: Schema.String },
  ExpandedChanged: { values: Schema.Array(Schema.String) },
  DropdownOpened: {},
  DropdownClosed: {},
  Cleared: {}
})

export type OutMessage = typeof OutMessage.Type

export type TreeSelectContext = {
  readonly data: ReadonlyArray<TreeSelectNode>
  readonly value: ReadonlyArray<string>
  readonly mode?: TreeSelectMode
  readonly checkStrictly?: boolean
  readonly checkedStrategy?: CheckedStrategy
  readonly expandOnClick?: boolean
  readonly allowDeselect?: boolean
  readonly maxValues?: number
  readonly clearSearchOnChange?: boolean
  readonly searchable?: boolean
  readonly filter?: TreeNodeFilter<TreeSelectNode>
}

type Step = {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<FoldkitCombobox.Message>>
  readonly outMessages: ReadonlyArray<OutMessage>
}

const commandsOf = <C>(result: { readonly commands?: ReadonlyArray<C> | undefined }): ReadonlyArray<C> =>
  [result.commands].filter(Predicate.isNotUndefined).flat()

const modeOf = (context: TreeSelectContext): TreeSelectMode => context.mode ?? "single"

const isMulti = (context: TreeSelectContext) => modeOf(context) !== "single"

const done = (model: Model, outMessages: ReadonlyArray<OutMessage> = []): Step => ({
  model,
  commands: [],
  outMessages
})

const changed = (values: ReadonlyArray<string>) =>
  OutMessage.Changed({ value: Option.getOrNull(Option.fromNullishOr(values[0])), values })

export const internalChecked = (context: TreeSelectContext): ReadonlyArray<string> => {
  if (modeOf(context) !== "checkbox") return []

  return context.checkStrictly === true ? context.value : expandToLeafChecked(context.value, context.data)
}

export const nodeState = (value: string, context: TreeSelectContext) => {
  const checked = internalChecked(context)
  const checkbox = modeOf(context) === "checkbox"
  const strict = context.checkStrictly === true

  return {
    selected: !checkbox && context.value.includes(value),
    checked: checkbox && (strict ? checked.includes(value) : isNodeChecked(value, context.data, checked)),
    indeterminate: checkbox && !strict && isNodeIndeterminate(value, context.data, checked)
  }
}

const hasLoadedChildren = (value: string, data: ReadonlyArray<TreeSelectNode>) =>
  Option.exists(findNode(data, value), (node) => childrenOf(node).length > 0)

const expandedValues = (expanded: TreeExpandedState) =>
  Object.entries(expanded)
    .filter(([, open]) => open)
    .map(([value]) => value)

const toggleExpand = (model: Model, value: string): Step => {
  const expanded = { ...model.expanded, [value]: model.expanded[value] !== true }

  return done({ ...model, expanded }, [OutMessage.ExpandedChanged({ values: expandedValues(expanded) })])
}

const withSearch = (model: Model, inputValue: string): Model => ({
  ...model,
  combobox: { ...model.combobox, inputValue }
})

const clearedSearch = (model: Model, context: TreeSelectContext) =>
  context.clearSearchOnChange === false ? model : withSearch(model, "")

const appendTo = (result: Step, outMessages: ReadonlyArray<OutMessage>): Step => ({
  ...result,
  outMessages: [...result.outMessages, ...outMessages]
})

const expandsInstead = (value: string, context: TreeSelectContext) =>
  context.expandOnClick === true && hasLoadedChildren(value, context.data)

const submitSingle = (model: Model, value: string, context: TreeSelectContext): Step => {
  if (expandsInstead(value, context)) return toggleExpand(model, value)
  const next = context.allowDeselect !== false && context.value[0] === value ? null : value
  const closed = bundle.close(model.combobox)
  const search = Option.match(Option.fromNullishOr(next), {
    onNone: () => "",
    onSome: (picked) => labelOf(picked, context.data)
  })
  const kept = { ...model, combobox: closed.model }

  return {
    model: context.clearSearchOnChange === false ? kept : withSearch(kept, search),
    commands: commandsOf(closed),
    outMessages: [changed(next === null ? [] : [next])]
  }
}

const submitMultiple = (model: Model, value: string, context: TreeSelectContext): Step => {
  if (expandsInstead(value, context)) return toggleExpand(model, value)
  if (context.value.includes(value)) {
    return done(clearedSearch(model, context), [
      changed(context.value.filter((kept) => kept !== value)),
      OutMessage.Removed({ value })
    ])
  }
  if (context.value.length >= (context.maxValues ?? Infinity)) return done(model)

  return done(clearedSearch(model, context), [changed([...context.value, value])])
}

const nextChecked = (value: string, context: TreeSelectContext, wasChecked: boolean): ReadonlyArray<string> => {
  const checked = internalChecked(context)
  const leaves = context.checkStrictly === true ? [value] : getChildrenNodesValues(value, context.data)
  if (wasChecked) return checked.filter((item) => !leaves.includes(item))

  return [...new Set([...checked, ...leaves])]
}

const submitCheckbox = (model: Model, value: string, context: TreeSelectContext): Step => {
  const wasChecked = nodeState(value, context).checked
  const next = checkedToValue(nextChecked(value, context, wasChecked), context.data, context.checkedStrategy ?? "child")
  if (!wasChecked && next.length > (context.maxValues ?? Infinity)) return done(model)
  const result = done(clearedSearch(model, context), [changed(next)])
  const expand = expandsInstead(value, context) && model.expanded[value] !== true
  if (!expand) return result
  const opened = toggleExpand(result.model, value)

  return { ...opened, outMessages: [...result.outMessages, ...opened.outMessages] }
}

const submit = (model: Model, value: string, context: TreeSelectContext): Step => {
  const mode = modeOf(context)
  if (mode === "single") return submitSingle(model, value, context)

  return mode === "multiple" ? submitMultiple(model, value, context) : submitCheckbox(model, value, context)
}

const removeValue = (model: Model, value: string, context: TreeSelectContext): Step => {
  const values =
    modeOf(context) === "checkbox"
      ? checkedToValue(nextChecked(value, context, true), context.data, context.checkedStrategy ?? "child")
      : context.value.filter((kept) => kept !== value)

  return done(model, [changed(values), OutMessage.Removed({ value })])
}

const searchedData = (query: string, context: TreeSelectContext): ReadonlyArray<TreeSelectNode> => {
  if (context.searchable !== true) return context.data
  if (!isMulti(context) && query === labelOf(context.value[0] ?? "", context.data)) return context.data

  return filterTreeData(context.data, query, context.filter)
}

const branchValues = (data: ReadonlyArray<TreeSelectNode>): ReadonlyArray<string> =>
  data.flatMap((node) => (childrenOf(node).length > 0 ? [node.value, ...branchValues(childrenOf(node))] : []))

export const visibleNodes = (
  model: Model,
  context: TreeSelectContext
): ReadonlyArray<TreeSelectFlatNode<TreeSelectNode>> => {
  const filtered = searchedData(model.combobox.inputValue, context)
  const forced = filtered === context.data ? [] : branchValues(filtered)
  const expanded = { ...model.expanded, ...Object.fromEntries(forced.map((value) => [value, true])) }

  return flattenTreeSelectData(filtered, expanded)
}

const expandAncestors = (model: Model, context: TreeSelectContext): Model => {
  const ancestors = context.value.flatMap((value) =>
    Option.getOrElse(ancestorsOf(value, context.data), (): ReadonlyArray<string> => [])
  )

  return { ...model, expanded: { ...model.expanded, ...Object.fromEntries(ancestors.map((value) => [value, true])) } }
}

const openings = (before: Model, after: Model): ReadonlyArray<OutMessage> => {
  if (!before.combobox.isOpen && after.combobox.isOpen) return [OutMessage.DropdownOpened()]

  return before.combobox.isOpen && !after.combobox.isOpen ? [OutMessage.DropdownClosed()] : []
}

const selectedOf = (outMessage: FoldkitCombobox.OutMessage | undefined): Option.Option<string> =>
  Option.filter(Option.fromNullishOr(outMessage), (out) => out._tag === "Selected").pipe(Option.map((out) => out.value))

const gotCombobox = (model: Model, inner: FoldkitCombobox.Message, context: TreeSelectContext): Step => {
  const result = bundle.update(model.combobox, inner)
  const moved = { ...model, combobox: result.model, skip: null }
  const opened = !model.combobox.isOpen && result.model.isOpen && context.searchable === true
  const next = opened ? expandAncestors(moved, context) : moved
  const picked = Option.filter(selectedOf(result.outMessage), (value) => value !== model.skip)
  const submitted = Option.match(picked, { onNone: () => done(next), onSome: (value) => submit(next, value, context) })

  return appendTo(
    { ...submitted, commands: [...commandsOf(result), ...submitted.commands] },
    openings(model, submitted.model)
  )
}

const toggleMessage = FoldkitCombobox.Message.PressedToggleButton({ restingInputValue: "", isClearable: false })

const activeNode = (model: Model, context: TreeSelectContext) =>
  Option.flatMap(
    Option.filter(model.combobox.maybeActiveItemIndex, () => model.combobox.isOpen),
    (index) => Option.fromNullishOr(visibleNodes(model, context)[index])
  )

const pressedArrow = (model: Model, key: string, context: TreeSelectContext): Step =>
  Option.match(activeNode(model, context), {
    onNone: () => done(model),
    onSome: (current) => {
      if (current.hasChildren && current.expanded !== (key === "ArrowRight")) {
        return toggleExpand(model, current.node.value)
      }
      if (key === "ArrowRight") return done(model)
      const index = visibleNodes(model, context).findIndex((flat) => flat.node.value === current.parent)
      if (index < 0) return done(model)

      return gotCombobox(
        model,
        FoldkitCombobox.Message.ActivatedItem({
          index,
          activationTrigger: "Keyboard",
          maybeImmediateSelection: Option.none()
        }),
        context
      )
    }
  })

const pressedKey = (model: Model, key: string, context: TreeSelectContext): Step => {
  if (key === " " && context.searchable !== true && isMulti(context)) return gotCombobox(model, toggleMessage, context)
  if (key === "ArrowRight" || key === "ArrowLeft") return pressedArrow(model, key, context)
  if (key !== "Backspace" || model.combobox.inputValue !== "" || !isMulti(context)) return done(model)

  return Option.match(Option.fromNullishOr(context.value.at(-1)), {
    onNone: () => done(model),
    onSome: (last) => done(model, [changed(context.value.slice(0, -1)), OutMessage.Removed({ value: last })])
  })
}

const handle = (model: Model, message: Message, context: TreeSelectContext): Step =>
  Message.match(message, {
    GotCombobox: ({ message: inner }) => gotCombobox(model, inner, context),
    PressedChevron: ({ value }) => toggleExpand({ ...model, skip: value }, value),
    ClickedBox: () => {
      if (model.ignoreClick) return done({ ...model, ignoreClick: false })
      if (context.searchable === true && model.combobox.isOpen) return done(model)

      return gotCombobox(model, toggleMessage, context)
    },
    RemovedPill: ({ value }) => removeValue({ ...model, ignoreClick: true }, value, context),
    PressedKey: ({ key }) => pressedKey(model, key, context),
    Cleared: () => done(withSearch(model, ""), [changed([]), OutMessage.Cleared()]),
    SyncedOptions: () => done(model)
  })

export type Result = {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessages: ReadonlyArray<OutMessage>
}

export const update = (model: Model, message: Message, context: TreeSelectContext): Result => {
  const result = handle(model, message, context)

  return {
    ...result,
    commands: result.commands.map((command) =>
      Command.mapMessage(command, (inner) => Message.GotCombobox({ message: inner }))
    )
  }
}
