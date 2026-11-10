import { describe, expect, it } from "@effect/vitest"
import { Option } from "effect"
import { Story } from "foldkit/test"
import { listingOutMessages, modelAfter } from "@sth-ui/testing/Story.ts"
import { FocusMessage, FocusNode } from "./focus.ts"
import {
  flattenTreeData,
  defaultTreeNodeFilter,
  dropPosition,
  filterTreeData,
  findTreeNode,
  flatValues,
  getAllCheckedNodes,
  getAllChildrenNodes,
  getChildrenNodesValues,
  getTreeExpandedState,
  handledKeys,
  init,
  isDescendant,
  isNodeChecked,
  isNodeIndeterminate,
  mergeAsyncChildren,
  Message,
  moveTreeNode,
  nodeChecked,
  nodeHasChildren,
  nodeIndeterminate,
  nodeLabelText,
  OutMessage,
  update,
  valuesRange
} from "./model.ts"
import type { Model, TreeContext } from "./model.ts"

const data = [
  {
    value: "src",
    children: [
      { value: "src/components", children: [{ value: "src/a.tsx" }, { value: "src/b.tsx" }] },
      { value: "src/index.ts" }
    ]
  },
  { value: "package.json" },
  { value: "lazy", hasChildren: true }
]

const context: TreeContext = { data }

const { Command, expectNoOutMessage, expectOutMessage, given, message, model, story } = Story

type Step = Parameters<typeof story<Model, Message, ReadonlyArray<OutMessage>>>[1]

const tree = (options: TreeContext = context) =>
  listingOutMessages((current: Model, sent: Message) => update(current, sent, options))

const fresh = () => init({ id: "tree", data })

const after = (messages: ReadonlyArray<Message>, from: Model = fresh(), options: TreeContext = context) =>
  modelAfter((current: Model, sent: Message) => update(current, sent, options), from, messages)

const step = (from: Model, sent: Message, options: TreeContext, ...steps: ReadonlyArray<Step>) =>
  story(tree(options), given(from), message(sent), ...steps)

const unchanged = (from: Model, sent: Message, options: TreeContext = context) =>
  step(
    from,
    sent,
    options,
    model((current) => expect(current).toEqual(from)),
    expectNoOutMessage(),
    Command.expectNone()
  )

const has = (expected: object) => model<Model>((current) => expect(current).toMatchObject(expected))

const selected = (expected: ReadonlyArray<string>) =>
  model<Model>((current) => expect(current.selected).toEqual(expected))

const checked = (expected: ReadonlyArray<string>) =>
  model<Model>((current) => expect(current.checked).toEqual(expected))

const expanded = (value: string, expected: boolean) =>
  model<Model>((current) => expect(current.expanded[value] === true).toBe(expected))

const focusedOn = (treeId: string, value: string) =>
  [
    Command.expectExact(FocusNode({ tree: treeId, value })),
    Command.resolve(FocusNode({ tree: treeId, value }), FocusMessage.Focused())
  ] as const

const noFocus = Command.expectNone()

const key = (value: string, pressedKey: string, shift = false) => Message.PressedKey({ value, key: pressedKey, shift })

describe("Tree helpers", () => {
  it("walks, finds and flattens nodes", () => {
    expect(flatValues(data)).toEqual([
      "src",
      "src/components",
      "src/a.tsx",
      "src/b.tsx",
      "src/index.ts",
      "package.json",
      "lazy"
    ])
    expect(Option.map(findTreeNode("src/b.tsx", data), (node) => node.value)).toEqual(Option.some("src/b.tsx"))
    expect(findTreeNode("missing", data)).toEqual(Option.none())
    expect(getChildrenNodesValues("src", data)).toEqual(["src/a.tsx", "src/b.tsx", "src/index.ts"])
    expect(getChildrenNodesValues("missing", data)).toEqual([])
    expect(getAllChildrenNodes(data)).toEqual(["src/a.tsx", "src/b.tsx", "src/index.ts", "package.json", "lazy"])
    expect(nodeHasChildren({ value: "lazy", hasChildren: true })).toBe(true)
    expect(nodeHasChildren({ value: "leaf" })).toBe(false)
  })

  it("works out checked and indeterminate parents", () => {
    expect(
      getAllCheckedNodes(data, ["src/a.tsx"]).map((node) => [node.value, node.checked, node.indeterminate])
    ).toEqual([
      ["src/a.tsx", true, false],
      ["src/components", false, true],
      ["src", false, true]
    ])
    expect(getAllCheckedNodes(data, ["package.json"]).map((node) => node.value)).toEqual(["package.json"])
    const all = ["src/a.tsx", "src/b.tsx", "src/index.ts"]
    expect(isNodeChecked("src", data, all)).toBe(true)
    expect(isNodeChecked("src", data, [])).toBe(false)
    expect(isNodeChecked("src/a.tsx", data, all)).toBe(true)
    expect(isNodeChecked("src", data, ["src/a.tsx"])).toBe(false)
    expect(isNodeIndeterminate("src", data, ["src/a.tsx"])).toBe(true)
    expect(isNodeIndeterminate("src", data, [])).toBe(false)
  })

  it("builds expanded states and value ranges", () => {
    expect(getTreeExpandedState(data, ["src"])["src"]).toBe(true)
    expect(getTreeExpandedState(data, ["src"])["package.json"]).toBe(false)
    expect(Object.values(getTreeExpandedState(data, "*")).every(Boolean)).toBe(true)
    expect(valuesRange("src/b.tsx", "src", flatValues(data))).toEqual([
      "src",
      "src/components",
      "src/a.tsx",
      "src/b.tsx"
    ])
    expect(valuesRange(null, "src", flatValues(data))).toEqual([])
    expect(handledKeys.has(" ")).toBe(true)
  })
})

describe("Tree model", () => {
  it("starts from the initial states", () => {
    const started = init({
      id: "tree",
      data,
      initialExpandedState: { src: true },
      initialCheckedState: ["src/components"]
    })
    expect(started.expanded["src"]).toBe(true)
    expect(started.expanded["package.json"]).toBe(false)
    expect(started.checked).toEqual(["src/a.tsx", "src/b.tsx"])
    expect(init({ id: "tree", checkStrictly: true, initialCheckedState: ["src"] }).checked).toEqual(["src"])
    expect(init({ id: "tree" }).expanded).toEqual({})
  })

  it("expands and collapses, reporting real changes only", () =>
    story(
      tree(),
      given(fresh()),
      message(Message.ToggledExpanded({ value: "src" })),
      expectOutMessage([OutMessage.NodeExpanded({ value: "src" })]),
      message(Message.Expanded({ value: "src" })),
      expectNoOutMessage(),
      message(Message.Collapsed({ value: "src" })),
      expectOutMessage([OutMessage.NodeCollapsed({ value: "src" })])
    ))

  it("expands and collapses everything, or sets the state", () => {
    step(
      fresh(),
      Message.ExpandedAll(),
      context,
      model((current) => expect(Object.values(current.expanded).every(Boolean)).toBe(true))
    )
    step(
      after([Message.ToggledExpanded({ value: "src" })]),
      Message.CollapsedAll(),
      context,
      model((current) => expect(Object.values(current.expanded).some(Boolean)).toBe(false))
    )
    step(
      fresh(),
      Message.SetExpanded({ state: { lazy: true } }),
      context,
      model((current) => expect(current.expanded).toEqual({ lazy: true }))
    )
  })

  it("clicks to expand, select and select a range", () =>
    story(
      tree({ ...context, selectOnClick: true }),
      given(fresh()),
      message(Message.Clicked({ value: "src", shift: false })),
      expanded("src", true),
      selected(["src"]),
      ...focusedOn("tree", "src"),
      message(Message.Clicked({ value: "src/a.tsx", shift: true })),
      selected(["src", "src/components", "src/a.tsx"]),
      ...focusedOn("tree", "src/a.tsx")
    ))

  it("clicks without expanding, or without range selection", () => {
    step(
      fresh(),
      Message.Clicked({ value: "src", shift: true }),
      { ...context, expandOnClick: false },
      expanded("src", false),
      selected([]),
      ...focusedOn("tree", "src")
    )
    step(
      after([Message.Clicked({ value: "src", shift: false })], fresh(), { ...context, selectOnClick: true }),
      Message.Clicked({ value: "package.json", shift: true }),
      { ...context, allowRangeSelection: false },
      selected(["src"]),
      ...focusedOn("tree", "package.json")
    )
  })

  it("selects one at a time", () => {
    const picked = after([Message.Selected({ value: "src" })])
    step(picked, Message.Selected({ value: "package.json" }), context, selected(["package.json"]))
    step(picked, Message.ToggledSelected({ value: "src" }), context, has({ selected: [], anchor: null }))
    step(fresh(), Message.ToggledSelected({ value: "src" }), context, selected(["src"]))
  })

  it("selects many", () => {
    const both = after(
      [Message.Selected({ value: "src" }), Message.Selected({ value: "lazy" })],
      init({ id: "tree", multiple: true })
    )
    expect(both.selected).toEqual(["src", "lazy"])
    step(both, Message.Selected({ value: "lazy" }), context, selected(["src", "lazy"]))
    step(both, Message.Deselected({ value: "lazy" }), context, has({ selected: ["src"], anchor: null }))
    step(both, Message.Deselected({ value: "src" }), context, has({ anchor: "lazy" }))
    step(both, Message.ClearedSelection(), context, selected([]))
    step(both, Message.SetSelected({ values: ["x"] }), context, selected(["x"]))
    unchanged(both, Message.ClickedOutside())
    step(both, Message.ClickedOutside(), { ...context, clearSelectionOnOutsideClick: true }, selected([]))
  })

  it("checks with children", () => {
    const withComponents = after([Message.Checked({ value: "src/components" })])
    expect(withComponents.checked).toEqual(["src/a.tsx", "src/b.tsx"])
    expect(nodeChecked(withComponents, "src/components", data)).toBe(true)
    expect(nodeIndeterminate(withComponents, "src", data)).toBe(true)
    step(withComponents, Message.Unchecked({ value: "src" }), context, checked([]))
    step(withComponents, Message.ToggledChecked({ value: "src/components" }), context, checked([]))
    step(fresh(), Message.ToggledChecked({ value: "package.json" }), context, checked(["package.json"]))
    step(fresh(), Message.CheckedAll(), context, checked(getAllChildrenNodes(data)))
    step(withComponents, Message.UncheckedAll(), context, checked([]))
    step(fresh(), Message.SetChecked({ values: ["lazy"] }), context, checked(["lazy"]))
  })

  it("checks strictly", () => {
    const strict = init({ id: "tree", checkStrictly: true })
    const strictChecked = after([Message.Checked({ value: "src" })], strict)
    expect(strictChecked.checked).toEqual(["src"])
    expect(nodeChecked(strictChecked, "src", data)).toBe(true)
    expect(nodeIndeterminate(strictChecked, "src", data)).toBe(false)
    step(strictChecked, Message.Unchecked({ value: "src" }), context, checked([]))
    step(strict, Message.CheckedAll(), context, checked(flatValues(data)))
  })

  it("moves focus from the keyboard", () => {
    const opened = after([key("src", "ArrowRight")])
    step(fresh(), key("src", "ArrowDown"), context, ...focusedOn("tree", "package.json"))
    step(fresh(), key("lazy", "ArrowDown"), context, noFocus)
    step(fresh(), key("package.json", "ArrowUp"), context, ...focusedOn("tree", "src"))
    step(opened, key("src", "ArrowRight"), context, ...focusedOn("tree", "src/components"))
    step(opened, key("src", "ArrowDown"), context, ...focusedOn("tree", "src/components"))
    step(opened, key("src/index.ts", "ArrowLeft"), context, ...focusedOn("tree", "src"))
    step(fresh(), key("package.json", "ArrowLeft"), context, noFocus)
    step(after([key("package.json", "ArrowRight")]), key("package.json", "ArrowRight"), context, noFocus)
  })

  it("expands, collapses, selects and checks from the keyboard", () => {
    const opened = after([key("src", "ArrowRight")])
    step(fresh(), key("src", "ArrowRight"), context, expanded("src", true))
    step(opened, key("src", "ArrowLeft"), context, expanded("src", false))
    const anchored = after([Message.Selected({ value: "src" })], opened)
    step(
      anchored,
      key("src", "ArrowDown", true),
      context,
      selected(["src", "src/components"]),
      ...focusedOn("tree", "src/components")
    )
    step(anchored, key("lazy", "ArrowDown", true), context, selected(["src"]))
    step(fresh(), key("src", " "), context, expanded("src", true))
    step(
      fresh(),
      key("package.json", " "),
      { ...context, expandOnSpace: false, checkOnSpace: true },
      checked(["package.json"])
    )
    unchanged(fresh(), key("src", "Enter"))
  })

  it("tracks focus", () => {
    const focused = after([Message.FocusedNode({ value: "src", visible: true })])
    expect(focused.focus).toEqual({ value: "src", visible: true })
    unchanged(focused, Message.BlurredNode({ value: "lazy" }))
    step(
      focused,
      Message.BlurredNode({ value: "src" }),
      context,
      model((current) => expect(current.focus).toBeNull())
    )
    unchanged(fresh(), Message.CompletedFocus())
  })
})

const values = (moved: ReadonlyArray<{ readonly value: string }>) => moved.map((node) => node.value)

const allowDrop = ({ targetNode }: { readonly targetNode: string }) => targetNode !== "lazy"

describe("Tree hover", () => {
  it("remembers the hovered node", () => {
    const hovered = after([Message.HoveredNode({ value: "src" })])
    expect(hovered.hovered).toBe("src")
    unchanged(hovered, Message.HoveredNode({ value: "src" }))
    step(
      hovered,
      Message.HoveredNode({ value: null }),
      context,
      model((current) => expect(current.hovered).toBeNull())
    )
  })
})

describe("Tree drag and drop", () => {
  it("picks before, after or inside like Mantine", () => {
    expect(dropPosition(5, 30, false, false)).toBe("before")
    expect(dropPosition(20, 30, false, false)).toBe("after")
    expect(dropPosition(5, 30, true, false)).toBe("before")
    expect(dropPosition(15, 30, true, false)).toBe("inside")
    expect(dropPosition(25, 30, true, false)).toBe("after")
    expect(dropPosition(10, 30, true, true)).toBe("before")
    expect(dropPosition(20, 30, true, true)).toBe("inside")
    expect(isDescendant(data, "src", "src/a.tsx")).toBe(true)
    expect(isDescendant(data, "package.json", "src")).toBe(false)
    expect(isDescendant(data, "missing", "src")).toBe(false)
  })

  it("moves nodes before, after and inside others", () => {
    expect(values(moveTreeNode(data, { draggedNode: "lazy", targetNode: "src", position: "before" }))).toEqual([
      "lazy",
      "src",
      "package.json"
    ])
    expect(values(moveTreeNode(data, { draggedNode: "src", targetNode: "lazy", position: "after" }))).toEqual([
      "package.json",
      "lazy",
      "src"
    ])
    const inside = moveTreeNode(data, { draggedNode: "package.json", targetNode: "src/components", position: "inside" })
    expect(flatValues(inside)).toContain("package.json")
    expect(values(inside)).toEqual(["src", "lazy"])
    expect(values(inside[0]?.children?.[0]?.children ?? [])).toEqual(["src/a.tsx", "src/b.tsx", "package.json"])
    const intoLeaf = moveTreeNode(data, { draggedNode: "src/a.tsx", targetNode: "package.json", position: "inside" })
    expect(values(intoLeaf[1]?.children ?? [])).toEqual(["src/a.tsx"])
    const deep = moveTreeNode(data, { draggedNode: "package.json", targetNode: "src/b.tsx", position: "before" })
    expect(values(deep[0]?.children?.[0]?.children ?? [])).toEqual(["src/a.tsx", "package.json", "src/b.tsx"])
    expect(moveTreeNode(data, { draggedNode: "src", targetNode: "src", position: "inside" })).toBe(data)
    expect(moveTreeNode(data, { draggedNode: "src", targetNode: "missing", position: "inside" })).toBe(data)
    expect(moveTreeNode(data, { draggedNode: "src", targetNode: "src/a.tsx", position: "inside" })).toBe(data)
    expect(moveTreeNode(data, { draggedNode: "missing", targetNode: "src", position: "inside" })).toBe(data)
  })

  it("tracks a drag and reports allowed drops", () => {
    const rules = { ...context, allowDrop }
    unchanged(fresh(), Message.DraggedOver({ target: "src", position: "inside" }), rules)
    const started = after([Message.DragStarted({ value: "package.json" })], fresh(), rules)
    expect(started.drag).toEqual({ dragged: "package.json", over: null })
    const over = after([Message.DraggedOver({ target: "src", position: "inside" })], started, rules)
    expect(over.drag?.over).toEqual({ target: "src", position: "inside" })
    step(
      over,
      Message.DraggedOver({ target: "lazy", position: "before" }),
      rules,
      model((current) => expect(current.drag?.over).toBeNull())
    )
    unchanged(over, Message.DragLeft({ target: "lazy" }), rules)
    step(
      over,
      Message.DragLeft({ target: "src" }),
      rules,
      model((current) => expect(current.drag?.over).toBeNull())
    )
    step(
      over,
      Message.Dropped(),
      rules,
      expectOutMessage([
        OutMessage.DragDropped({ draggedNode: "package.json", targetNode: "src", position: "inside" })
      ]),
      model((current) => expect(current.drag).toBeNull())
    )
    step(over, Message.Dropped(), { ...context, allowDrop: () => false }, expectNoOutMessage())
    step(started, Message.Dropped(), rules, expectNoOutMessage())
    step(fresh(), Message.Dropped(), rules, expectNoOutMessage())
    step(
      over,
      Message.DragEnded(),
      rules,
      model((current) => expect(current.drag).toBeNull())
    )
    step(
      started,
      Message.DraggedOver({ target: "src", position: "after" }),
      context,
      model((current) => expect(current.drag?.over).toEqual({ target: "src", position: "after" }))
    )
  })
})

type LabelledNode = {
  readonly value: string
  readonly label?: string
  readonly children?: ReadonlyArray<LabelledNode>
}

describe("Tree search", () => {
  const labelled: ReadonlyArray<LabelledNode> = [
    { value: "src", label: "Source", children: [{ value: "src/app.ts", label: "App" }, { value: "src/tree.ts" }] },
    { value: "docs", label: "Docs", children: [] },
    { value: "readme", label: "Readme" }
  ]

  it("keeps matches and the parents leading to them", () => {
    expect(nodeLabelText(labelled[0] ?? { value: "" })).toBe("Source")
    expect(nodeLabelText({ value: "plain" })).toBe("plain")
    expect(defaultTreeNodeFilter(" APP ", { value: "x", label: "App" })).toBe(true)
    expect(filterTreeData(labelled, "  ")).toBe(labelled)
    expect(filterTreeData(labelled, "tree")).toEqual([
      { value: "src", label: "Source", children: [{ value: "src/tree.ts" }] }
    ])
    expect(filterTreeData(labelled, "docs").map((node) => node.value)).toEqual(["docs"])
    expect(filterTreeData(labelled, "source")[0]?.children).toEqual(labelled[0]?.children)
    expect(
      filterTreeData(labelled, "r", (query, node) => node.value.startsWith(query)).map((node) => node.value)
    ).toEqual(["readme"])
  })
})

describe("Tree async children", () => {
  const folders = [
    { value: "documents", hasChildren: true },
    { value: "photos", hasChildren: true },
    { value: "readme" }
  ]
  const loading = { data: folders, loadChildren: true }
  const freshFolders = () => init({ id: "async", data: folders })

  it("asks for children the first time an unloaded node is expanded", () =>
    story(
      tree(loading),
      given(freshFolders()),
      message(Message.ToggledExpanded({ value: "documents" })),
      has({ loading: ["documents"] }),
      expectOutMessage([
        OutMessage.NodeExpanded({ value: "documents" }),
        OutMessage.LoadChildren({ value: "documents" })
      ]),
      message(Message.ToggledExpanded({ value: "documents" })),
      message(Message.ToggledExpanded({ value: "documents" })),
      expectOutMessage([OutMessage.NodeExpanded({ value: "documents" })]),
      message(Message.ChildrenLoaded({ value: "documents" })),
      has({ loading: [], loaded: ["documents"] }),
      message(Message.Collapsed({ value: "documents" })),
      message(Message.Expanded({ value: "documents" })),
      expectOutMessage([OutMessage.NodeExpanded({ value: "documents" })])
    ))

  it("keeps load errors until the node is loaded again", () =>
    story(
      tree(loading),
      given(freshFolders()),
      message(Message.LoadNode({ value: "photos" })),
      message(Message.ChildrenLoadFailed({ value: "photos", error: "Offline" })),
      has({ loadErrors: { photos: "Offline" }, loading: [] }),
      message(Message.LoadNode({ value: "photos" })),
      has({ loadErrors: {} }),
      expectOutMessage([OutMessage.LoadChildren({ value: "photos" })])
    ))

  it("loads nothing for a leaf, or without loadChildren", () => {
    step(freshFolders(), Message.LoadNode({ value: "readme" }), loading, expectNoOutMessage())
    step(freshFolders(), Message.LoadNode({ value: "photos" }), { data: folders }, expectNoOutMessage())
  })

  it("merges loaded children under their parent", () => {
    const children = [{ value: "documents/a.txt" }]
    const merged = mergeAsyncChildren(
      [{ value: "root", children: [{ value: "documents", hasChildren: true }] }, { value: "other" }],
      "documents",
      children
    )
    expect(merged).toEqual([
      { value: "root", children: [{ value: "documents", children, hasChildren: false }] },
      { value: "other" }
    ])
  })
})

describe("flattenTreeData, as Mantine's", () => {
  type Node = { readonly value: string; readonly children?: ReadonlyArray<Node>; readonly hasChildren?: boolean }
  const flatData: ReadonlyArray<Node> = [
    { value: "a" },
    {
      value: "b",
      children: [{ value: "b1" }, { value: "b2", children: [{ value: "b2a" }, { value: "b2b" }] }, { value: "b3" }]
    },
    { value: "c" }
  ]
  const linesByValue = (state: Readonly<Record<string, boolean>>) =>
    Object.fromEntries(flattenTreeData(flatData, state).map((row) => [row.node.value, row.linesPath]))

  it("draws continuing, closing and missing lines by sibling position", () => {
    const lines = linesByValue({ a: true, b: true, b2: true, c: true })
    expect(lines["a"]).toEqual([])
    expect(lines["b1"]).toEqual(["continuing"])
    expect(lines["b3"]).toEqual(["closing"])
    expect(lines["b2a"]).toEqual(["continuing", "continuing"])
    expect(lines["b2b"]).toEqual(["continuing", "closing"])
    const lastAncestor: ReadonlyArray<Node> = [
      { value: "root", children: [{ value: "first" }, { value: "last", children: [{ value: "l1" }, { value: "l2" }] }] }
    ]
    const nested = Object.fromEntries(
      flattenTreeData(lastAncestor, { root: true, last: true }).map((row) => [row.node.value, row.linesPath])
    )
    expect(nested["last"]).toEqual(["closing"])
    expect(nested["l1"]).toEqual(["none", "continuing"])
    expect(nested["l2"]).toEqual(["none", "closing"])
  })

  it("leaves collapsed branches out and reports parents and children", () => {
    const flat = flattenTreeData(flatData, { b: false })
    expect(flat.map((row) => row.node.value)).toEqual(["a", "b", "c"])
    const open = flattenTreeData(flatData, { b: true })
    expect(open.find((row) => row.node.value === "b1")?.parent).toBe("b")
    expect(open.find((row) => row.node.value === "b")?.expanded).toBe(true)
    const shapes: ReadonlyArray<Node> = [
      { value: "populated", children: [{ value: "child" }] },
      { value: "empty", children: [] },
      { value: "async", hasChildren: true },
      { value: "leaf" }
    ]
    expect(Object.fromEntries(flattenTreeData(shapes, {}).map((row) => [row.node.value, row.hasChildren]))).toEqual({
      populated: true,
      empty: false,
      async: true,
      leaf: false
    })
  })
})
