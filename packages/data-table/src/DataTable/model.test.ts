import * as Popover from "@foldkit/ui/popover"
import { describe, expect, it } from "@effect/vitest"
import { Effect } from "effect"
import { vi } from "vitest"
import {
  columnsMenuMessage,
  filterMenuId,
  filterMenuMessage,
  init,
  Message,
  OutMessage,
  refresh,
  rowElementId,
  rowHeightOf,
  scrollId,
  settingsOf,
  update
} from "./model.ts"
import type { DataTableContext, Model } from "./model.ts"

type Game = { readonly id: string; readonly title: string; readonly rating: number }

const games: ReadonlyArray<Game> = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot"].map((title, index) => ({
  id: title.toLowerCase(),
  title,
  rating: index
}))

const context: DataTableContext<Game> = {
  rows: games,
  columns: [
    { id: "title", value: (game) => game.title, sortable: true, filter: { _tag: "Text" } },
    { id: "rating", value: (game) => game.rating, sortable: true }
  ],
  rowId: (game) => game.id,
  searchText: (game) => game.title
}

const start = init({ id: "games" }, context)

const step = (model: Model, message: Message) => update(model, message, context)

const after = (model: Model, ...messages: ReadonlyArray<Message>): Model =>
  messages.reduce((current, message) => step(current, message).model, model)

const measured = after(start, Message.Measured({ viewportHeight: 108, coarse: false }))

describe("data table model", () => {
  it("starts from its config and names its elements", () => {
    expect(start.order).toEqual(["alpha", "bravo", "charlie", "delta", "echo", "foxtrot"])
    expect(start.rowHeightPx).toBe(36)
    expect(Object.keys(start.filterMenus)).toEqual(["title"])
    const configured = init(
      {
        id: "x",
        rowHeightPx: 30,
        coarseRowHeightPx: 50,
        viewportHeight: 300,
        sort: { column: "rating", direction: "desc" },
        hidden: ["rating"],
        selected: ["alpha"]
      },
      context
    )
    expect(configured.order[0]).toBe("foxtrot")
    expect(settingsOf(configured)).toEqual({ sort: { column: "rating", direction: "desc" }, hidden: ["rating"] })
    expect(configured.selected).toEqual(["alpha"])
    expect(rowHeightOf(configured)).toBe(30)
    expect(rowHeightOf({ ...configured, coarse: true })).toBe(50)
    expect(scrollId("x")).toBe("x-scroll")
    expect(rowElementId("x", "a")).toBe("x-row-a")
    expect(filterMenuId("x", "title")).toBe("x-filter-title")
  })

  it("sorts, searches and filters, scrolling back to the top", () => {
    const sorted = step({ ...start, scrollTop: 200 }, Message.ClickedSort({ column: "rating" }))
    expect(sorted.model.sort).toEqual({ column: "rating", direction: "asc" })
    expect(sorted.model.scrollTop).toBe(0)
    expect(sorted.commands).toHaveLength(1)
    expect(sorted.outMessages).toEqual([
      OutMessage.SettingsChanged({ settings: { sort: { column: "rating", direction: "asc" }, hidden: [] } })
    ])
    expect(after(start, Message.ChangedSearch({ search: "ech" })).order).toEqual(["echo"])
    const filtered = after(start, Message.ChangedFilter({ column: "title", filter: { _tag: "Text", query: "o" } }))
    expect(filtered.order).toEqual(["bravo", "echo", "foxtrot"])
    expect(after(filtered, Message.ClearedFilter({ column: "title" })).filters).toEqual({})
    expect(after(filtered, Message.ClearedFilters()).order).toHaveLength(6)
    expect(
      after(filtered, Message.ChangedFilter({ column: "title", filter: { _tag: "Text", query: "" } })).filters
    ).toEqual({})
  })

  it("refreshes its order when the rows change", () => {
    const fewer = refresh(start, { ...context, rows: games.slice(0, 2) })
    expect(fewer.order).toEqual(["alpha", "bravo"])
  })

  it("hides and shows columns", () => {
    const hidden = step(start, Message.ToggledColumn({ column: "rating", visible: false }))
    expect(hidden.model.hidden).toEqual(["rating"])
    expect(hidden.outMessages).toEqual([OutMessage.SettingsChanged({ settings: { sort: null, hidden: ["rating"] } })])
    expect(after(hidden.model, Message.ToggledColumn({ column: "rating", visible: true })).hidden).toEqual([])
  })

  it("selects rows, ranges with shift, and everything matching", () => {
    const one = step(start, Message.ToggledRow({ id: "bravo", checked: true }))
    expect(one.model.selected).toEqual(["bravo"])
    expect(one.outMessages).toEqual([OutMessage.SelectionChanged({ selected: ["bravo"] })])
    const range = after(
      one.model,
      Message.ChangedShift({ shift: true }),
      Message.ToggledRow({ id: "delta", checked: true })
    )
    expect(range.selected).toEqual(["bravo", "charlie", "delta"])
    const shrunk = after(range, Message.ToggledRow({ id: "charlie", checked: false }))
    expect(shrunk.selected).toEqual(["bravo"])
    const missing = after({ ...range, anchor: "gone" }, Message.ToggledRow({ id: "echo", checked: true }))
    expect(missing.selected).toEqual(["bravo", "charlie", "delta", "echo"])
    const filtered = after(start, Message.ChangedSearch({ search: "a" }), Message.ToggledAll({ checked: true }))
    expect(filtered.selected).toEqual(["alpha", "bravo", "charlie", "delta"])
    expect(after(filtered, Message.ToggledAll({ checked: false })).selected).toEqual([])
    expect(after(one.model, Message.SelectedAll()).selected).toHaveLength(6)
    expect(after(one.model, Message.ClearedSelection()).selected).toEqual([])
  })

  it("activates a clicked row", () => {
    const clicked = step(start, Message.ClickedRow({ id: "charlie" }))
    expect(clicked.model.active).toBe("charlie")
    expect(clicked.outMessages).toEqual([OutMessage.RowActivated({ id: "charlie" })])
  })

  it("moves through rows with the keyboard, scrolling them into view", () => {
    const focused = after(measured, Message.FocusedRows())
    expect(focused.active).toBe("alpha")
    expect(focused.focused).toBe(true)
    expect(after(focused, Message.BlurredRows()).focused).toBe(false)
    expect(after({ ...focused, active: "echo" }, Message.FocusedRows()).active).toBe("echo")
    expect(after(focused, Message.ClickedCheckboxCell())).toEqual(focused)
    expect(after({ ...measured, order: [] }, Message.FocusedRows()).active).toBeNull()
    const down = step(focused, Message.PressedKey({ key: "ArrowDown", shift: false }))
    expect(down.model.active).toBe("bravo")
    expect(down.commands).toEqual([])
    const further = step(down.model, Message.PressedKey({ key: "ArrowDown", shift: false }))
    expect(further.model.active).toBe("charlie")
    expect(further.model.scrollTop).toBe(36)
    expect(further.commands).toHaveLength(1)
    const end = after(further.model, Message.PressedKey({ key: "End", shift: false }))
    expect(end.active).toBe("foxtrot")
    expect(end.scrollTop).toBe(144)
    const home = after(end, Message.PressedKey({ key: "Home", shift: false }))
    expect(home.active).toBe("alpha")
    expect(home.scrollTop).toBe(0)
    expect(after(home, Message.PressedKey({ key: "ArrowUp", shift: false })).active).toBe("alpha")
    expect(after(home, Message.PressedKey({ key: "PageDown", shift: false })).active).toBe("charlie")
    expect(after(end, Message.PressedKey({ key: "PageUp", shift: false })).active).toBe("delta")
    expect(after(measured, Message.PressedKey({ key: "ArrowDown", shift: false })).active).toBe("alpha")
    expect(after({ ...measured, order: [] }, Message.PressedKey({ key: "ArrowDown", shift: false })).active).toBeNull()
  })

  it("extends the selection with shift and the arrow keys", () => {
    const focused = after(measured, Message.FocusedRows())
    const extended = step(focused, Message.PressedKey({ key: "ArrowDown", shift: true }))
    expect(extended.model.selected).toEqual(["alpha", "bravo"])
    expect(extended.model.anchor).toBe("alpha")
    expect(extended.outMessages).toEqual([OutMessage.SelectionChanged({ selected: ["alpha", "bravo"] })])
    const more = after(extended.model, Message.PressedKey({ key: "ArrowDown", shift: true }))
    expect(more.selected).toEqual(["alpha", "bravo", "charlie"])
    expect(more.anchor).toBe("alpha")
  })

  it("activates and toggles the active row with Enter and Space", () => {
    expect(step(measured, Message.PressedKey({ key: "Enter", shift: false })).outMessages).toEqual([])
    const focused = after(measured, Message.FocusedRows())
    expect(step(focused, Message.PressedKey({ key: "Enter", shift: false })).outMessages).toEqual([
      OutMessage.RowActivated({ id: "alpha" })
    ])
    const spaced = after({ ...focused, shift: true, anchor: "delta" }, Message.PressedKey({ key: " ", shift: false }))
    expect(spaced.selected).toEqual(["alpha"])
    expect(after(spaced, Message.PressedKey({ key: " ", shift: false })).selected).toEqual([])
    expect(step(focused, Message.PressedKey({ key: "x", shift: false })).model).toEqual(focused)
  })

  it("records scrolling and measurements", () => {
    expect(after(start, Message.Scrolled({ scrollTop: 72 })).scrollTop).toBe(72)
    const coarse = after(start, Message.Measured({ viewportHeight: 400, coarse: true }))
    expect([coarse.viewportHeight, rowHeightOf(coarse)]).toEqual([400, 44])
    expect(after(start, Message.CompletedScroll())).toEqual(start)
  })

  it("opens and closes its menus", () => {
    const opened = step(start, Message.GotFilterMenu({ column: "title", message: Popover.Message.RequestedOpen() }))
    expect(opened.model.filterMenus["title"]?.isOpen).toBe(true)
    expect(
      step(start, Message.GotFilterMenu({ column: "rating", message: Popover.Message.RequestedClose() })).model
    ).toEqual(start)
    const columns = step(start, Message.GotColumnsMenu({ message: Popover.Message.RequestedOpen() }))
    expect(columns.model.columnsMenu.isOpen).toBe(true)
    expect(step(start, Message.GotColumnsMenu({ message: Popover.Message.IgnoredMouseClick() })).commands).toEqual([])
  })

  it("lifts its menus' messages", () => {
    expect(filterMenuMessage("title")(Popover.Message.RequestedClose())).toEqual(
      Message.GotFilterMenu({ column: "title", message: Popover.Message.RequestedClose() })
    )
    expect(columnsMenuMessage(Popover.Message.RequestedClose())).toEqual(
      Message.GotColumnsMenu({ message: Popover.Message.RequestedClose() })
    )
  })

  it.effect("scrolls its container and reports back", () =>
    Effect.gen(function* () {
      const scrollTo = vi.fn()
      vi.stubGlobal("document", { getElementById: () => ({ scrollTo }) })
      const [command] = step({ ...start, scrollTop: 50 }, Message.ChangedSearch({ search: "" })).commands
      const message = yield* command?.effect ?? Effect.succeed(null)
      vi.unstubAllGlobals()
      expect(message).toEqual(Message.CompletedScroll())
      expect(scrollTo).toHaveBeenCalledWith({ top: 0 })
    })
  )
})
