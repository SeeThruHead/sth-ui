import { describe, expect, it } from "@effect/vitest"
import { sankeyLayout } from "./sankey.ts"

const options = { height: 290, nodePadding: 10, iterations: 32 }

const round = (value: number) => Math.round(value * 1000) / 1000

const energy = {
  nodes: [
    { name: "Coal" },
    { name: "Gas" },
    { name: "Solar", color: "yellow" },
    { name: "Grid" },
    { name: "Homes" },
    { name: "Industry" },
    { name: "Loss" }
  ],
  links: [
    { source: 0, target: 3, value: 40 },
    { source: 1, target: 3, value: 30 },
    { source: 2, target: 4, value: 10 },
    { source: 3, target: 4, value: 35 },
    { source: 3, target: 5, value: 25 },
    { source: 3, target: 6, value: 10 },
    { source: 2, target: 5, value: 5 }
  ]
}

describe("Sankey layout, as recharts' computeData", () => {
  it("places nodes as recharts 3.10 does", () => {
    const layout = sankeyLayout(energy, options)
    expect(layout.maxDepth).toBe(2)
    expect(layout.nodes.map((node) => node.share)).toEqual([0, 0, 0, 0.5, 1, 1, 1])
    expect(layout.nodes.map((node) => [node.depth, round(node.y), round(node.dy)])).toEqual([
      [0, 0, 127.059],
      [0, 194.706, 95.294],
      [0, 137.059, 47.647],
      [1, 30.362, 222.353],
      [2, 0, 142.941],
      [2, 152.941, 95.294],
      [2, 258.235, 31.765]
    ])
    expect(layout.nodes.map((node) => node.isLeaf)).toEqual([false, false, false, false, true, true, true])
    expect(layout.nodes[2]).toMatchObject({ name: "Solar", color: "yellow", value: 15 })
  })

  it("stacks links on their nodes as recharts 3.10 does", () => {
    expect(sankeyLayout(energy, options).links.map((link) => [round(link.sy), round(link.ty), round(link.dy)])).toEqual(
      [
        [0, 0, 127.059],
        [0, 127.059, 95.294],
        [0, 111.176, 31.765],
        [0, 0, 111.176],
        [111.176, 0, 79.412],
        [190.588, 0, 31.765],
        [31.765, 79.412, 15.882]
      ]
    )
  })

  it("survives cycles, empty data and zero values", () => {
    const cycle = sankeyLayout(
      {
        nodes: [{ name: "A" }, { name: "B" }],
        links: [
          { source: 0, target: 1, value: 1 },
          { source: 1, target: 0, value: 1 }
        ]
      },
      options
    )
    expect(cycle.nodes.map((node) => node.depth)).toEqual([0, 0])
    expect(cycle.nodes.map((node) => node.share)).toEqual([0, 0])
    const loop = sankeyLayout(
      {
        nodes: [{ name: "R" }, { name: "A" }, { name: "B" }],
        links: [
          { source: 0, target: 1, value: 2 },
          { source: 1, target: 2, value: 1 },
          { source: 2, target: 1, value: 1 }
        ]
      },
      options
    )
    expect(loop.nodes.map((node) => node.depth)).toEqual([0, 1, 2])
    expect(sankeyLayout({ nodes: [], links: [] }, options)).toEqual({ nodes: [], links: [], maxDepth: 0 })
    const zero = sankeyLayout(
      { nodes: [{ name: "A" }, { name: "B" }], links: [{ source: 0, target: 1, value: 0 }] },
      options
    )
    expect(zero.nodes.map((node) => node.dy)).toEqual([0, 0])
  })
})
