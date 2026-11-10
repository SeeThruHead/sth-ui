import { describe, expect, it } from "vitest"
import { listingOutMessages, modelAfter } from "./Story.ts"

const count = (model: number, message: number) => ({
  model: model + message,
  outMessages: message > 1 ? [message] : []
})

const withCommands = (model: number, message: number) => ({
  model: model + message,
  commands: ["wait"],
  outMessages: []
})

describe("Story helpers", () => {
  it("runs messages through update to build a given model", () => {
    expect(modelAfter(count, 0, [1, 2, 3])).toBe(6)
  })

  it("reads a list of out messages as one out message, and none as none", () => {
    expect(listingOutMessages(count)(0, 2)).toEqual({ model: 2, outMessage: [2] })
    expect(listingOutMessages(count)(0, 1)).toEqual({ model: 1 })
    expect(listingOutMessages(withCommands)(0, 1)).toEqual({ model: 1, commands: ["wait"] })
  })
})
