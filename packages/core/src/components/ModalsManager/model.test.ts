import { describe, expect, it } from "@effect/vitest"
import * as Animation from "@foldkit/ui/animation"
import { Option } from "effect"
import { Story } from "foldkit/test"
import { listingOutMessages, modelAfter } from "@sth-ui/testing/Story.ts"
import { transitioned } from "../../testing/transition.ts"
import {
  closeAllModals,
  gotModal,
  closeModal,
  current,
  init,
  Message,
  openConfirmModal,
  openContextModal,
  openModal,
  OutMessage,
  update,
  updateModal
} from "./model.ts"
import type { Model } from "./model.ts"

const { expectNoOutMessage, expectOutMessage, given, message, model, story } = Story

const empty = init({ id: "modals" })

const modals = listingOutMessages(update)

const after = (messages: ReadonlyArray<Message>) => modelAfter(update, empty, messages)

const lastEntry = (expected: object) => model<Model>((state) => expect(state.entries.at(-1)).toMatchObject(expected))

const unchanged = (from: Model, sent: Message) =>
  story(
    modals,
    given(from),
    message(sent),
    model((state) => expect(state).toEqual(from)),
    expectNoOutMessage()
  )

const opens = (sent: Message, expected: object) =>
  story(modals, given(empty), message(sent), lastEntry(expected), transitioned(1))

const twoOpen = after([openModal("a", { modalId: "a" }), openConfirmModal({ modalId: "c" })])

const confirms = after([
  openConfirmModal({ modalId: "c" }),
  openConfirmModal({ modalId: "k", confirm: { closeOnConfirm: false, closeOnCancel: false } })
])

describe("modals manager state, as Mantine's modals reducer", () => {
  it("opens a modal with a counted id", () =>
    story(
      modals,
      given(empty),
      message(openModal("terms", { settings: { title: "Terms" } })),
      expectOutMessage([OutMessage.ModalOpened({ modalId: "modals-0" })]),
      lastEntry({ id: "modals-0", kind: "content", key: "terms", settings: { title: "Terms" } }),
      model((state) => expect(state.entries[0]?.modal.id).toBe("modals-0")),
      transitioned(1)
    ))

  it("opens a context modal with its own id on top, and ignores a repeated id", () => {
    const withContext = after([
      openModal("terms"),
      openContextModal("demo", { modalId: "ctx", innerProps: { step: 1 } })
    ])
    expect(Option.map(current(withContext), (entry) => entry.id)).toEqual(Option.some("ctx"))
    unchanged(withContext, openContextModal("demo", { modalId: "ctx" }))
    story(
      modals,
      given(withContext),
      message(openConfirmModal({ confirm: { body: "Sure?" } })),
      lastEntry({ id: "modals-2", kind: "confirm", confirm: { body: "Sure?" } }),
      transitioned(1)
    )
  })

  it("fills in what each kind of modal leaves out", () => {
    opens(openConfirmModal({ modalId: "c", key: "body", settings: { centered: true } }), { key: "body" })
    opens(openModal("plain"), { id: "modals-0", settings: {} })
    opens(openConfirmModal(), { kind: "confirm", key: "" })
    opens(openContextModal("demo"), { kind: "context", innerProps: {} })
    expect(current(empty)).toEqual(Option.none())
  })

  it("closes every modal", () =>
    story(
      modals,
      given(after([openModal("plain")])),
      message(closeAllModals()),
      expectOutMessage([OutMessage.ModalClosed({ modalId: "modals-0" })]),
      transitioned(2)
    ))

  it("closes a modal", () =>
    story(
      modals,
      given(twoOpen),
      message(closeModal("a")),
      expectOutMessage([OutMessage.ModalClosed({ modalId: "a" })]),
      transitioned(2)
    ))

  it("reports a cancelled confirm when closing it", () =>
    story(
      modals,
      given(twoOpen),
      message(closeModal("c", true)),
      expectOutMessage([OutMessage.ModalCancelled({ modalId: "c" }), OutMessage.ModalClosed({ modalId: "c" })]),
      transitioned(2)
    ))

  it("cancels the confirm and closes every modal, newest first", () =>
    story(
      modals,
      given(twoOpen),
      message(closeAllModals(true)),
      expectOutMessage([
        OutMessage.ModalCancelled({ modalId: "c" }),
        OutMessage.ModalClosed({ modalId: "c" }),
        OutMessage.ModalClosed({ modalId: "a" })
      ]),
      Story.Command.resolveAll(
        [Animation.WaitForPaint, Animation.Message.CompletedWaitForPaint({ generation: 2 })],
        [Animation.WaitForPaint, Animation.Message.CompletedWaitForPaint({ generation: 2 })],
        [Animation.WaitForAnimationSettled, Animation.Message.EndedAnimation({ generation: 2 })],
        [Animation.WaitForAnimationSettled, Animation.Message.EndedAnimation({ generation: 2 })]
      )
    ))

  it("ignores closing a modal that is not open", () => unchanged(twoOpen, closeModal("missing")))

  it("answers a confirm modal and closes it", () => {
    story(
      modals,
      given(confirms),
      message(Message.Confirmed({ modalId: "c" })),
      expectOutMessage([OutMessage.ModalConfirmed({ modalId: "c" }), OutMessage.ModalClosed({ modalId: "c" })]),
      transitioned(2)
    )
    story(
      modals,
      given(confirms),
      message(Message.Cancelled({ modalId: "c" })),
      expectOutMessage([OutMessage.ModalCancelled({ modalId: "c" }), OutMessage.ModalClosed({ modalId: "c" })]),
      transitioned(2)
    )
  })

  it("answers a confirm modal and keeps it open when told to", () => {
    story(
      modals,
      given(confirms),
      message(Message.Confirmed({ modalId: "k" })),
      expectOutMessage([OutMessage.ModalConfirmed({ modalId: "k" })])
    )
    story(
      modals,
      given(confirms),
      message(Message.Cancelled({ modalId: "k" })),
      expectOutMessage([OutMessage.ModalCancelled({ modalId: "k" })])
    )
    unchanged(confirms, Message.Confirmed({ modalId: "missing" }))
  })

  it("updates a modal's settings and inner props", () => {
    const withContext = after([
      openContextModal("demo", { modalId: "x", innerProps: { step: 1, name: "a" }, settings: { title: "One" } })
    ])
    story(
      modals,
      given(withContext),
      message(updateModal("x", { settings: { title: "Two" }, innerProps: { step: 2 } })),
      lastEntry({ settings: { title: "Two" }, innerProps: { step: 2, name: "a" } })
    )
    story(modals, given(withContext), message(updateModal("x", {})), lastEntry({ settings: { title: "One" } }))
    unchanged(withContext, updateModal("missing", {}))
  })

  it("keeps a modal once it has shown, and removes it once it has gone", () =>
    story(
      modals,
      given(empty),
      message(openModal("a", { modalId: "a" })),
      transitioned(1),
      expectNoOutMessage(),
      model((state) => expect(state.entries).toHaveLength(1)),
      message(closeModal("a")),
      transitioned(2),
      model((state) => expect(state.entries).toEqual([]))
    ))

  it("closes a modal that asks to close", () =>
    story(
      modals,
      given(after([openModal("a", { modalId: "a" })])),
      message(Message.GotModal({ modalId: "a", message: { _tag: "RequestedClose" } })),
      expectOutMessage([OutMessage.ModalClosed({ modalId: "a" })]),
      transitioned(2)
    ))

  it("maps a modal's messages and ignores a modal that is not open", () => {
    expect(gotModal("a")({ _tag: "RequestedClose" })).toEqual(
      Message.GotModal({ modalId: "a", message: { _tag: "RequestedClose" } })
    )
    unchanged(
      after([openModal("a", { modalId: "a" })]),
      Message.GotModal({ modalId: "missing", message: { _tag: "RequestedClose" } })
    )
  })
})
