import { describe, expect, it } from "@effect/vitest"
import { treemapNodes, valueOf } from "./squarify.ts"

describe("Treemap layout, as recharts' squarify", () => {
  it("sums children into their parent", () => {
    expect(
      valueOf({
        name: "a",
        children: [
          { name: "b", value: 2 },
          { name: "c", value: 3 }
        ]
      })
    ).toBe(5)
    expect(valueOf({ name: "a", value: -3 })).toBe(0)
    expect(valueOf({ name: "a" })).toBe(0)
  })

  it("tiles the whole area without gaps", () => {
    const nodes = treemapNodes(
      [
        { name: "A", value: 6 },
        { name: "B", value: 6 },
        { name: "C", value: 4 },
        { name: "D", value: 3 },
        { name: "E", value: 2 },
        { name: "F", value: 2 },
        { name: "G", value: 1 }
      ],
      600,
      400
    )
    expect(nodes).toHaveLength(7)
    expect(nodes.reduce((sum, node) => sum + node.width * node.height, 0)).toBe(240_000)
    expect(nodes[0]).toMatchObject({ x: 0, y: 0, width: 300, height: 200 })
    expect(Math.max(...nodes.map((node) => node.x + node.width))).toBe(600)
  })

  it("nests children inside their parent and passes colours down", () => {
    const nodes = treemapNodes(
      [
        {
          name: "Fruit",
          color: "red",
          children: [
            { name: "Apple", value: 3 },
            { name: "Pear", value: 1, color: "green" }
          ]
        },
        { name: "Nuts", value: 4 }
      ],
      200,
      100
    )
    const fruit = nodes.find((node) => node.name === "Fruit")
    const apple = nodes.find((node) => node.name === "Apple")
    expect(fruit?.depth).toBe(1)
    expect(apple?.depth).toBe(2)
    expect(apple?.color).toBe("red")
    expect(nodes.find((node) => node.name === "Pear")?.color).toBe("green")
    expect((apple?.x ?? -1) >= (fruit?.x ?? 0)).toBe(true)
    expect(treemapNodes([{ name: "zero", value: 0 }], 100, 100)[0]).toMatchObject({ width: 100, height: 100 })
    expect(
      treemapNodes(
        [
          { name: "a", value: 1 },
          { name: "b", value: 1 }
        ],
        0,
        50
      ).map((node) => node.width)
    ).toEqual([0, 0])
    expect(treemapNodes([{ name: "a", value: 1 }], 0, 0)[0]).toMatchObject({ width: 0, height: 0 })
  })
})
