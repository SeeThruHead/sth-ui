import * as FoldkitCombobox from "@foldkit/ui/combobox"
import { describe, expect, it } from "@effect/vitest"
import { Option } from "effect"
import { Story } from "foldkit/test"
import { listingOutMessages, modelAfter } from "@sth-ui/testing/Story.ts"
import { comboboxClosed, comboboxMoved, comboboxOpened } from "../../testing/combobox.ts"
import {
  ancestorsOf,
  checkedToValue,
  expandToLeafChecked,
  flattenTreeSelectData,
  init,
  internalChecked,
  labelOf,
  Message,
  nodeState,
  OutMessage,
  update,
  visibleNodes
} from "./model.ts"
import type { Model, TreeSelectContext, TreeSelectNode } from "./model.ts"

const data: ReadonlyArray<TreeSelectNode> = [
  {
    value: "fruits",
    label: "Fruits",
    children: [
      { value: "apple", label: "Apple" },
      { value: "banana", label: "Banana" }
    ]
  },
  {
    value: "veg",
    label: "Vegetables",
    children: [
      {
        value: "greens",
        label: "Greens",
        children: [
          { value: "kale", label: "Kale" },
          { value: "spinach", label: "Spinach" }
        ]
      },
      { value: "carrot", label: "Carrot" }
    ]
  },
  { value: "lazy", label: "Lazy", hasChildren: true },
  { value: "bread", label: "Bread" }
]

const { Message: Combo } = FoldkitCombobox

const values = (nodes: ReadonlyArray<{ readonly node: { readonly value: string } }>) =>
  nodes.map((flat) => flat.node.value)

const select = (item: string) =>
  Message.GotCombobox({ message: Combo.SelectedItem({ item, displayText: item, wasSelected: false }) })

const toggle = Message.GotCombobox({
  message: Combo.PressedToggleButton({ restingInputValue: "", isClearable: false })
})

const { expectNoOutMessage, expectOutMessage, given, message, model, story } = Story

type Step = Parameters<typeof story<Model, Message, ReadonlyArray<OutMessage>>>[1]

const treeSelect = (context: TreeSelectContext) =>
  listingOutMessages((current: Model, sent: Message) => update(current, sent, context))

const after = (from: Model, messages: ReadonlyArray<Message>, context: TreeSelectContext) =>
  modelAfter((current: Model, sent: Message) => update(current, sent, context), from, messages)

const step = (from: Model, sent: Message, context: TreeSelectContext, ...steps: ReadonlyArray<Step>) =>
  story(treeSelect(context), given(from), message(sent), ...steps)

const unchanged = (from: Model, sent: Message, context: TreeSelectContext) =>
  step(
    from,
    sent,
    context,
    model((current) => expect(current).toEqual(from)),
    expectNoOutMessage()
  )

const opened = (from: Model, context: TreeSelectContext) => after(from, [toggle], context)

const activated = (index: number) =>
  Message.GotCombobox({
    message: Combo.ActivatedItem({ index, activationTrigger: "Keyboard", maybeImmediateSelection: Option.none() })
  })

const activate = (from: Model, index: number, context: TreeSelectContext) => after(from, [activated(index)], context)

const isOpen = (expected: boolean) => model<Model>((current) => expect(current.combobox.isOpen).toBe(expected))

const inputValue = (expected: string) => model<Model>((current) => expect(current.combobox.inputValue).toBe(expected))

const expanded = (value: string, expected: boolean) =>
  model<Model>((current) => expect(current.expanded[value] === true).toBe(expected))

const changed = (value: string | null, chosen: ReadonlyArray<string>) => OutMessage.Changed({ value, values: chosen })

const press = (key: string) => Message.PressedKey({ key })

const typed = (state: Model, value: string): Model => ({ ...state, combobox: { ...state.combobox, inputValue: value } })

describe("TreeSelect helpers", () => {
  it("flattens the visible nodes with line guides", () => {
    const flat = flattenTreeSelectData(data, { veg: true, greens: true, lazy: true })
    expect(values(flat)).toEqual(["fruits", "veg", "greens", "kale", "spinach", "carrot", "lazy", "bread"])
    expect(flat[3]).toMatchObject({ level: 3, parent: "greens", lineGuides: [true], isLastChild: false })
    expect(flat[2]).toMatchObject({ level: 2, hasChildren: true, expanded: true, lineGuides: [] })
    expect(flat[6]).toMatchObject({ hasChildren: true, expanded: true })
    expect(flat[7]).toMatchObject({ hasChildren: false, isLastChild: true })
  })

  it("turns checked leaves into values by strategy", () => {
    expect(expandToLeafChecked(["veg", "apple", "kale"], data)).toEqual(["kale", "spinach", "carrot", "apple"])
    const checked = ["kale", "spinach", "apple"]
    expect(checkedToValue(checked, data, "child")).toBe(checked)
    expect(checkedToValue(checked, data, "all")).toEqual(["apple", "kale", "spinach", "greens"])
    expect(checkedToValue(checked, data, "parent")).toEqual(["apple", "greens"])
    expect(checkedToValue([], data, "parent")).toEqual([])
    expect(ancestorsOf("spinach", data)).toEqual(Option.some(["veg", "greens"]))
    expect(ancestorsOf("missing", data)).toEqual(Option.none())
    expect(labelOf("kale", data)).toBe("Kale")
    expect(labelOf("bread", data)).toBe("Bread")
    expect(labelOf("missing", data)).toBe("missing")
  })

  it("starts with Mantine's expanded state and search text", () => {
    expect(init({ id: "t", data }).expanded["veg"]).toBe(false)
    expect(init({ id: "t", data, defaultExpandAll: true }).expanded["greens"]).toBe(true)
    expect(init({ id: "t", data, defaultExpandedValues: ["veg"] }).expanded["veg"]).toBe(true)
    expect(init({ id: "t", data, value: ["kale"] }).combobox.inputValue).toBe("Kale")
    expect(init({ id: "t", data, value: ["kale"], mode: "single" }).combobox.inputValue).toBe("Kale")
    expect(init({ id: "t", data, value: ["kale"], mode: "multiple" }).combobox.inputValue).toBe("")
    expect(init({ id: "t", data }).combobox.inputValue).toBe("")
    expect(init({ id: "t", data, value: ["kale"], defaultSearchValue: "ka" }).combobox.inputValue).toBe("ka")
  })

  it("knows each node's state in every mode", () => {
    expect(nodeState("apple", { data, value: ["apple"] })).toEqual({
      selected: true,
      checked: false,
      indeterminate: false
    })
    const checkbox = { data, value: ["kale"], mode: "checkbox" as const }
    expect(internalChecked(checkbox)).toEqual(["kale"])
    expect(internalChecked({ data, value: ["kale"] })).toEqual([])
    expect(nodeState("greens", checkbox)).toEqual({ selected: false, checked: false, indeterminate: true })
    expect(nodeState("kale", checkbox).checked).toBe(true)
    const strict = { ...checkbox, value: ["greens"], checkStrictly: true }
    expect(internalChecked(strict)).toEqual(["greens"])
    expect(nodeState("greens", strict)).toEqual({ selected: false, checked: true, indeterminate: false })
    expect(nodeState("kale", strict).checked).toBe(false)
  })
})

describe("TreeSelect single mode", () => {
  const context = { data, value: [] }
  const open = () => opened(init({ id: "t", data }), context)

  it("opens", () => step(init({ id: "t", data }), toggle, context, isOpen(true), comboboxOpened()))

  it("selects, closes and shows the label", () =>
    step(
      open(),
      select("apple"),
      context,
      expectOutMessage([changed("apple", ["apple"]), OutMessage.DropdownClosed()]),
      isOpen(false),
      inputValue("Apple"),
      comboboxClosed()
    ))

  it("deselects the selected value, unless told not to", () => {
    step(
      open(),
      select("apple"),
      { data, value: ["apple"] },
      expectOutMessage([changed(null, []), OutMessage.DropdownClosed()]),
      inputValue(""),
      comboboxClosed()
    )
    step(
      open(),
      select("apple"),
      { data, value: ["apple"], allowDeselect: false, clearSearchOnChange: false },
      expectOutMessage([changed("apple", ["apple"]), OutMessage.DropdownClosed()]),
      inputValue(""),
      comboboxClosed()
    )
  })

  it("expands parents instead of selecting them with expandOnClick", () => {
    step(
      open(),
      select("fruits"),
      { ...context, expandOnClick: true },
      expanded("fruits", true),
      expectOutMessage([OutMessage.ExpandedChanged({ values: ["fruits"] })])
    )
    step(
      open(),
      select("bread"),
      { ...context, expandOnClick: true },
      expectOutMessage([changed("bread", ["bread"]), OutMessage.DropdownClosed()]),
      comboboxClosed()
    )
  })

  it("ignores the selection a chevron press causes", () =>
    story(
      treeSelect(context),
      given(open()),
      message(Message.PressedChevron({ value: "veg" })),
      expanded("veg", true),
      model((current) => expect(current.skip).toBe("veg")),
      message(select("veg")),
      expectNoOutMessage(),
      model((current) => expect(current.skip).toBeNull()),
      isOpen(true)
    ))

  it("filters while searching but not on the selected label", () => {
    const searchable = { data, value: ["kale"], searchable: true }
    const closed = init({ id: "t", data, value: ["kale"] })
    expect(values(visibleNodes(closed, searchable))).toEqual(["fruits", "veg", "lazy", "bread"])
    expect(values(visibleNodes(typed(closed, "spin"), searchable))).toEqual(["veg", "greens", "spinach"])
    expect(values(visibleNodes(typed(closed, "spin"), { data, value: [] }))).toEqual(["fruits", "veg", "lazy", "bread"])
    expect(values(visibleNodes(typed(closed, ""), { data, value: [], searchable: true }))).toEqual([
      "fruits",
      "veg",
      "lazy",
      "bread"
    ])
  })

  it("expands down to the selected value when it opens", () => {
    step(
      init({ id: "t", data, value: ["kale"] }),
      toggle,
      { data, value: ["kale"], searchable: true },
      expanded("greens", true),
      expectOutMessage([OutMessage.DropdownOpened()]),
      comboboxOpened()
    )
    step(
      init({ id: "t", data }),
      toggle,
      { data, value: ["missing"], searchable: true },
      expanded("veg", false),
      comboboxOpened()
    )
  })

  it("expands and collapses with the arrow keys", () => {
    const tree = opened(init({ id: "t", data, defaultExpandedValues: ["veg"] }), context)
    const onVeg = activate(tree, 1, context)
    unchanged(tree, press("ArrowRight"), context)
    unchanged(onVeg, press("ArrowRight"), context)
    step(onVeg, press("ArrowLeft"), context, expanded("veg", false))
    step(activate(onVeg, 2, context), press("ArrowRight"), context, expanded("greens", true))
  })

  it("moves to the parent with ArrowLeft", () => {
    const onVeg = activate(opened(init({ id: "t", data, defaultExpandedValues: ["veg"] }), context), 1, context)
    const onGreens = activate(onVeg, 2, context)
    step(
      onGreens,
      press("ArrowLeft"),
      context,
      model((current) => expect(current.combobox.maybeActiveItemIndex).toEqual(Option.some(1))),
      comboboxMoved()
    )
    unchanged(activate(onVeg, 0, context), press("ArrowLeft"), context)
    step(
      { ...onGreens, combobox: { ...onGreens.combobox, isOpen: false } },
      press("ArrowLeft"),
      context,
      expanded("veg", true)
    )
  })

  it("leaves a filtered node whose parent is not shown alone", () => {
    const searching = { ...context, value: [], searchable: true }
    const tree = opened(init({ id: "t", data, defaultExpandedValues: ["veg"] }), context)
    const filtered = activate(typed(tree, "kale"), 2, searching)
    unchanged(filtered, press("ArrowLeft"), { ...searching, data: data.slice(0, 1) })
  })

  it("clears", () => {
    unchanged(init({ id: "t", data }), Message.SyncedOptions(), context)
    step(
      typed(init({ id: "t", data }), "Kale"),
      Message.Cleared(),
      context,
      inputValue(""),
      expectOutMessage([changed(null, []), OutMessage.Cleared()])
    )
  })
})

describe("TreeSelect multiple mode", () => {
  const context = { data, value: ["apple"], mode: "multiple" as const }
  const open = () => typed(opened(init({ id: "t", data }), context), "a")

  it("toggles values and stays open", () => {
    step(
      open(),
      select("banana"),
      context,
      expectOutMessage([changed("apple", ["apple", "banana"])]),
      isOpen(true),
      inputValue("")
    )
    step(
      open(),
      select("apple"),
      { ...context, clearSearchOnChange: false },
      expectOutMessage([changed(null, []), OutMessage.Removed({ value: "apple" })]),
      inputValue("a")
    )
  })

  it("stops at maxValues and expands parents with expandOnClick", () => {
    step(open(), select("banana"), { ...context, maxValues: 1 }, expectNoOutMessage())
    step(open(), select("fruits"), { ...context, expandOnClick: true }, expanded("fruits", true))
  })

  it("removes a pill and ignores the click that follows", () =>
    story(
      treeSelect(context),
      given(init({ id: "t", data })),
      message(Message.RemovedPill({ value: "apple" })),
      expectOutMessage([changed(null, []), OutMessage.Removed({ value: "apple" })]),
      model((current) => expect(current.ignoreClick).toBe(true)),
      message(Message.ClickedBox()),
      model((current) => expect(current.ignoreClick).toBe(false)),
      isOpen(false),
      message(Message.ClickedBox()),
      isOpen(true),
      comboboxOpened()
    ))

  it("clears the last value with Backspace", () => {
    const fresh = init({ id: "t", data })
    step(
      fresh,
      press("Backspace"),
      { ...context, value: ["apple", "kale"] },
      expectOutMessage([changed("apple", ["apple"]), OutMessage.Removed({ value: "kale" })])
    )
    step(fresh, press("Backspace"), { ...context, value: [] }, expectNoOutMessage())
    step(typed(fresh, "x"), press("Backspace"), context, expectNoOutMessage())
    step(fresh, press("Backspace"), { data, value: ["apple"] }, expectNoOutMessage())
  })

  it("opens with Space, unless searchable or single", () => {
    const fresh = init({ id: "t", data })
    unchanged(fresh, press("Enter"), context)
    step(fresh, press(" "), context, isOpen(true), comboboxOpened())
    unchanged(fresh, press(" "), { ...context, searchable: true })
    unchanged(fresh, press(" "), { data, value: [] })
    const searching = { ...context, searchable: true }
    unchanged(opened(fresh, searching), Message.ClickedBox(), searching)
  })
})

describe("TreeSelect checkbox mode", () => {
  const context = { data, value: ["apple"], mode: "checkbox" as const }
  const open = () => opened(init({ id: "t", data }), context)

  it("checks parents with their children", () => {
    step(open(), select("fruits"), context, expectOutMessage([changed("apple", ["apple", "banana"])]))
    step(open(), select("fruits"), { ...context, value: ["fruits"] }, expectOutMessage([changed(null, [])]))
    step(
      open(),
      select("greens"),
      { ...context, checkedStrategy: "parent" },
      expectOutMessage([changed("apple", ["apple", "greens"])])
    )
    step(open(), select("greens"), { ...context, maxValues: 2 }, expectNoOutMessage())
    step(open(), select("apple"), { ...context, maxValues: 1 }, expectOutMessage([changed(null, [])]))
  })

  it("checks one node at a time with checkStrictly", () => {
    const strict = { ...context, checkStrictly: true }
    step(open(), select("fruits"), strict, expectOutMessage([changed("apple", ["apple", "fruits"])]))
    step(open(), select("apple"), strict, expectOutMessage([changed(null, [])]))
    step(
      open(),
      Message.RemovedPill({ value: "apple" }),
      strict,
      expectOutMessage([changed(null, []), OutMessage.Removed({ value: "apple" })])
    )
  })

  it("expands a checked parent with expandOnClick once", () => {
    const expanding = { ...context, expandOnClick: true }
    story(
      treeSelect(expanding),
      given(open()),
      message(select("veg")),
      expectOutMessage([
        changed("apple", ["apple", "kale", "spinach", "carrot"]),
        OutMessage.ExpandedChanged({ values: ["veg"] })
      ]),
      message(select("veg")),
      expanded("veg", true)
    )
    step(open(), select("apple"), expanding, expectOutMessage([changed(null, [])]))
  })

  it("removes a parent's pill with its children", () =>
    step(
      init({ id: "t", data }),
      Message.RemovedPill({ value: "greens" }),
      { ...context, value: ["kale", "spinach", "apple"] },
      expectOutMessage([changed("apple", ["apple"]), OutMessage.Removed({ value: "greens" })])
    ))
})
