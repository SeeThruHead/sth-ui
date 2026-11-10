import { describe, expect, it } from "@effect/vitest"
import { gotTransition, Message } from "./model.ts"

describe("modal state", () => {
  it("wraps transition messages", () => {
    const message = { _tag: "EndedAnimation" as const, generation: 1 }
    expect(gotTransition(message)).toEqual(Message.GotTransition({ message }))
  })
})
