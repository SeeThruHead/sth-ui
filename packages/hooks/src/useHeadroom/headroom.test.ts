import { describe, expect, it } from "@effect/vitest"
import { Option, Schema } from "effect"
import { readJson, readStored, storageChangeEvent } from "../useLocalStorage/storage.ts"
import { headroom, headroomPinned, headroomStep, scrollDirectionOf } from "./headroom.ts"

const options = { fixedAt: 0, scrollDistance: 100 }

const run = (positions: ReadonlyArray<number>) =>
  positions.reduce<{ readonly state: typeof headroom; readonly events: ReadonlyArray<string> }>(
    ({ state, events }, y) => {
      const [next, more] = headroomStep(state, y, options)

      return { state: next, events: [...events, ...more] }
    },
    { state: headroom, events: [] }
  )

const area = (stored: Readonly<Record<string, string>>) => ({
  getItem: (key: string) => stored[key] ?? null,
  setItem: () => undefined,
  removeItem: () => undefined
})

const decode = Schema.decodeUnknownOption(Schema.Struct({ theme: Schema.String }))

describe("headroom, as Mantine's useHeadroom", () => {
  it("is pinned and fixed at the top and slides away scrolling down", () => {
    const top = run([0])
    expect(top.state).toMatchObject({ held: true, scrollProgress: 1 })
    expect(top.events).toEqual(["pin", "fix"])
    expect(run([0, 50]).state.scrollProgress).toBe(0.5)
    expect(headroomPinned(run([0, 50]).state)).toBe(true)
    const away = run([0, 50, 150])
    expect(away.state).toMatchObject({ scrollProgress: 0, held: false })
    expect(away.events).toEqual(["pin", "fix", "release"])
    expect(headroomPinned(away.state)).toBe(false)
  })

  it("comes back scrolling up, measured from where the direction last changed, as Mantine does", () => {
    expect(run([0, 50, 150, 120]).state).toMatchObject({ scrollProgress: 0, held: true })
    expect(run([0, 50, 150, 120, 120]).state.up).toBe(true)
    expect(run([0, 50, 150, 120, 40]).state.scrollProgress).toBeCloseTo(0.8)
    expect(run([0, 150, 120, 140]).state.scrollProgress).toBeCloseTo(0.2)
    expect(run([0, 300, 0]).events).toEqual(["pin", "fix", "release", "pin", "fix"])
  })

  it("names the scroll direction", () => {
    expect(scrollDirectionOf(10, 5)).toBe("up")
    expect(scrollDirectionOf(5, 10)).toBe("down")
  })
})

describe("storage, as Mantine's useLocalStorage", () => {
  it("reads JSON, falls back to the raw text, and to the default", () => {
    expect(readJson('{"a":1}')).toEqual({ a: 1 })
    expect(readJson("plain")).toBe("plain")
    expect(readJson("")).toBe("")
    expect(readStored(area({ prefs: '{"theme":"dark"}' }), "prefs", decode, { theme: "light" })).toEqual({
      theme: "dark"
    })
    expect(readStored(area({ prefs: "nonsense" }), "prefs", decode, { theme: "light" })).toEqual({ theme: "light" })
    expect(readStored(area({}), "prefs", decode, { theme: "light" })).toEqual({ theme: "light" })
    expect(storageChangeEvent("localStorage")).toBe("sth-local-storage")
    expect(storageChangeEvent("sessionStorage")).toBe("sth-session-storage")
    expect(Option.isNone(decode(null))).toBe(true)
  })
})
