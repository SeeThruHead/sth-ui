import { describe, expect, it } from "@effect/vitest"
import { Story } from "foldkit/test"
import { listingOutMessages, modelAfter } from "@sth-ui/testing/Story.ts"
import { choseFiles, init, Message, openDialog, OutMessage, update } from "./model.ts"
import type { DropzoneContext, Model } from "./model.ts"
import { DialogMessage, OpenDialog } from "./dialog.ts"
import { invalidType } from "./validate.ts"

const { Command, expectNoOutMessage, expectOutMessage, given, message, model, story } = Story

type Step = Parameters<typeof story<Model, Message, ReadonlyArray<OutMessage>>>[1]

const empty = init({ id: "drop" })

const png = new File(["x"], "photo.png", { type: "image/png" })

const pdf = new File(["x"], "doc.pdf", { type: "application/pdf" })

const images: DropzoneContext = { accept: ["image/*"] }

const dropzone = (context: DropzoneContext) =>
  listingOutMessages((current: Model, sent: Message) => update(current, sent, context))

const withDefaults = listingOutMessages((current: Model, sent: Message) => update(current, sent))

const step = (sent: Message, context: DropzoneContext, ...steps: ReadonlyArray<Step>) =>
  story(dropzone(context), given(empty), message(sent), ...steps)

const status = (expected: string) => model<Model>((current) => expect(current.status).toBe(expected))

const rejection = { file: pdf, errors: [invalidType(["image/*"])] }

describe("dropzone state, as react-dropzone", () => {
  it("shows whether dragged files would be accepted", () => {
    step(Message.DragEntered({ types: ["image/png"] }), images, status("accept"))
    step(Message.DragEntered({ types: ["application/pdf"] }), images, status("reject"))
    step(
      Message.DragEntered({ types: ["image/png"] }),
      { ...images, validator: () => ({ code: "x", message: "x" }) },
      status("accept")
    )
    step(
      Message.DragEntered({ types: ["image/png"] }),
      { disabled: true },
      model((current) => expect(current).toEqual(empty))
    )
  })

  it("goes back to idle when the drag leaves", () =>
    story(
      dropzone(images),
      given(modelAfter(dropzone(images), empty, [Message.DragEntered({ types: ["image/png"] })])),
      message(Message.DragLeft()),
      status("idle")
    ))

  it("reports dropped files sorted into accepted and rejected", () => {
    step(
      Message.Dropped({ files: [png, pdf] }),
      images,
      expectOutMessage([
        OutMessage.DroppedAny({ files: [png], rejections: [rejection] }),
        OutMessage.Dropped({ files: [png] }),
        OutMessage.Rejected({ rejections: [rejection] })
      ])
    )
    step(
      Message.Dropped({ files: [png] }),
      images,
      expectOutMessage([OutMessage.DroppedAny({ files: [png], rejections: [] }), OutMessage.Dropped({ files: [png] })])
    )
    step(
      Message.Dropped({ files: [pdf] }),
      images,
      expectOutMessage([
        OutMessage.DroppedAny({ files: [], rejections: [rejection] }),
        OutMessage.Rejected({ rejections: [rejection] })
      ])
    )
    step(Message.Dropped({ files: [png] }), { loading: true }, expectNoOutMessage())
  })

  it("opens the file dialog and takes the chosen files", () =>
    step(
      openDialog(),
      images,
      expectOutMessage([OutMessage.FileDialogOpened()]),
      Command.expectExact(OpenDialog),
      Command.resolve(OpenDialog, DialogMessage.Chose({ files: [png] })),
      expectOutMessage([OutMessage.DroppedAny({ files: [png], rejections: [] }), OutMessage.Dropped({ files: [png] })])
    ))

  it("reports a cancelled dialog", () =>
    step(
      openDialog(),
      { multiple: false },
      Command.resolve(OpenDialog, DialogMessage.Chose({ files: [] })),
      expectOutMessage([OutMessage.FileDialogCancelled()])
    ))

  it("does not open the dialog while disabled, and maps the dialog's choice", () => {
    step(openDialog(), { disabled: true }, Command.expectNone())
    expect(choseFiles(DialogMessage.Chose({ files: [png] }))).toEqual(Message.ChoseFiles({ files: [png] }))
  })

  it("follows files dragged over the window", () =>
    story(
      withDefaults,
      given(empty),
      message(Message.WindowDragChanged({ dragging: true })),
      model((current) => expect(current.windowDrag).toBe(true))
    ))
})
