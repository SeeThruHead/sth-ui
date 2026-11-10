import { describe, expect, it } from "@effect/vitest"
import { collapseInnerStyle, collapseStyle } from "./collapse.ts"

describe("collapse styles, for Mantine's useCollapse", () => {
  it("animates the grid track between 0fr and 1fr", () => {
    expect(collapseStyle({ expanded: true })).toEqual({
      display: "grid",
      gridTemplateRows: "1fr",
      transitionProperty: "grid-template-rows, opacity",
      transitionDuration: "200ms",
      transitionTimingFunction: "ease",
      opacity: "1"
    })
    expect(
      collapseStyle({
        expanded: false,
        orientation: "horizontal",
        transitionDuration: 500,
        transitionTimingFunction: "linear"
      })
    ).toEqual({
      display: "grid",
      gridTemplateColumns: "0fr",
      transitionProperty: "grid-template-columns, opacity",
      transitionDuration: "500ms",
      transitionTimingFunction: "linear",
      opacity: "0"
    })
    expect(collapseInnerStyle["overflow"]).toBe("hidden")
  })
})
