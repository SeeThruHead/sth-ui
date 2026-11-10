import { describe, expect, it } from "@effect/vitest"
import { Story } from "foldkit/test"
import { listingOutMessages } from "@sth-ui/testing/Story.ts"
import { init, Message, OutMessage, update } from "./model.ts"

const { expectNoOutMessage, expectOutMessage, given, message, model, story } = Story

const maskInput = listingOutMessages(update)

describe("MaskInput model", () => {
  it("keeps the values and reports the changes the mask asked to report", () =>
    story(
      maskInput,
      given(init({ id: "phone" })),
      message(Message.Changed({ raw: "1", masked: "(1", complete: false, notify: false })),
      model((current) => expect(current.masked).toBe("(1")),
      expectNoOutMessage(),
      message(Message.Changed({ raw: "12", masked: "(12", complete: false, notify: true })),
      expectOutMessage([OutMessage.ChangedRaw({ raw: "12", masked: "(12" })])
    ))

  it("reports completion", () =>
    story(
      maskInput,
      given(init({ id: "phone" })),
      message(Message.Completed({ raw: "1", masked: "1" })),
      expectOutMessage([OutMessage.Completed({ raw: "1", masked: "1" })])
    ))

  it("resets with a new generation", () =>
    story(
      maskInput,
      given({ ...init({ id: "phone" }), raw: "1", masked: "1" }),
      message(Message.Reset()),
      model((current) => expect(current).toEqual({ ...init({ id: "phone" }), generation: 1 })),
      expectOutMessage([OutMessage.ChangedRaw({ raw: "", masked: "" })])
    ))
})
