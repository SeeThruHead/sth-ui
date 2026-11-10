import { Option, Predicate, Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import { FocusNode } from "./focus.ts"

export type TreeNodeShape = {
  readonly value: string
  readonly children?: ReadonlyArray<TreeNodeShape> | undefined
  readonly hasChildren?: boolean | undefined
}

export type TreeExpandedState = Readonly<Record<string, boolean>>

export type CheckedNodeStatus = {
  readonly checked: boolean
  readonly indeterminate: boolean
  readonly hasChildren: boolean
  readonly value: string
}

const childrenOf = (node: TreeNodeShape): ReadonlyArray<TreeNodeShape> => node.children ?? []

const hasLoadedChildren = (node: TreeNodeShape) => childrenOf(node).length > 0

export const nodeHasChildren = (node: TreeNodeShape): boolean => hasLoadedChildren(node) || node.hasChildren === true

export const flatValues = (data: ReadonlyArray<TreeNodeShape>): ReadonlyArray<string> =>
  data.flatMap((node) => [node.value, ...flatValues(childrenOf(node))])

export const findTreeNode = (value: string, data: ReadonlyArray<TreeNodeShape>): Option.Option<TreeNodeShape> =>
  Option.fromNullishOr(
    data.reduce<TreeNodeShape | undefined>(
      (found, node) =>
        found ?? (node.value === value ? node : Option.getOrUndefined(findTreeNode(value, childrenOf(node)))),
      undefined
    )
  )

const leavesOf = (node: TreeNodeShape): ReadonlyArray<string> =>
  hasLoadedChildren(node) ? childrenOf(node).flatMap(leavesOf) : [node.value]

export const getChildrenNodesValues = (value: string, data: ReadonlyArray<TreeNodeShape>): ReadonlyArray<string> =>
  Option.match(findTreeNode(value, data), { onNone: () => [], onSome: leavesOf })

export const getAllChildrenNodes = (data: ReadonlyArray<TreeNodeShape>): ReadonlyArray<string> => data.flatMap(leavesOf)

type CheckedWalk = {
  readonly result: ReadonlyArray<CheckedNodeStatus>
  readonly level: ReadonlyArray<CheckedNodeStatus>
}

const leafWalk = (walk: CheckedWalk, node: TreeNodeShape, checked: ReadonlyArray<string>): CheckedWalk => {
  if (!checked.includes(node.value)) return walk
  const leaf = { checked: true, indeterminate: false, value: node.value, hasChildren: false }

  return { result: [...walk.result, leaf], level: [...walk.level, leaf] }
}

const checkedWalk = (data: ReadonlyArray<TreeNodeShape>, checked: ReadonlyArray<string>): CheckedWalk =>
  data.reduce<CheckedWalk>(
    (walk, node) => {
      if (!hasLoadedChildren(node)) return leafWalk(walk, node, checked)
      const inner = checkedWalk(childrenOf(node), checked)
      if (inner.level.length === 0) return walk
      const all = inner.level.length === childrenOf(node).length && inner.level.every((item) => item.checked)
      const parent = { checked: all, indeterminate: !all, value: node.value, hasChildren: true }

      return { result: [...walk.result, ...inner.result, parent], level: [...walk.level, parent] }
    },
    { result: [], level: [] }
  )

export const getAllCheckedNodes = (
  data: ReadonlyArray<TreeNodeShape>,
  checked: ReadonlyArray<string>
): ReadonlyArray<CheckedNodeStatus> => checkedWalk(data, checked).result

export const isNodeChecked = (
  value: string,
  data: ReadonlyArray<TreeNodeShape>,
  checked: ReadonlyArray<string>
): boolean => {
  if (checked.length === 0) return false
  if (checked.includes(value)) return true

  return getAllCheckedNodes(data, checked).some((node) => node.value === value && node.checked)
}

export const isNodeIndeterminate = (
  value: string,
  data: ReadonlyArray<TreeNodeShape>,
  checked: ReadonlyArray<string>
): boolean =>
  checked.length > 0 && getAllCheckedNodes(data, checked).some((node) => node.value === value && node.indeterminate)

export const getTreeExpandedState = (
  data: ReadonlyArray<TreeNodeShape>,
  expanded: ReadonlyArray<string> | "*"
): TreeExpandedState =>
  Object.fromEntries(flatValues(data).map((value) => [value, expanded === "*" || expanded.includes(value)]))

export const valuesRange = (
  anchor: string | null,
  value: string,
  values: ReadonlyArray<string>
): ReadonlyArray<string> => {
  if (anchor === null) return []
  const from = values.indexOf(anchor)
  const to = values.indexOf(value)

  return values.slice(Math.min(from, to), Math.max(from, to) + 1)
}

const visibleValues = (data: ReadonlyArray<TreeNodeShape>, expanded: TreeExpandedState): ReadonlyArray<string> =>
  data.flatMap((node) => [
    node.value,
    ...(expanded[node.value] === true ? visibleValues(childrenOf(node), expanded) : [])
  ])

const parentOf = (
  value: string,
  data: ReadonlyArray<TreeNodeShape>,
  parent: string | null = null
): Option.Option<string> =>
  data.reduce<Option.Option<string>>(
    (found, node) =>
      Option.isSome(found)
        ? found
        : node.value === value
          ? Option.fromNullishOr(parent)
          : parentOf(value, childrenOf(node), node.value),
    Option.none()
  )

export const TreeDragDropPosition = Schema.Literals(["before", "after", "inside"])

export type TreeDragDropPosition = typeof TreeDragDropPosition.Type

export type TreeDragDropPayload = {
  readonly draggedNode: string
  readonly targetNode: string
  readonly position: TreeDragDropPosition
}

export type TreeAllowDrop = (payload: TreeDragDropPayload) => boolean

export const dropPosition = (
  offset: number,
  height: number,
  hasChildren: boolean,
  expanded: boolean
): TreeDragDropPosition => {
  if (hasChildren && expanded) return offset < height * 0.5 ? "before" : "inside"
  if (!hasChildren) return offset < height * 0.5 ? "before" : "after"
  if (offset < height * 0.25) return "before"

  return offset > height * 0.75 ? "after" : "inside"
}

export const isDescendant = (data: ReadonlyArray<TreeNodeShape>, ancestor: string, value: string): boolean =>
  Option.match(findTreeNode(ancestor, data), {
    onNone: () => false,
    onSome: (node) => flatValues(childrenOf(node)).includes(value)
  })

type Branch<Node> = { readonly value: string; readonly children?: ReadonlyArray<Node> | undefined }

const withoutNode = <Node extends Branch<Node>>(data: ReadonlyArray<Node>, value: string): ReadonlyArray<Node> =>
  data
    .filter((node) => node.value !== value)
    .map((node) => (node.children === undefined ? node : { ...node, children: withoutNode(node.children, value) }))

export const findNode = <Node extends Branch<Node>>(data: ReadonlyArray<Node>, value: string): Option.Option<Node> =>
  Option.fromNullishOr(
    data.reduce<Node | undefined>(
      (found, node) =>
        found ?? (node.value === value ? node : Option.getOrUndefined(findNode(node.children ?? [], value))),
      undefined
    )
  )

const insertNode = <Node extends Branch<Node>>(
  data: ReadonlyArray<Node>,
  moved: Node,
  target: string,
  position: TreeDragDropPosition
): ReadonlyArray<Node> => {
  const index = data.findIndex((node) => node.value === target)
  if (position !== "inside" && index !== -1) {
    const at = position === "before" ? index : index + 1

    return [...data.slice(0, at), moved, ...data.slice(at)]
  }

  return data.map((node) => {
    if (position === "inside" && node.value === target) return { ...node, children: [...(node.children ?? []), moved] }

    return node.children === undefined
      ? node
      : { ...node, children: insertNode(node.children, moved, target, position) }
  })
}

export const moveTreeNode = <Node extends Branch<Node>>(
  data: ReadonlyArray<Node>,
  payload: TreeDragDropPayload
): ReadonlyArray<Node> => {
  const { draggedNode, targetNode, position } = payload
  if (draggedNode === targetNode) return data
  if (Option.isNone(findNode(data, targetNode))) return data
  if (isDescendant(data, draggedNode, targetNode)) return data

  return Option.match(findNode(data, draggedNode), {
    onNone: () => data,
    onSome: (moved) => insertNode(withoutNode(data, draggedNode), moved, targetNode, position)
  })
}

export const nodeLabelText = (node: { readonly value: string; readonly label?: unknown }): string =>
  Predicate.isString(node.label) ? node.label : node.value

export type TreeNodeFilter<Node> = (query: string, node: Node) => boolean

export const defaultTreeNodeFilter = (query: string, node: { readonly value: string; readonly label?: unknown }) =>
  nodeLabelText(node).toLowerCase().includes(query.toLowerCase().trim())

export const filterTreeData = <Node extends Branch<Node>>(
  data: ReadonlyArray<Node>,
  query: string,
  filter: TreeNodeFilter<Node> = defaultTreeNodeFilter
): ReadonlyArray<Node> => {
  if (query.trim() === "") return data

  return data.flatMap((node) => {
    const children = filterTreeData(node.children ?? [], query, filter)
    if (children.length > 0) return [{ ...node, children }]

    return filter(query, node) ? [node] : []
  })
}

const Over = Schema.Struct({ target: Schema.String, position: TreeDragDropPosition })

const Drag = Schema.Struct({ dragged: Schema.String, over: Schema.NullOr(Over) })

const Focus = Schema.Struct({ value: Schema.String, visible: Schema.Boolean })

export const Model = Schema.Struct({
  id: Schema.String,
  expanded: Schema.Record(Schema.String, Schema.Boolean),
  selected: Schema.Array(Schema.String),
  checked: Schema.Array(Schema.String),
  anchor: Schema.NullOr(Schema.String),
  focus: Schema.NullOr(Focus),
  hovered: Schema.NullOr(Schema.String),
  drag: Schema.NullOr(Drag),
  multiple: Schema.Boolean,
  checkStrictly: Schema.Boolean,
  loading: Schema.Array(Schema.String),
  loaded: Schema.Array(Schema.String),
  loadErrors: Schema.Record(Schema.String, Schema.String)
})

export type Model = typeof Model.Type

export type InitConfig = {
  readonly id: string
  readonly data?: ReadonlyArray<TreeNodeShape>
  readonly initialExpandedState?: TreeExpandedState
  readonly initialSelectedState?: ReadonlyArray<string>
  readonly initialCheckedState?: ReadonlyArray<string>
  readonly multiple?: boolean
  readonly checkStrictly?: boolean
}

export const init = (config: InitConfig): Model => {
  const data = config.data ?? []
  const strict = config.checkStrictly === true
  const checked = config.initialCheckedState ?? []

  return {
    id: config.id,
    expanded: { ...getTreeExpandedState(data, []), ...config.initialExpandedState },
    selected: config.initialSelectedState ?? [],
    checked: strict ? checked : [...new Set(checked.flatMap((value) => getChildrenNodesValues(value, data)))],
    anchor: null,
    focus: null,
    drag: null,
    hovered: null,
    multiple: config.multiple === true,
    checkStrictly: strict,
    loading: [],
    loaded: [],
    loadErrors: {}
  }
}

export const Message = defineMessageUnion({
  Clicked: { value: Schema.String, shift: Schema.Boolean },
  PressedKey: { value: Schema.String, key: Schema.String, shift: Schema.Boolean },
  FocusedNode: { value: Schema.String, visible: Schema.Boolean },
  BlurredNode: { value: Schema.String },
  ClickedOutside: {},
  ToggledExpanded: { value: Schema.String },
  Expanded: { value: Schema.String },
  Collapsed: { value: Schema.String },
  ExpandedAll: {},
  CollapsedAll: {},
  SetExpanded: { state: Schema.Record(Schema.String, Schema.Boolean) },
  Selected: { value: Schema.String },
  Deselected: { value: Schema.String },
  ToggledSelected: { value: Schema.String },
  ClearedSelection: {},
  SetSelected: { values: Schema.Array(Schema.String) },
  Checked: { value: Schema.String },
  Unchecked: { value: Schema.String },
  ToggledChecked: { value: Schema.String },
  CheckedAll: {},
  UncheckedAll: {},
  SetChecked: { values: Schema.Array(Schema.String) },
  CompletedFocus: {},
  DragStarted: { value: Schema.String },
  DraggedOver: { target: Schema.String, position: TreeDragDropPosition },
  DragLeft: { target: Schema.String },
  Dropped: {},
  DragEnded: {},
  HoveredNode: { value: Schema.NullOr(Schema.String) },
  LoadNode: { value: Schema.String },
  ChildrenLoaded: { value: Schema.String },
  ChildrenLoadFailed: { value: Schema.String, error: Schema.String }
})

export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({
  NodeExpanded: { value: Schema.String },
  NodeCollapsed: { value: Schema.String },
  DragDropped: { draggedNode: Schema.String, targetNode: Schema.String, position: TreeDragDropPosition },
  LoadChildren: { value: Schema.String }
})

export type OutMessage = typeof OutMessage.Type

export type TreeContext = {
  readonly data: ReadonlyArray<TreeNodeShape>
  readonly expandOnClick?: boolean
  readonly selectOnClick?: boolean
  readonly allowRangeSelection?: boolean
  readonly expandOnSpace?: boolean
  readonly checkOnSpace?: boolean
  readonly clearSelectionOnOutsideClick?: boolean
  readonly allowDrop?: TreeAllowDrop
  readonly loadChildren?: boolean
}

type Step = {
  readonly model: Model
  readonly focus: Option.Option<string>
  readonly outMessages: ReadonlyArray<OutMessage>
}

const done = (model: Model, outMessages: ReadonlyArray<OutMessage> = []): Step => ({
  model,
  focus: Option.none(),
  outMessages
})

const focusing = (model: Model, value: Option.Option<string>): Step => ({ model, focus: value, outMessages: [] })

const setExpanded = (model: Model, value: string, open: boolean): Step => {
  const changed = (model.expanded[value] === true) !== open
  const outMessages = changed ? [open ? OutMessage.NodeExpanded({ value }) : OutMessage.NodeCollapsed({ value })] : []

  return done({ ...model, expanded: { ...model.expanded, [value]: open } }, outMessages)
}

const select = (model: Model, value: string): Model => ({
  ...model,
  anchor: value,
  selected: model.multiple ? [...new Set([...model.selected, value])] : [value]
})

const toggleSelected = (model: Model, value: string): Model => {
  if (model.selected.includes(value))
    return { ...model, anchor: null, selected: model.selected.filter((item) => item !== value) }

  return select(model, value)
}

const check = (model: Model, value: string, data: ReadonlyArray<TreeNodeShape>): Model => ({
  ...model,
  checked: model.checkStrictly
    ? [...new Set([...model.checked, value])]
    : [...new Set([...model.checked, ...getChildrenNodesValues(value, data)])]
})

const uncheck = (model: Model, value: string, data: ReadonlyArray<TreeNodeShape>): Model => {
  const removed = model.checkStrictly ? [value] : getChildrenNodesValues(value, data)

  return { ...model, checked: model.checked.filter((item) => !removed.includes(item)) }
}

export const nodeChecked = (model: Model, value: string, data: ReadonlyArray<TreeNodeShape>): boolean =>
  model.checkStrictly ? model.checked.includes(value) : isNodeChecked(value, data, model.checked)

export const nodeIndeterminate = (model: Model, value: string, data: ReadonlyArray<TreeNodeShape>): boolean =>
  !model.checkStrictly && isNodeIndeterminate(value, data, model.checked)

const toggleChecked = (model: Model, value: string, data: ReadonlyArray<TreeNodeShape>): Model =>
  nodeChecked(model, value, data) ? uncheck(model, value, data) : check(model, value, data)

const clicked = (model: Model, value: string, shift: boolean, context: TreeContext): Step => {
  if (context.allowRangeSelection !== false && shift && model.anchor !== null)
    return focusing(
      { ...model, selected: valuesRange(model.anchor, value, flatValues(context.data)) },
      Option.some(value)
    )
  const expanded =
    context.expandOnClick === false ? done(model) : setExpanded(model, value, model.expanded[value] !== true)
  const chosen = context.selectOnClick === true ? select(expanded.model, value) : expanded.model

  return { model: chosen, focus: Option.some(value), outMessages: expanded.outMessages }
}

const vertical = (model: Model, value: string, step: number, shift: boolean, context: TreeContext): Step => {
  const visible = visibleValues(context.data, model.expanded)
  const target = Option.fromNullishOr(visible[visible.indexOf(value) + step])
  const ranged = Option.match(target, {
    onNone: () => model,
    onSome: (next) =>
      shift ? { ...model, selected: valuesRange(model.anchor, next, flatValues(context.data)) } : model
  })

  return focusing(ranged, target)
}

const right = (model: Model, value: string, context: TreeContext): Step => {
  if (model.expanded[value] !== true) return setExpanded(model, value, true)
  const node = findTreeNode(value, context.data)

  return focusing(
    model,
    Option.flatMap(node, (found) => Option.fromNullishOr(childrenOf(found)[0]?.value))
  )
}

const left = (model: Model, value: string, context: TreeContext): Step => {
  const node = findTreeNode(value, context.data)
  if (model.expanded[value] === true && Option.exists(node, nodeHasChildren)) return setExpanded(model, value, false)

  return focusing(model, parentOf(value, context.data))
}

const space = (model: Model, value: string, context: TreeContext): Step => {
  const expanded =
    context.expandOnSpace === false ? done(model) : setExpanded(model, value, model.expanded[value] !== true)
  const checked = context.checkOnSpace === true ? toggleChecked(expanded.model, value, context.data) : expanded.model

  return { ...expanded, model: checked }
}

const pressed = (model: Model, value: string, key: string, shift: boolean, context: TreeContext): Step => {
  if (key === "ArrowDown") return vertical(model, value, 1, shift, context)
  if (key === "ArrowUp") return vertical(model, value, -1, shift, context)
  if (key === "ArrowRight") return right(model, value, context)
  if (key === "ArrowLeft") return left(model, value, context)

  return key === " " ? space(model, value, context) : done(model)
}

const allowed = (context: TreeContext, payload: TreeDragDropPayload) =>
  context.allowDrop === undefined || context.allowDrop(payload)

const draggedOver = (model: Model, target: string, position: TreeDragDropPosition, context: TreeContext): Model => {
  if (model.drag === null) return model
  const over = allowed(context, { draggedNode: model.drag.dragged, targetNode: target, position })
    ? { target, position }
    : null

  return { ...model, drag: { ...model.drag, over } }
}

const dropped = (model: Model, context: TreeContext): Step => {
  const over = model.drag?.over ?? null
  if (model.drag === null || over === null) return done({ ...model, drag: null })
  const payload = { draggedNode: model.drag.dragged, targetNode: over.target, position: over.position }

  return done({ ...model, drag: null }, allowed(context, payload) ? [OutMessage.DragDropped(payload)] : [])
}

export const handledKeys: ReadonlySet<string> = new Set(["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", " "])

const handle = (model: Model, message: Message, context: TreeContext): Step =>
  Message.match<Step>(message, {
    Clicked: ({ value, shift }) => clicked(model, value, shift, context),
    PressedKey: ({ value, key, shift }) => pressed(model, value, key, shift, context),
    FocusedNode: ({ value, visible }) => done({ ...model, focus: { value, visible } }),
    BlurredNode: ({ value }) => done(model.focus?.value === value ? { ...model, focus: null } : model),
    ClickedOutside: () =>
      done(context.clearSelectionOnOutsideClick === true ? { ...model, selected: [], anchor: null } : model),
    ToggledExpanded: ({ value }) => setExpanded(model, value, model.expanded[value] !== true),
    Expanded: ({ value }) => setExpanded(model, value, true),
    Collapsed: ({ value }) => setExpanded(model, value, false),
    ExpandedAll: () => done({ ...model, expanded: getTreeExpandedState(context.data, "*") }),
    CollapsedAll: () => done({ ...model, expanded: getTreeExpandedState(context.data, []) }),
    SetExpanded: ({ state }) => done({ ...model, expanded: state }),
    Selected: ({ value }) => done(select(model, value)),
    Deselected: ({ value }) =>
      done({
        ...model,
        anchor: model.anchor === value ? null : model.anchor,
        selected: model.selected.filter((item) => item !== value)
      }),
    ToggledSelected: ({ value }) => done(toggleSelected(model, value)),
    ClearedSelection: () => done({ ...model, selected: [], anchor: null }),
    SetSelected: ({ values }) => done({ ...model, selected: values }),
    Checked: ({ value }) => done(check(model, value, context.data)),
    Unchecked: ({ value }) => done(uncheck(model, value, context.data)),
    ToggledChecked: ({ value }) => done(toggleChecked(model, value, context.data)),
    CheckedAll: () =>
      done({ ...model, checked: model.checkStrictly ? flatValues(context.data) : getAllChildrenNodes(context.data) }),
    UncheckedAll: () => done({ ...model, checked: [] }),
    SetChecked: ({ values }) => done({ ...model, checked: values }),
    CompletedFocus: () => done(model),
    DragStarted: ({ value }) => done({ ...model, drag: { dragged: value, over: null } }),
    DraggedOver: ({ target, position }) => done(draggedOver(model, target, position, context)),
    DragLeft: ({ target }) =>
      done(model.drag?.over?.target === target ? { ...model, drag: { ...model.drag, over: null } } : model),
    Dropped: () => dropped(model, context),
    DragEnded: () => done({ ...model, drag: null }),
    HoveredNode: ({ value }) => done(model.hovered === value ? model : { ...model, hovered: value }),
    LoadNode: ({ value }) => startLoad(done(model), value, context),
    ChildrenLoaded: ({ value }) =>
      done({ ...model, loading: without(model.loading, value), loaded: [...new Set([...model.loaded, value])] }),
    ChildrenLoadFailed: ({ value, error }) =>
      done({ ...model, loading: without(model.loading, value), loadErrors: { ...model.loadErrors, [value]: error } })
  })

const without = (values: ReadonlyArray<string>, value: string): ReadonlyArray<string> =>
  values.filter((item) => item !== value)

const unloaded = (node: TreeNodeShape): boolean => node.hasChildren === true && node.children === undefined

const needsLoad = (model: Model, value: string, context: TreeContext): boolean => {
  if (context.loadChildren !== true) return false
  if (model.loading.includes(value)) return false
  if (model.loaded.includes(value)) return false

  return Option.exists(findTreeNode(value, context.data), unloaded)
}

const startLoad = (result: Step, value: string, context: TreeContext): Step => {
  if (!needsLoad(result.model, value, context)) return result
  const { [value]: _cleared, ...loadErrors } = result.model.loadErrors

  return {
    ...result,
    model: { ...result.model, loading: [...result.model.loading, value], loadErrors },
    outMessages: [...result.outMessages, OutMessage.LoadChildren({ value })]
  }
}

const expandedValues = (result: Step): ReadonlyArray<string> =>
  result.outMessages.flatMap((out) => (out._tag === "NodeExpanded" ? [out.value] : []))

export type Result = {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessages: ReadonlyArray<OutMessage>
}

const focusCommands = (tree: string, focus: Option.Option<string>): ReadonlyArray<Command.Command<Message>> =>
  Option.match(focus, {
    onNone: () => [],
    onSome: (value) => [Command.mapMessage(FocusNode({ tree, value }), () => Message.CompletedFocus())]
  })

export const update = (model: Model, message: Message, context: TreeContext): Result => {
  const handled = handle(model, message, context)
  const loaded = expandedValues(handled).reduce((state, value) => startLoad(state, value, context), handled)

  return { model: loaded.model, commands: focusCommands(model.id, loaded.focus), outMessages: loaded.outMessages }
}

export const mergeAsyncChildren = <Node extends Branch<Node> & { readonly hasChildren?: boolean | undefined }>(
  data: ReadonlyArray<Node>,
  parentValue: string,
  children: ReadonlyArray<Node>
): ReadonlyArray<Node> =>
  data.map((node) => {
    if (node.value === parentValue) return { ...node, children, hasChildren: false }

    return node.children === undefined
      ? node
      : { ...node, children: mergeAsyncChildren(node.children, parentValue, children) }
  })

export type FlatTreeLineState = "continuing" | "closing" | "none"

export type FlattenedTreeNode<Node> = {
  readonly node: Node
  readonly level: number
  readonly parent: string | null
  readonly hasChildren: boolean
  readonly expanded: boolean
  readonly linesPath: ReadonlyArray<FlatTreeLineState>
}

type FlatNode<Node> = TreeNodeShape & { readonly value: string; readonly children?: ReadonlyArray<Node> | undefined }

const linesFor = (
  level: number,
  last: boolean,
  ancestorsLast: ReadonlyArray<boolean>
): ReadonlyArray<FlatTreeLineState> =>
  Array.from({ length: Math.max(0, level - 1) }, (_, offset): FlatTreeLineState => {
    const column = offset + 2
    if (column === level) return last ? "closing" : "continuing"

    return ancestorsLast[column - 1] === true ? "none" : "continuing"
  })

const flattened = <Node extends FlatNode<Node>>(
  data: ReadonlyArray<Node>,
  expanded: TreeExpandedState,
  parent: string | null,
  level: number,
  ancestorsLast: ReadonlyArray<boolean>
): ReadonlyArray<FlattenedTreeNode<Node>> =>
  data.flatMap((node, index) => {
    const last = index === data.length - 1
    const open = expanded[node.value] === true
    const entry = {
      node,
      level,
      parent,
      hasChildren: nodeHasChildren(node),
      expanded: open,
      linesPath: linesFor(level, last, ancestorsLast)
    }
    const children = open ? (node.children ?? []) : []

    return [entry, ...flattened(children, expanded, node.value, level + 1, [...ancestorsLast, last])]
  })

export const flattenTreeData = <Node extends FlatNode<Node>>(
  data: ReadonlyArray<Node>,
  expanded: TreeExpandedState
): ReadonlyArray<FlattenedTreeNode<Node>> => flattened(data, expanded, null, 1, [])
