import { describe, expect, it } from "@effect/vitest"
import * as Popover from "@foldkit/ui/popover"
import { Story } from "foldkit/test"
import { listingOutMessages } from "@sth-ui/testing/Story.ts"
import { popoverClosed, popoverOpened } from "../../testing/popover.ts"
import {
  columnsOf,
  defaultFilter,
  flattenPaths,
  gotPopover,
  hasChildren,
  init,
  isCascaderKey,
  labelOf,
  Message,
  OutMessage,
  pathOptions,
  update
} from "./model.ts"
import type { CascaderContext, CascaderOption, Model } from "./model.ts"

const data: ReadonlyArray<CascaderOption> = [
  {
    value: "asia",
    label: "Asia",
    children: [
      {
        value: "jp",
        label: "Japan",
        children: [
          { value: "tokyo", label: "Tokyo" },
          { value: "osaka", label: "Osaka" }
        ]
      }
    ]
  },
  {
    value: "europe",
    label: "Europe",
    children: [
      { value: "fr", label: "France", disabled: true, children: [{ value: "paris", label: "Paris" }] },
      { value: "de", label: "Germany", children: [{ value: "berlin", label: "Berlin" }] }
    ]
  },
  { value: "antarctica" },
  { value: "moon", children: [{ value: "base", disabled: true }] }
]

const context: CascaderContext = { data, value: null }

const opened = (value: ReadonlyArray<string> = []): Model => {
  const model = init({ id: "region", value })

  return { ...model, popover: Popover.open(model.popover).model }
}

const { expectNoOutMessage, expectOutMessage, given, message, model, story } = Story

type Step = Parameters<typeof story<Model, Message, ReadonlyArray<OutMessage>>>[1]

const cascader = (options: CascaderContext) =>
  listingOutMessages((current: Model, sent: Message) => update(current, sent, options))

const step = (from: Model, sent: Message, options: CascaderContext, ...steps: ReadonlyArray<Step>) =>
  story(cascader(options), given(from), message(sent), ...steps)

const active = (expected: ReadonlyArray<string>) => model<Model>((current) => expect(current.active).toEqual(expected))

const press = (from: Model, key: string, expected: ReadonlyArray<string>, options: CascaderContext = context) =>
  step(from, Message.PressedKey({ key }), options, active(expected))

const hovered = (value: string) => Message.HoveredOption({ level: 0, value })

const click = (value: string, level = 0) => Message.ClickedOption({ level, value })

const changedAndClosed = (value: ReadonlyArray<string> | null) =>
  [expectOutMessage([OutMessage.Changed({ value }), OutMessage.Closed()]), popoverClosed(1)] as const

describe("Cascader helpers, as Mantine's", () => {
  it("builds one column per highlighted option without expanding the deepest", () => {
    expect(columnsOf(data, []).map((column) => column.map((option) => option.value))).toEqual([
      ["asia", "europe", "antarctica", "moon"]
    ])
    expect(columnsOf(data, ["asia"])).toHaveLength(1)
    expect(columnsOf(data, ["asia", "jp"]).map((column) => column.map((option) => option.value))).toEqual([
      ["asia", "europe", "antarctica", "moon"],
      ["jp"]
    ])
    expect(columnsOf(data, ["antarctica", "x", "y"])).toHaveLength(1)
    expect(columnsOf(data, ["missing", "x"])).toHaveLength(1)
    expect(hasChildren({ value: "x" })).toBe(false)
    expect(hasChildren({ value: "x", children: [] })).toBe(false)
  })

  it("flattens every path with disabled ancestors", () => {
    const paths = flattenPaths(data)
    expect(paths.map((entry) => entry.path.join("/"))).toContain("europe/fr/paris")
    expect(paths.find((entry) => entry.path.join("/") === "europe/fr/paris")?.disabled).toBe(true)
    expect(paths.find((entry) => entry.path.join("/") === "asia")?.leaf).toBe(false)
    expect(paths).toHaveLength(12)
  })

  it("finds the options along a value", () => {
    expect(pathOptions(data, ["asia", "jp", "tokyo"]).map(labelOf)).toEqual(["Asia", "Japan", "Tokyo"])
    expect(pathOptions(data, ["asia", "missing", "tokyo"]).map(labelOf)).toEqual(["Asia"])
    expect(pathOptions(data, null)).toEqual([])
    expect(labelOf({ value: "plain" })).toBe("plain")
    expect(defaultFilter(" TOK ", pathOptions(data, ["asia", "jp", "tokyo"]))).toBe(true)
    expect(isCascaderKey("Enter")).toBe(true)
    expect(isCascaderKey("a")).toBe(false)
  })
})

describe("Cascader navigation, as Mantine's useCascader", () => {
  it("expands an option on click", () =>
    step(opened(), click("asia"), context, active(["asia", "jp"]), expectNoOutMessage()))

  it("selects a leaf on click, closing the dropdown", () =>
    step(opened(["asia", "jp", "tokyo"]), click("osaka", 2), context, ...changedAndClosed(["asia", "jp", "osaka"])))

  it("ignores a click on an unknown option", () => step(opened(), click("missing"), context, expectNoOutMessage()))

  it("selects a parent with changeOnSelect, expanding it and closing as Mantine does", () =>
    step(
      opened(),
      click("europe"),
      { ...context, changeOnSelect: true },
      active(["europe", "de"]),
      ...changedAndClosed(["europe"])
    ))

  it("stays open without closeOnSelect", () =>
    step(
      opened(),
      click("antarctica"),
      { ...context, closeOnSelect: false },
      model((current) => expect(current.popover.isOpen).toBe(true)),
      expectOutMessage([OutMessage.Changed({ value: ["antarctica"] })])
    ))

  it("deselects the chosen value unless told not to, and replaces another", () => {
    step(opened(), click("antarctica"), { ...context, value: ["antarctica"] }, ...changedAndClosed(null))
    step(
      opened(),
      click("antarctica"),
      { ...context, value: ["antarctica"], allowDeselect: false },
      ...changedAndClosed(["antarctica"])
    )
    step(opened(), click("antarctica"), { ...context, value: ["asia", "jp"] }, ...changedAndClosed(["antarctica"]))
  })

  it("expands on hover with the hover trigger only", () => {
    const hover = { ...context, expandTrigger: "hover" as const }
    step(opened(), hovered("asia"), context, active([]))
    step(opened(), hovered("asia"), hover, active(["asia", "jp"]))
    step(opened(), hovered("antarctica"), hover, active(["antarctica"]))
    step(opened(), hovered("missing"), hover, active([]))
  })

  it("moves with the arrow keys, skipping disabled options", () => {
    press(opened(), "ArrowDown", ["asia"])
    press(opened(["asia"]), "ArrowUp", ["asia"])
    press(opened(), "ArrowUp", ["moon"])
    press(opened(["asia"]), "ArrowRight", ["asia", "jp"])
    press(opened(["asia", "jp"]), "ArrowLeft", ["asia"])
    press(opened(["asia"]), "ArrowLeft", ["asia"])
    press(opened(["europe", "de"]), "ArrowUp", ["europe", "de"])
    press(opened(["antarctica"]), "ArrowRight", ["antarctica"])
    press(opened(["asia"]), "ArrowLeft", ["asia", "jp"], { ...context, dir: "rtl" })
    press(opened(["asia", "jp"]), "ArrowRight", ["asia"], { ...context, dir: "rtl" })
    press(opened(["asia"]), "Tab", ["asia"])
    press(opened(["moon"]), "ArrowRight", ["moon"])
    press(opened(["missing", "x", "y"]), "ArrowDown", ["missing", "x", "y"])
  })

  it("chooses with Enter", () => {
    step(opened(["antarctica"]), Message.PressedKey({ key: "Enter" }), context, ...changedAndClosed(["antarctica"]))
    step(opened(), Message.PressedKey({ key: "Enter" }), context, expectNoOutMessage())
  })

  it("searches, chooses a path and clears", () => {
    step(
      opened(),
      Message.Searched({ value: "tok" }),
      context,
      expectOutMessage([OutMessage.SearchChanged({ value: "tok" })])
    )
    step(
      opened(),
      Message.ChosePath({ path: ["asia", "jp", "tokyo"] }),
      context,
      ...changedAndClosed(["asia", "jp", "tokyo"])
    )
    step(opened(["asia"]), Message.Cleared(), context, expectOutMessage([OutMessage.Changed({ value: null })]))
  })

  it("highlights the value when it opens and clears the search when it closes", () =>
    story(
      cascader({ ...context, value: ["europe", "de"] }),
      given(init({ id: "region" })),
      message(gotPopover(Popover.Message.ClickedButton())),
      active(["europe", "de"]),
      expectOutMessage([OutMessage.Opened()]),
      popoverOpened(),
      message(Message.Searched({ value: "x" })),
      message(gotPopover(Popover.Message.ClickedButton())),
      model((current) => expect(current.search).toBe("")),
      popoverClosed()
    ))

  it("opens with nothing highlighted without a value, and ignores what changes nothing", () => {
    expect(init({ id: "x" }).active).toEqual([])
    step(init({ id: "region" }), gotPopover(Popover.Message.ClickedButton()), context, active([]), popoverOpened())
    step(init({ id: "region" }), gotPopover(Popover.Message.CompletedFocusButton()), context, expectNoOutMessage())
  })
})
