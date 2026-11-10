import { describe, expect, it } from "@effect/vitest"
import {
  defaultFilter,
  flatActions,
  keywordsOf,
  limitActions,
  orderedActions,
  shownActions,
  toGroups
} from "./filter.ts"

const home = { id: "home", label: "Home", description: "Get to home page" }
const docs = { id: "docs", label: "Documentation", description: "Read the docs", keywords: ["guide", " Manual "] }
const settings = { id: "settings", label: "Settings", description: "Change home preferences", group: "App" }
const profile = { id: "profile", label: "Profile", keywords: "Account" }
const actions = [
  home,
  docs,
  { group: "App", actions: [{ id: "settings", label: "Settings", description: "Change home preferences" }] },
  profile
]

describe("spotlight filter, as Mantine's default filter and limitActions", () => {
  it("joins keywords", () => {
    expect(keywordsOf(undefined)).toBe("")
    expect(keywordsOf(" Account ")).toBe("account")
    expect(keywordsOf(["guide", " Manual "])).toBe("guide,manual")
  })

  it("flattens groups onto their actions and back", () => {
    expect(flatActions(actions)).toEqual([home, docs, settings, profile])
    expect(toGroups(flatActions(actions))).toEqual([home, docs, { group: "App", actions: [settings] }, profile])
    expect(toGroups([settings, home, { ...profile, group: "App" }])).toEqual([
      { group: "App", actions: [settings, { ...profile, group: "App" }] },
      home
    ])
  })

  it("puts label matches before description and keyword matches", () => {
    expect(orderedActions(defaultFilter(" HOME ", actions)).map((action) => action.id)).toEqual(["home", "settings"])
    expect(orderedActions(defaultFilter("manual", actions)).map((action) => action.id)).toEqual(["docs"])
    expect(orderedActions(defaultFilter("account", actions)).map((action) => action.id)).toEqual(["profile"])
    expect(defaultFilter("nothing", actions)).toEqual([])
    expect(orderedActions(defaultFilter("", actions))).toHaveLength(4)
  })

  it("limits actions across groups", () => {
    expect(orderedActions(limitActions(actions, 3)).map((action) => action.id)).toEqual(["home", "docs", "settings"])
    expect(limitActions(actions, 2)).toEqual([home, docs])
    expect(orderedActions(limitActions([{ group: "G", actions: [home, docs] }, profile], 1))).toEqual([home])
  })

  it("shows filtered and limited actions, with or without a filter", () => {
    expect(orderedActions(shownActions("", { actions, limit: 2 })).map((action) => action.id)).toEqual(["home", "docs"])
    expect(shownActions("x", { actions, filter: (_query, items) => items.slice(0, 1) })).toEqual([home])
    expect(shownActions("", {})).toEqual([])
  })
})
