import * as stylex from "@stylexjs/stylex"
import { Effect, Option, Queue, Schema, Stream } from "effect"
import type { Cause } from "effect"
import { childAttributes } from "foldkit/html"
import type { ChildAttribute, Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import type { Child } from "../../content.ts"
import { spacing } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { listOf, mapDefined, setDefinedVars, setVars, stylesApi, sx, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps, Sx } from "../../styles/StylesApi.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { accent, colors, space } from "../../theme/tokens.stylex.ts"
import { dropPosition, handledKeys, Message, nodeChecked, nodeHasChildren, nodeIndeterminate, update } from "./model.ts"
import type { FlattenedTreeNode, Model, TreeAllowDrop, TreeContext } from "./model.ts"
import { treeVars } from "./Tree.stylex.ts"
import { Loader } from "../Loader/Loader.ts"
import type { LoaderConfig } from "../Loader/Loader.ts"

export {
  findTreeNode,
  flatValues,
  getAllCheckedNodes,
  getAllChildrenNodes,
  getChildrenNodesValues,
  getTreeExpandedState,
  init,
  isNodeChecked,
  isNodeIndeterminate,
  mergeAsyncChildren,
  Message,
  Model,
  defaultTreeNodeFilter,
  filterTreeData,
  flattenTreeData,
  moveTreeNode,
  nodeChecked,
  nodeHasChildren,
  nodeIndeterminate,
  OutMessage
} from "./model.ts"
export type {
  CheckedNodeStatus,
  FlatTreeLineState,
  FlattenedTreeNode,
  InitConfig,
  TreeAllowDrop,
  TreeContext,
  TreeDragDropPayload,
  TreeDragDropPosition,
  TreeExpandedState,
  TreeNodeFilter,
  TreeNodeShape
} from "./model.ts"

export type TreeNodeData = {
  readonly value: string
  readonly label: Child
  readonly children?: ReadonlyArray<TreeNodeData> | undefined
  readonly hasChildren?: boolean | undefined
  readonly nodeProps?: { readonly disabled?: boolean } | undefined
}

export type TreeNodeActions<M> = {
  readonly toggleExpanded: M
  readonly toggleChecked: M
  readonly toggleSelected: M
  readonly select: M
}

export type RenderTreeNodePayload<M> = {
  readonly node: TreeNodeData
  readonly level: number
  readonly selected: boolean
  readonly isRoot: boolean
  readonly expanded: boolean
  readonly hasChildren: boolean
  readonly isLoading: boolean
  readonly loadError: string | null
  readonly checked: boolean
  readonly indeterminate: boolean
  readonly elementProps: ReadonlyArray<ChildAttribute>
  readonly elementStyles: ReadonlyArray<Sx>
  readonly dragHandleProps: ReadonlyArray<ChildAttribute>
  readonly actions: TreeNodeActions<M>
}

export type TreePart = "root" | "node" | "label" | "subtree"

export type TreeOptions = {
  readonly levelOffset?: StyleValue
  readonly expandOnClick?: boolean
  readonly expandOnSpace?: boolean
  readonly checkOnSpace?: boolean
  readonly selectOnClick?: boolean
  readonly clearSelectionOnOutsideClick?: boolean
  readonly allowRangeSelection?: boolean
  readonly keepMounted?: boolean
  readonly withLines?: boolean
  readonly withDragAndDrop?: boolean
  readonly withDragHandle?: boolean
}

export type TreeProps<M> = TreeOptions &
  StylesApiProps<TreePart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly data: ReadonlyArray<TreeNodeData>
    readonly ariaLabel?: string
    readonly renderNode?: (payload: RenderTreeNodePayload<M>) => Html
    readonly allowDrop?: TreeAllowDrop
  }

export type TreeConfig = ComponentConfig<TreeOptions, TreePart>

export const treeContext = <M>(props: Pick<TreeProps<M>, "data" | "allowDrop"> & TreeOptions): TreeContext => ({
  data: props.data,
  ...(props.allowDrop === undefined ? {} : { allowDrop: props.allowDrop }),
  ...(props.expandOnClick === undefined ? {} : { expandOnClick: props.expandOnClick }),
  ...(props.selectOnClick === undefined ? {} : { selectOnClick: props.selectOnClick }),
  ...(props.allowRangeSelection === undefined ? {} : { allowRangeSelection: props.allowRangeSelection }),
  ...(props.expandOnSpace === undefined ? {} : { expandOnSpace: props.expandOnSpace }),
  ...(props.checkOnSpace === undefined ? {} : { checkOnSpace: props.checkOnSpace }),
  ...(props.clearSelectionOnOutsideClick === undefined
    ? {}
    : { clearSelectionOnOutsideClick: props.clearSelectionOnOutsideClick })
})

export { update }

const TreeEvent = Schema.Union([
  Message.Clicked,
  Message.FocusedNode,
  Message.BlurredNode,
  Message.ClickedOutside,
  Message.DragStarted,
  Message.DraggedOver,
  Message.DragLeft,
  Message.Dropped,
  Message.DragEnded,
  Message.HoveredNode
])

type TreeEvent = typeof TreeEvent.Type

const isElement = (target: EventTarget | null): target is Element => target instanceof Element

const closestValue = (root: Element, target: EventTarget | null, selector: string): Option.Option<string> =>
  Option.fromNullishOr(target).pipe(
    Option.filter(isElement),
    Option.flatMap((element) => Option.fromNullishOr(element.closest(selector))),
    Option.filter((element) => root.contains(element)),
    Option.flatMap((element) => Option.fromNullishOr(element.getAttribute("data-value")))
  )

const offer =
  (queue: Queue.Queue<TreeEvent, Cause.Done>) =>
  (event: Option.Option<TreeEvent>): void => {
    Option.map(event, (message) => Queue.offerUnsafe(queue, message))
  }

const clickOf = (root: Element) => (event: Event) =>
  Option.map(closestValue(root, event.target, "[data-tree-label]"), (value) =>
    Message.Clicked({ value, shift: event instanceof MouseEvent && event.shiftKey })
  )

const focusOf = (root: Element) => (event: Event) =>
  Option.map(closestValue(root, event.target, '[role="treeitem"]'), (value) =>
    Message.FocusedNode({ value, visible: isElement(event.target) && event.target.matches(":focus-visible") })
  )

const blurOf = (root: Element) => (event: Event) =>
  Option.map(closestValue(root, event.target, '[role="treeitem"]'), (value) => Message.BlurredNode({ value }))

const outsideOf = (root: Element) => (event: Event) =>
  Option.liftPredicate(Message.ClickedOutside(), () => !(isElement(event.target) && root.contains(event.target)))

const hoverOf = (root: Element) => (event: Event) =>
  Option.some(
    Message.HoveredNode({
      value: Option.getOrNull(Option.map(labelOf(root, event.target), ({ value }) => value))
    })
  )

const draggingAttribute = "data-tree-dragging"

const handleAttribute = "data-tree-handle-active"

type Labelled = { readonly label: HTMLElement; readonly value: string }

const isDragEvent = (event: Event): event is DragEvent => event instanceof DragEvent

const labelOf = (root: Element, target: EventTarget | null): Option.Option<Labelled> =>
  Option.fromNullishOr(target).pipe(
    Option.filter(isElement),
    Option.flatMap((element) => Option.fromNullishOr(element.closest<HTMLElement>("[data-tree-label]"))),
    Option.filter((label) => root.contains(label)),
    Option.flatMap((label) =>
      Option.map(Option.fromNullishOr(label.getAttribute("data-value")), (value) => ({ label, value }))
    )
  )

const dragOf = (root: Element, event: Event) =>
  Option.liftPredicate(event, isDragEvent).pipe(
    Option.flatMap((drag) => Option.map(labelOf(root, drag.target), (labelled) => ({ ...labelled, drag })))
  )

const startOf = (root: Element, handle: boolean) => (event: Event) =>
  Option.flatMap(dragOf(root, event), ({ value, drag }) => {
    if (handle && !root.hasAttribute(handleAttribute)) {
      drag.preventDefault()
      return Option.none()
    }
    root.setAttribute(draggingAttribute, value)
    Option.map(Option.fromNullishOr(drag.dataTransfer), (transfer) => transfer.setData("text/plain", value))

    return Option.some(Message.DragStarted({ value }))
  })

const insideDragged = (root: Element, label: HTMLElement): boolean =>
  Option.fromNullishOr(root.getAttribute(draggingAttribute)).pipe(
    Option.flatMap((dragged) =>
      Option.fromNullishOr(root.querySelector(`[role="treeitem"][data-value="${CSS.escape(dragged)}"]`))
    ),
    Option.exists((source) => source.contains(label))
  )

const overOf = (root: Element) => (event: Event) =>
  dragOf(root, event).pipe(
    Option.filter(() => root.hasAttribute(draggingAttribute)),
    Option.filter(({ label }) => !insideDragged(root, label)),
    Option.map(({ label, value, drag }) => {
      drag.preventDefault()
      const item = label.closest('[role="treeitem"]')
      const box = label.getBoundingClientRect()
      const position = dropPosition(
        drag.clientY - box.top,
        box.height,
        item?.hasAttribute("aria-expanded") === true,
        item?.getAttribute("aria-expanded") === "true"
      )

      return Message.DraggedOver({ target: value, position })
    })
  )

const staysInside = (label: HTMLElement, drag: DragEvent) =>
  isElement(drag.relatedTarget) && label.contains(drag.relatedTarget)

const leaveOf = (root: Element) => (event: Event) =>
  dragOf(root, event).pipe(
    Option.filter(({ label, drag }) => !staysInside(label, drag)),
    Option.map(({ value }) => Message.DragLeft({ target: value }))
  )

const dropOf = (root: Element) => (event: Event) =>
  Option.liftPredicate(Message.Dropped(), () => root.hasAttribute(draggingAttribute)).pipe(
    Option.map((message) => {
      event.preventDefault()
      root.removeAttribute(draggingAttribute)

      return message
    })
  )

const endOf = (root: Element) => () => {
  root.removeAttribute(draggingAttribute)
  root.removeAttribute(handleAttribute)

  return Option.some(Message.DragEnded())
}

const pressOf = (root: Element) => (event: Event) => {
  Option.fromNullishOr(event.target).pipe(
    Option.filter(isElement),
    Option.filter((element) => element.closest("[data-tree-drag-handle]") !== null),
    Option.map(() => root.setAttribute(handleAttribute, ""))
  )

  return Option.none<TreeEvent>()
}

const WatchTree = Mount.defineStream("TreeEvents", {
  args: { outside: Schema.Boolean, dragAndDrop: Schema.Boolean, handle: Schema.Boolean },
  messages: [
    Message.Clicked,
    Message.FocusedNode,
    Message.BlurredNode,
    Message.ClickedOutside,
    Message.DragStarted,
    Message.DraggedOver,
    Message.DragLeft,
    Message.Dropped,
    Message.DragEnded,
    Message.HoveredNode
  ],
  execute: ({ element, outside, dragAndDrop, handle }) =>
    Stream.callback<TreeEvent>((queue) =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const send = offer(queue)
          const listeners: ReadonlyArray<readonly [string, (event: Event) => Option.Option<TreeEvent>]> = [
            ["click", clickOf(element)],
            ["mouseover", hoverOf(element)],
            ["mouseleave", () => Option.some(Message.HoveredNode({ value: null }))],
            ["focusin", focusOf(element)],
            ["focusout", blurOf(element)],
            ...(dragAndDrop
              ? ([
                  ["mousedown", pressOf(element)],
                  ["dragstart", startOf(element, handle)],
                  ["dragover", overOf(element)],
                  ["dragleave", leaveOf(element)],
                  ["drop", dropOf(element)],
                  ["dragend", endOf(element)]
                ] as const)
              : [])
          ]
          const bound = listeners.map(([type, handler]) => [type, (event: Event) => send(handler(event))] as const)
          const away = (event: Event) => send(outsideOf(element)(event))
          bound.forEach(([type, listener]) => element.addEventListener(type, listener))
          Option.liftPredicate(document, () => outside).pipe(Option.map((page) => page.addEventListener("click", away)))

          return () => {
            bound.forEach(([type, listener]) => element.removeEventListener(type, listener))
            document.removeEventListener("click", away)
          }
        }),
        (stop) => Effect.sync(stop)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

const styles = stylex.create({
  root: {
    [treeVars.levelOffset]: space.lg,
    [treeVars.lineWidth]: "1px",
    [treeVars.lineColor]: colors.defaultBorder,
    margin: 0,
    padding: 0,
    userSelect: "none"
  },
  subtree: { margin: 0, padding: 0 },
  hidden: { display: "none" },
  node: { cursor: "pointer", listStyle: "none", margin: 0, padding: 0, outline: 0 },
  lined: { position: "relative" },
  horizontal: {
    "::before": {
      content: "''",
      position: "absolute",
      top: "12px",
      insetInlineStart: `calc(${treeVars.labelOffset} - ${treeVars.levelOffset} / 2)`,
      width: `calc(${treeVars.levelOffset} / 2)`,
      height: 0,
      borderTopWidth: treeVars.lineWidth,
      borderTopStyle: "solid",
      borderTopColor: treeVars.lineColor,
      pointerEvents: "none",
      zIndex: 1
    }
  },
  vertical: {
    "::after": {
      content: "''",
      position: "absolute",
      top: 0,
      bottom: 0,
      insetInlineStart: `calc(${treeVars.labelOffset} - ${treeVars.levelOffset} / 2)`,
      width: 0,
      borderInlineStartWidth: treeVars.lineWidth,
      borderInlineStartStyle: "solid",
      borderInlineStartColor: treeVars.lineColor,
      pointerEvents: "none",
      zIndex: 1
    }
  },
  verticalLast: { "::after": { bottom: "auto", height: "12px" } },
  label: { position: "relative", paddingInlineStart: treeVars.labelOffset },
  selected: { backgroundColor: `light-dark(${palette.gray1}, ${palette.dark5})` },
  focusRing: { outline: `2px solid ${accent.filled}`, outlineOffset: "2px" },
  dragging: { opacity: 0.4 },
  dropBefore: {
    "::before": {
      content: "''",
      position: "absolute",
      top: "-1px",
      insetInlineStart: treeVars.labelOffset,
      insetInlineEnd: 0,
      height: "2px",
      backgroundColor: accent.filled,
      pointerEvents: "none",
      zIndex: 1
    }
  },
  dropAfter: {
    "::after": {
      content: "''",
      position: "absolute",
      bottom: "-1px",
      insetInlineStart: treeVars.labelOffset,
      insetInlineEnd: 0,
      height: "2px",
      backgroundColor: accent.filled,
      pointerEvents: "none",
      zIndex: 1
    }
  },
  dropInside: { backgroundColor: accent.light },
  loader: { marginInlineStart: "4px" },
  flatLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 0,
    borderInlineStartWidth: treeVars.lineWidth,
    borderInlineStartStyle: "solid",
    borderInlineStartColor: treeVars.lineColor,
    pointerEvents: "none",
    zIndex: 1
  },
  flatLineClosing: { bottom: "auto", height: "12px" }
})

export type FlatTreeNodeProps<M> = Omit<TreeProps<M>, "ariaLabel"> & {
  readonly entry: FlattenedTreeNode<TreeNodeData>
  readonly focusable?: boolean
}

type TreeBuildConfig = { readonly Tree?: TreeConfig; readonly Loader?: LoaderConfig }

const labelOffset = (level: number) => setVars([treeVars.labelOffset, `calc(${treeVars.levelOffset} * ${level - 1})`])

const treeBuilder = (config: TreeBuildConfig) => {
  const loader = Loader(config)

  return <M>(h: HtmlBuilder<M>, props: Omit<TreeProps<M>, "ariaLabel"> & { readonly ariaLabel?: string }) => {
    const getStyles = stylesApi<M, TreePart>(h, props, config.Tree, "root")
    const { model, toParentMessage: lift } = props
    const lines = props.withLines === true
    const dragAndDrop = props.withDragAndDrop === true
    const partsOf = (node: TreeNodeData, level: number) => {
      const expanded = model.expanded[node.value] === true
      const selected = model.selected.includes(node.value)
      const hasChildren = nodeHasChildren(node)
      const isLoading = model.loading.includes(node.value)
      const hovered = model.hovered === node.value
      const focused = model.focus !== null && model.focus.value === node.value && model.focus.visible
      const dragging = model.drag?.dragged === node.value
      const over = model.drag?.over?.target === node.value ? model.drag.over.position : null
      const labelStyles = [
        styles.label,
        selected && styles.selected,
        focused && styles.focusRing,
        dragging && styles.dragging,
        over === "before" && styles.dropBefore,
        over === "after" && styles.dropAfter,
        over === "inside" && styles.dropInside
      ]
      const labelAttributes = [
        h.DataAttribute("tree-label", ""),
        h.DataAttribute("value", node.value),
        ...(selected ? [h.DataAttribute("selected", "")] : []),
        ...(dragAndDrop ? [h.Draggable(true)] : []),
        ...(dragging ? [h.DataAttribute("dragging", "")] : []),
        ...(hovered ? [h.DataAttribute("hovered", "")] : []),
        ...(over === null ? [] : [h.DataAttribute("drag-over", over)])
      ]
      const payload: RenderTreeNodePayload<M> = {
        node,
        level,
        selected,
        isRoot: level === 1,
        expanded,
        hasChildren,
        isLoading,
        loadError: model.loadErrors[node.value] ?? null,
        checked: nodeChecked(model, node.value, props.data),
        indeterminate: nodeIndeterminate(model, node.value, props.data),
        elementProps: childAttributes(labelAttributes),
        elementStyles: [...labelStyles, ...listOf(config.Tree?.styles?.label), ...listOf(props.styles?.label)],
        dragHandleProps: childAttributes(
          props.withDragHandle === true ? [h.DataAttribute("tree-drag-handle", "")] : []
        ),
        actions: {
          toggleExpanded: lift(Message.ToggledExpanded({ value: node.value })),
          toggleChecked: lift(Message.ToggledChecked({ value: node.value })),
          toggleSelected: lift(Message.ToggledSelected({ value: node.value })),
          select: lift(Message.Selected({ value: node.value }))
        }
      }

      return { expanded, selected, hasChildren, isLoading, hovered, dragging, labelStyles, labelAttributes, payload }
    }
    type Parts = ReturnType<typeof partsOf>
    const labelView = (node: TreeNodeData, parts: Parts): Html =>
      props.renderNode === undefined
        ? h.div([...getStyles("label", ...parts.labelStyles), ...parts.labelAttributes], [node.label])
        : props.renderNode(parts.payload)
    const rowAttributes = (node: TreeNodeData, level: number, parts: Parts, focusable: boolean) => [
      h.Role("treeitem"),
      h.AriaSelected(parts.selected),
      ...(parts.hasChildren ? [h.AriaExpanded(parts.expanded)] : []),
      h.DataAttribute("value", node.value),
      h.DataAttribute("level", String(level)),
      ...(parts.selected ? [h.DataAttribute("selected", "")] : []),
      ...(parts.dragging ? [h.DataAttribute("dragging", "")] : []),
      ...(parts.hovered ? [h.DataAttribute("hovered", "")] : []),
      h.Tabindex(focusable ? 0 : -1),
      h.OnKeyDownSelfPreventDefault((key, modifiers) =>
        Option.liftPredicate(key, (pressed) => handledKeys.has(pressed)).pipe(
          Option.map((pressed) =>
            lift(Message.PressedKey({ value: node.value, key: pressed, shift: modifiers.shiftKey }))
          )
        )
      )
    ]
    const loadingRow = (level: number, parts: Parts): Html =>
      h.li(
        [...getStyles("node", styles.node, labelOffset(level + 1)), h.DataAttribute("loading", "")],
        [h.div(getStyles("label", ...parts.labelStyles), [loader(h, { size: 16, styles: { root: [styles.loader] } })])]
      )
    const nodeView = (node: TreeNodeData, level: number, first: boolean, last: boolean): Html => {
      const parts = partsOf(node, level)
      const children = node.children ?? []
      const subtreeShown = children.length > 0 && (parts.expanded || props.keepMounted === true)

      return h.li(
        [
          ...getStyles(
            "node",
            styles.node,
            lines && styles.lined,
            lines && level > 1 && !parts.dragging && styles.horizontal,
            lines && level > 1 && !parts.dragging && styles.vertical,
            lines && level > 1 && last && styles.verticalLast,
            labelOffset(level)
          ),
          ...rowAttributes(node, level, parts, first)
        ],
        [
          labelView(node, parts),
          ...(subtreeShown
            ? [
                h.ul(
                  [
                    ...getStyles("subtree", styles.subtree, !parts.expanded && styles.hidden),
                    h.Role("group"),
                    h.DataAttribute("level", String(level))
                  ],
                  children.map((child, index) => nodeView(child, level + 1, false, index === children.length - 1))
                )
              ]
            : []),
          ...(parts.expanded && parts.isLoading && children.length === 0
            ? [
                h.ul(
                  [...getStyles("subtree", styles.subtree), h.Role("group"), h.DataAttribute("level", String(level))],
                  [loadingRow(level, parts)]
                )
              ]
            : [])
        ]
      )
    }
    const flatNodeView = (entry: FlattenedTreeNode<TreeNodeData>, focusable: boolean): Html => {
      const parts = partsOf(entry.node, entry.level)

      return h.div(
        [
          ...getStyles(
            "node",
            styles.node,
            styles.lined,
            lines && entry.level > 1 && !parts.dragging && styles.horizontal,
            labelOffset(entry.level)
          ),
          ...rowAttributes(entry.node, entry.level, parts, focusable),
          ...(entry.parent === null ? [] : [h.DataAttribute("parent", entry.parent)])
        ],
        [
          ...(lines
            ? entry.linesPath.flatMap((state, index) =>
                state === "none"
                  ? []
                  : [
                      h.span(
                        [
                          ...sx(h, styles.flatLine, state === "closing" && styles.flatLineClosing),
                          setStyleAttribute(h, index + 2)
                        ],
                        []
                      )
                    ]
              )
            : []),
          labelView(entry.node, parts)
        ]
      )
    }
    const rootAttributes = [
      ...getStyles("root", styles.root, setDefinedVars([treeVars.levelOffset, mapDefined(props.levelOffset, spacing)])),
      h.Role("tree"),
      h.AriaMultiSelectable(model.multiple),
      ...(props.ariaLabel === undefined ? [] : [h.AriaLabel(props.ariaLabel)]),
      h.DataAttribute("tree-root", ""),
      h.DataAttribute("tree-id", model.id),
      ...(lines ? [h.DataAttribute("with-lines", "")] : []),
      h.OnMount(
        Mount.mapMessage(
          WatchTree({
            outside: props.clearSelectionOnOutsideClick === true,
            dragAndDrop,
            handle: props.withDragHandle === true
          }),
          lift
        )
      )
    ]

    return { nodeView, flatNodeView, rootAttributes }
  }
}

const setStyleAttribute = <M>(h: HtmlBuilder<M>, column: number) =>
  h.Style({ insetInlineStart: `calc((${column} - 1.5) * ${treeVars.levelOffset})` })

export const Tree = (config: TreeBuildConfig) => {
  const build = treeBuilder(config)

  return <M>(h: HtmlBuilder<M>, input: TreeProps<M>): Html => {
    const props = withDefaults(config.Tree, input)
    const { nodeView, rootAttributes } = build(h, props)

    return h.ul(
      rootAttributes,
      props.data.map((node, index) => nodeView(node, 1, index === 0, index === props.data.length - 1))
    )
  }
}

export const FlatTreeNode = (config: TreeBuildConfig) => {
  const build = treeBuilder(config)

  return <M>(h: HtmlBuilder<M>, input: FlatTreeNodeProps<M>): Html => {
    const props = withDefaults(config.Tree, input)

    return build(h, props).flatNodeView(props.entry, props.focusable === true)
  }
}

export const treeRootAttributes = (config: TreeBuildConfig) => {
  const build = treeBuilder(config)

  return <M>(h: HtmlBuilder<M>, input: TreeProps<M>): ReadonlyArray<ChildAttribute> =>
    childAttributes(build(h, withDefaults(config.Tree, input)).rootAttributes)
}
