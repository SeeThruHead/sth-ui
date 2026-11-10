import { describe, expect, it } from "@effect/vitest"
import { Option } from "effect"
import { controlState, hover, leave, pick, selectedValue, selection } from "./selection.ts"

const none = { selected: false, inRange: false, firstInRange: false, lastInRange: false }

describe("picker selection, as Mantine's useDatesState", () => {
  it("picks one date, deselecting it only when allowed", () => {
    const one = pick(selection("default"), "2024-05-09")
    expect(selectedValue(one)).toEqual(["2024-05-09"])
    expect(selectedValue(pick(one, "2024-05-10"))).toEqual(["2024-05-10"])
    expect(selectedValue(pick(one, "2024-05-09"))).toEqual(["2024-05-09"])
    expect(selectedValue(pick(one, "2024-05-09", { allowDeselect: true }))).toEqual([])
    expect(
      selectedValue(pick(selection("default", ["2024-05-01"]), "2024-05-20", { level: "month", allowDeselect: true }))
    ).toEqual([])
    expect(controlState(one, "2024-05-09")).toEqual({ ...none, selected: true })
    expect(controlState(one, "2024-05-08")).toEqual(none)
  })

  it("toggles dates in a multiple selection", () => {
    const two = pick(pick(selection("multiple"), "2024-05-09"), "2024-05-12")
    expect(selectedValue(two)).toEqual(["2024-05-09", "2024-05-12"])
    expect(selectedValue(pick(two, "2024-05-09"))).toEqual(["2024-05-12"])
    expect(selectedValue(pick(selection("multiple", ["2024-01-01"]), "2024-07-01", { level: "year" }))).toEqual([])
    expect(controlState(two, "2024-05-12").selected).toBe(true)
    expect(hover(two, "2024-05-20")).toBe(two)
  })

  it("picks a range in two clicks, sorted, previewing it while hovering", () => {
    const started = pick(selection("range"), "2024-05-20")
    expect(selectedValue(started)).toEqual(["2024-05-20"])
    const hovering = hover(started, "2024-05-15")
    expect(hovering.hovered).toEqual(Option.some("2024-05-15"))
    expect(controlState(hovering, "2024-05-17")).toEqual({ ...none, inRange: true })
    expect(controlState(hovering, "2024-05-20")).toEqual({
      selected: true,
      inRange: true,
      firstInRange: false,
      lastInRange: true
    })
    expect(controlState(hovering, "2024-05-14")).toEqual(none)
    const forward = hover(started, "2024-05-25")
    expect(controlState(forward, "2024-05-20")).toEqual({
      selected: true,
      inRange: true,
      firstInRange: true,
      lastInRange: false
    })
    expect(controlState(leave(forward), "2024-05-22").inRange).toBe(false)
    const done = pick(hovering, "2024-05-15")
    expect(selectedValue(done)).toEqual(["2024-05-15", "2024-05-20"])
    expect(done.hovered).toEqual(Option.none())
    expect(controlState(done, "2024-05-15")).toEqual({
      selected: true,
      inRange: true,
      firstInRange: true,
      lastInRange: false
    })
    expect(controlState(done, "2024-05-20")).toEqual({
      selected: true,
      inRange: true,
      firstInRange: false,
      lastInRange: true
    })
    expect(hover(done, "2024-05-30")).toBe(done)
    expect(selectedValue(pick(done, "2024-06-01"))).toEqual(["2024-06-01"])
    expect(controlState(selection("range"), "2024-05-15")).toEqual(none)
  })

  it("clears a range picked twice on the same date unless single-date ranges are allowed", () => {
    const started = pick(selection("range"), "2024-05-20")
    expect(selectedValue(pick(started, "2024-05-20"))).toEqual([])
    expect(selectedValue(pick(started, "2024-05-20", { allowSingleDateInRange: true }))).toEqual([
      "2024-05-20",
      "2024-05-20"
    ])
  })
})
