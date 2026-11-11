import { describe, expect, it } from "@effect/vitest"
import { inertHtml } from "foldkit/html"
import { icon } from "./Icon.ts"
import { HouseIcon } from "./icons/HouseIcon.ts"
import { Schema } from "effect"

const square = icon("square", {
  thin: [{ d: "M1" }],
  light: [{ d: "M2" }],
  regular: [{ d: "M3" }],
  bold: [{ d: "M4" }],
  fill: [{ d: "M5" }],
  duotone: [{ d: "M6", opacity: 0.2 }, { d: "M7" }]
})

const Attrs = Schema.Record(Schema.String, Schema.String)

const RenderedNode = Schema.Struct({
  sel: Schema.String,
  data: Schema.Struct({ attrs: Attrs }),
  children: Schema.Array(Schema.Struct({ data: Schema.Struct({ attrs: Attrs }) }))
})

const render = (node: unknown) =>
  Schema.decodeSync(Schema.fromJsonString(RenderedNode))(Schema.encodeSync(Schema.fromJsonString(Schema.Unknown))(node))

describe("icon", () => {
  it("draws the regular weight at 1em in the current colour, hidden from assistive technology", () => {
    const node = render(square(inertHtml))

    expect(node.sel).toBe("svg")
    expect(node.data.attrs).toMatchObject({
      viewBox: "0 0 256 256",
      width: "1em",
      height: "1em",
      fill: "currentColor",
      "aria-hidden": "true",
      "data-icon": "square"
    })
    expect(node.children.map((child) => child.data.attrs["d"])).toEqual(["M3"])
  })

  it("takes a size, a weight, a colour, a label and a mirror", () => {
    const node = render(
      square(inertHtml, { size: 24, weight: "duotone", color: "red", label: "Square", mirrored: true })
    )

    expect(node.data.attrs).toMatchObject({
      width: "24",
      height: "24",
      fill: "red",
      role: "img",
      "aria-label": "Square",
      transform: "scale(-1, 1)"
    })
    expect(node.data.attrs["aria-hidden"]).toBeUndefined()
    expect(node.children.map((child) => child.data.attrs)).toEqual([{ d: "M6", opacity: "0.2" }, { d: "M7" }])
  })

  it("takes a CSS length as its size", () => {
    expect(render(square(inertHtml, { size: "2rem" })).data.attrs["width"]).toBe("2rem")
  })

  it("ships Phosphor's house in every weight", () => {
    const weights = ["thin", "light", "regular", "bold", "fill", "duotone"] as const

    expect(weights.map((weight) => render(HouseIcon(inertHtml, { weight })).children.length)).toEqual([
      1, 1, 1, 1, 1, 2
    ])
  })
})
