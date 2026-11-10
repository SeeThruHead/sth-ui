import { Editor } from "@tiptap/core"
import type { AnyExtension } from "@tiptap/core"
import { Effect, Option, Predicate, Queue, Schema, Stream } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import * as Mount from "foldkit/mount"
import { contentStyles, editorClass } from "../content.ts"
import { highlighterIn } from "../highlight.ts"
import { controlNames } from "../controls.ts"
import * as ColorPicker from "@sth-ui/core/components/ColorPicker/ColorPicker.ts"
import * as FileInput from "@sth-ui/core/components/FileInput/FileInput.ts"
import * as Popover from "@sth-ui/core/components/Popover/Popover.ts"
import * as FoldkitFile from "foldkit/file"
import { Duration, Random } from "effect"
import { failUpload, finishUpload, imageFiles, imageFilesEvent, removeUpload, uploadOptionsOf } from "../upload.ts"
import type { ImageFilesDetail } from "../upload.ts"
import type { ResolvedUploadOptions } from "../upload.ts"
import * as Subscription from "foldkit/subscription"
import { contentId, editorOf, emptySnapshot, linkCalls, runCalls, runControl, snapshotOf, Snapshot } from "../editor.ts"

export const ControlName = Schema.Literals(controlNames)

export const LinkEditor = Schema.Struct({
  popover: Popover.Model,
  url: Schema.String,
  external: Schema.Boolean,
  initialExternal: Schema.Boolean
})

export const ColorEditor = Schema.Struct({
  popover: Popover.Model,
  mode: Schema.Literals(["palette", "colorPicker"]),
  picker: ColorPicker.Model
})

export const Model = Schema.Struct({
  id: Schema.String,
  content: Schema.String,
  snapshot: Snapshot,
  link: LinkEditor,
  color: ColorEditor,
  sourceCode: Schema.Boolean,
  image: FileInput.Model,
  table: Schema.Struct({ popover: Popover.Model, columns: Schema.Int, rows: Schema.Int })
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Changed: { snapshot: Snapshot },
  PressedControl: { control: ControlName },
  Ran: {},
  GotLinkPopover: { message: Popover.Message },
  ChangedLinkUrl: { url: Schema.String },
  ToggledLinkExternal: {},
  SavedLink: {},
  GotColorPopover: { message: Popover.Message },
  GotColorPicker: { message: ColorPicker.Message },
  PickedColor: { color: Schema.String },
  ClearedColor: {},
  ShowedColorPicker: {},
  ShowedPalette: {},
  ClosedColor: {},
  ToggledSourceCode: {},
  GotTablePopover: { message: Popover.Message },
  HoveredTableSize: { columns: Schema.Int, rows: Schema.Int },
  LeftTableGrid: {},
  InsertedTable: { columns: Schema.Int, rows: Schema.Int, withHeaderRow: Schema.Boolean },
  GotImageInput: { message: FileInput.Message },
  DroppedImageFiles: { files: Schema.Array(FoldkitFile.File), at: Schema.Int }
})
export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({
  ChangedContent: { html: Schema.String },
  SwitchedSourceCode: { active: Schema.Boolean }
})
export type OutMessage = typeof OutMessage.Type

export type InitConfig = { readonly id: string; readonly content?: string; readonly initialExternal?: boolean }

export const linkPopoverId = (id: string): string => `${id}-link`

export const colorPopoverId = (id: string): string => `${id}-color`

export const init = (config: InitConfig): Model => ({
  id: config.id,
  content: config.content ?? "",
  snapshot: emptySnapshot,
  link: {
    popover: Popover.init({ id: linkPopoverId(config.id) }),
    url: "",
    external: config.initialExternal === true,
    initialExternal: config.initialExternal === true
  },
  color: {
    popover: Popover.init({ id: colorPopoverId(config.id) }),
    mode: "palette",
    picker: ColorPicker.init({ id: `${colorPopoverId(config.id)}-picker` })
  },
  sourceCode: false,
  image: FileInput.init({ id: `${config.id}-image` }),
  table: { popover: Popover.init({ id: `${config.id}-table` }), columns: 0, rows: 0 }
})

export const RunControl = Command.define("RichTextEditorRunControl", {
  args: { id: Schema.String, control: ControlName },
  messages: [Message.Ran],
  execute: ({ id, control }) =>
    Effect.sync(() => {
      Option.map(editorOf(id), (editor) => runControl(editor, control))

      return Message.Ran()
    })
})

export const SetContent = Command.define("RichTextEditorSetContent", {
  args: { id: Schema.String, html: Schema.String },
  messages: [Message.Ran],
  execute: ({ id, html }) =>
    Effect.sync(() => {
      Option.map(editorOf(id), (editor) => editor.commands.setContent(html))

      return Message.Ran()
    })
})

export const SetLink = Command.define("RichTextEditorSetLink", {
  args: { id: Schema.String, href: Schema.String, external: Schema.Boolean },
  messages: [Message.Ran],
  execute: ({ id, href, external }) =>
    Effect.sync(() => {
      Option.map(editorOf(id), (editor) => runCalls(editor, linkCalls(href, external)))

      return Message.Ran()
    })
})

const Call = Schema.Struct({ name: Schema.String, args: Schema.optional(Schema.Array(Schema.Unknown)) })

export const RunCalls = Command.define("RichTextEditorRunCalls", {
  args: { id: Schema.String, calls: Schema.Array(Call) },
  messages: [Message.Ran],
  execute: ({ id, calls }) =>
    Effect.sync(() => {
      Option.map(editorOf(id), (editor) => runCalls(editor, calls))

      return Message.Ran()
    })
})

const sourceCalls = (editor: Editor, active: boolean) =>
  active
    ? [{ name: "setContent", args: [`<textarea>${editor.getHTML()}</textarea>`, { emitUpdate: false }] }]
    : [{ name: "setContent", args: [editor.getText(), { emitUpdate: true }] }]

export const ToggleSourceCode = Command.define("RichTextEditorToggleSourceCode", {
  args: { id: Schema.String, active: Schema.Boolean },
  messages: [Message.Ran],
  execute: ({ id, active }) =>
    Effect.sync(() => {
      Option.map(editorOf(id), (editor) => runCalls(editor, sourceCalls(editor, active)))

      return Message.Ran()
    })
})

class UploadFailed extends Schema.TaggedError<UploadFailed, { readonly brand: unique symbol }>()("UploadFailed", {
  cause: Schema.Unknown
}) {}

const failed = Effect.fn("RichTextEditor.uploadFailed")(function* (
  editor: Editor,
  options: ResolvedUploadOptions,
  file: File,
  uploadId: string,
  error: UploadFailed
) {
  options.onImageUploadError(file, error.cause)
  failUpload(editor, uploadId)
  yield* Effect.sleep(Duration.seconds(3))
  removeUpload(editor, uploadId)
})

type Pending = { readonly file: File; readonly uploadId: string; readonly preview: string }

const pending = Effect.fn("RichTextEditor.pending")(function* (file: File) {
  const drawn = yield* Random.nextIntBetween(1, 2_147_483_647)

  return { file, uploadId: String(drawn), preview: URL.createObjectURL(file) }
})

const placeholder = ({ uploadId, preview }: Pending) => ({
  type: "image",
  attrs: { src: preview, uploading: true, uploadId }
})

const uploadOne = (editor: Editor, options: ResolvedUploadOptions, { file, uploadId, preview }: Pending) =>
  Effect.tryPromise({
    try: () => options.onImageUpload(file),
    catch: (cause) => new UploadFailed({ cause })
  }).pipe(
    Effect.map((result) => finishUpload(editor, uploadId, result)),
    Effect.catch((error) => failed(editor, options, file, uploadId, error)),
    Effect.ensuring(Effect.sync(() => URL.revokeObjectURL(preview)))
  )

const uploadAll = Effect.fn("RichTextEditor.uploadAll")(function* (
  editor: Editor,
  options: ResolvedUploadOptions,
  files: ReadonlyArray<File>,
  at: number | undefined
) {
  const uploads = yield* Effect.forEach(imageFiles(files), pending)
  runCalls(editor, [
    at === undefined
      ? { name: "insertContent", args: [uploads.map(placeholder)] }
      : { name: "insertContentAt", args: [at, uploads.map(placeholder)] }
  ])
  yield* Effect.forEach(uploads, (upload) => uploadOne(editor, options, upload), { concurrency: "unbounded" })

  return Message.Ran()
})

export const UploadImages = Command.define("RichTextEditorUploadImages", {
  args: { id: Schema.String, files: Schema.Array(FoldkitFile.File), at: Schema.optional(Schema.Int) },
  messages: [Message.Ran],
  execute: ({ id, files, at }) =>
    Option.match(
      Option.zipWith(editorOf(id), Option.flatMap(editorOf(id), uploadOptionsOf), (editor, options) => ({
        editor,
        options
      })),
      {
        onNone: () => Effect.succeed(Message.Ran()),
        onSome: ({ editor, options }) => uploadAll(editor, options, files, at)
      }
    )
})

export type Result = {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessages: ReadonlyArray<OutMessage>
}

type PopoverResult = ReturnType<typeof Popover.update>

const opened = (model: Model): Model["link"] => ({
  ...model.link,
  url: model.snapshot.link.href,
  external: model.snapshot.link.href === "" ? model.link.initialExternal : model.snapshot.link.external
})

const linkAfter = (model: Model, result: PopoverResult): Model["link"] => {
  const link = { ...model.link, popover: result.model }
  if (result.outMessage?._tag === "Opened") return { ...opened(model), popover: result.model }

  return result.outMessage?._tag === "Closed" ? { ...link, url: "", external: model.link.initialExternal } : link
}

const linkPopover = (model: Model, result: PopoverResult): Result => ({
  model: { ...model, link: linkAfter(model, result) },
  commands: (result.commands ?? []).map((command) =>
    Command.mapMessage(command, (message) => Message.GotLinkPopover({ message }))
  ),
  outMessages: []
})

const colorPopover = (model: Model, result: PopoverResult): Result => ({
  model: {
    ...model,
    color: {
      ...model.color,
      popover: result.model,
      mode: result.outMessage?._tag === "Closed" ? "palette" : model.color.mode
    }
  },
  commands: (result.commands ?? []).map((command) =>
    Command.mapMessage(command, (message) => Message.GotColorPopover({ message }))
  ),
  outMessages: []
})

const withCommand = (result: Result, command: Command.Command<Message>): Result => ({
  ...result,
  commands: [...result.commands, command]
})

const tablePopover = (model: Model, result: PopoverResult): Result => ({
  model: {
    ...model,
    table:
      result.outMessage?._tag === "Closed"
        ? { popover: result.model, columns: 0, rows: 0 }
        : { ...model.table, popover: result.model }
  },
  commands: (result.commands ?? []).map((command) =>
    Command.mapMessage(command, (message) => Message.GotTablePopover({ message }))
  ),
  outMessages: []
})

const sized = (model: Model, columns: number, rows: number): Result => ({
  model: { ...model, table: { ...model.table, columns, rows } },
  commands: [],
  outMessages: []
})

const closeColor = (model: Model): Result => colorPopover(model, Popover.close(model.color.popover))

const runOn = (model: Model, calls: ReadonlyArray<typeof Call.Type>) => RunCalls({ id: model.id, calls })

const showPicker = (model: Model): Result => ({
  model: {
    ...model,
    color: {
      ...model.color,
      mode: "colorPicker",
      picker: ColorPicker.init({
        id: model.color.picker.id,
        value: model.snapshot.color === "" ? "#000000" : model.snapshot.color
      })
    }
  },
  commands: [],
  outMessages: []
})

const showPalette = (model: Model): Result => ({
  model: { ...model, color: { ...model.color, mode: "palette" } },
  commands: [],
  outMessages: []
})

export const update = (model: Model, message: Message): Result =>
  Message.match(message, {
    Changed: ({ snapshot }) => ({
      model: { ...model, snapshot },
      commands: [],
      outMessages: snapshot.html === model.snapshot.html ? [] : [OutMessage.ChangedContent({ html: snapshot.html })]
    }),
    PressedControl: ({ control }) => ({ model, commands: [RunControl({ id: model.id, control })], outMessages: [] }),
    Ran: () => ({ model, commands: [], outMessages: [] }),
    GotLinkPopover: ({ message: inner }) => linkPopover(model, Popover.update(model.link.popover, inner)),
    ChangedLinkUrl: ({ url }) => ({ model: { ...model, link: { ...model.link, url } }, commands: [], outMessages: [] }),
    ToggledLinkExternal: () => ({
      model: { ...model, link: { ...model.link, external: !model.link.external } },
      commands: [],
      outMessages: []
    }),
    GotColorPopover: ({ message: inner }) => colorPopover(model, Popover.update(model.color.popover, inner)),
    GotColorPicker: ({ message: inner }) => {
      const result = ColorPicker.update(model.color.picker, inner, { format: "hex" })
      const changed = result.outMessages.flatMap((out) => (out._tag === "Changed" ? [out.value] : []))

      return {
        model: { ...model, color: { ...model.color, picker: result.model } },
        commands: changed.map((color) => runOn(model, [{ name: "setColor", args: [color] }])),
        outMessages: []
      }
    },
    PickedColor: ({ color }) => withCommand(closeColor(model), runOn(model, [{ name: "setColor", args: [color] }])),
    ClearedColor: () => withCommand(closeColor(model), runOn(model, [{ name: "unsetColor" }])),
    ShowedColorPicker: () => showPicker(model),
    ShowedPalette: () => showPalette(model),
    ClosedColor: () => closeColor(model),
    GotTablePopover: ({ message: inner }) => tablePopover(model, Popover.update(model.table.popover, inner)),
    HoveredTableSize: ({ columns, rows }) => sized(model, columns, rows),
    LeftTableGrid: () => sized(model, 0, 0),
    InsertedTable: ({ columns, rows, withHeaderRow }) =>
      withCommand(
        tablePopover(model, Popover.close(model.table.popover)),
        runOn(model, [{ name: "insertTable", args: [{ rows, cols: columns, withHeaderRow }] }])
      ),
    GotImageInput: ({ message: inner }) => {
      const result = FileInput.update(model.image, inner)
      const files = result.outMessage?._tag === "Changed" ? result.outMessage.files : []

      return {
        model: { ...model, image: result.model },
        commands: [
          ...result.commands.map((command) =>
            Command.mapMessage(command, (lifted) => Message.GotImageInput({ message: lifted }))
          ),
          ...(files.length === 0 ? [] : [UploadImages({ id: model.id, files })])
        ],
        outMessages: []
      }
    },
    DroppedImageFiles: ({ files, at }) => ({
      model,
      commands: [UploadImages({ id: model.id, files, at })],
      outMessages: []
    }),
    ToggledSourceCode: () => ({
      model: { ...model, sourceCode: !model.sourceCode },
      commands: [ToggleSourceCode({ id: model.id, active: !model.sourceCode })],
      outMessages: [OutMessage.SwitchedSourceCode({ active: !model.sourceCode })]
    }),
    SavedLink: () => {
      const closed = linkPopover(model, Popover.close(model.link.popover))

      return {
        ...closed,
        commands: [...closed.commands, SetLink({ id: model.id, href: model.link.url, external: model.link.external })]
      }
    }
  })

export const setContent = (model: Model, html: string): Result => ({
  model,
  commands: [SetContent({ id: model.id, html })],
  outMessages: []
})

export const subscriptions = Subscription.lift(ColorPicker.subscriptions)<Model, Message>({
  read: (model) => Option.some(model.color.picker),
  toParentMessage: (message) => Message.GotColorPicker({ message })
})

const isDetail = (value: unknown): value is ImageFilesDetail =>
  Predicate.hasProperty(value, "files") && Predicate.hasProperty(value, "at") && Array.isArray(value.files)

const detailOf = (event: Event): Option.Option<ImageFilesDetail> =>
  event instanceof CustomEvent ? Option.liftPredicate(event.detail, isDetail) : Option.none()

export type EditorConfig = {
  readonly extensions: ReadonlyArray<AnyExtension>
  readonly editable?: boolean
  readonly withTypographyStyles?: boolean
  readonly withCodeHighlightStyles?: boolean
}

const highlighterFor = (config: EditorConfig): Option.Option<object> =>
  config.withCodeHighlightStyles === false ? Option.none() : highlighterIn(config.extensions)

export const create = (config: EditorConfig) => ({
  config,
  Mount: Mount.defineStream("RichTextEditorContent", {
    args: { content: Schema.String },
    messages: [Message.Changed, Message.DroppedImageFiles],
    execute: ({ element, content }) =>
      Stream.callback<typeof Message.Changed.Type | typeof Message.DroppedImageFiles.Type>((queue) => {
        const report = ({ editor }: { readonly editor: Editor }) => {
          Queue.offerUnsafe(queue, Message.Changed({ snapshot: snapshotOf(editor) }))
        }
        const dropped = (event: Event) => {
          Option.map(detailOf(event), ({ files, at }) =>
            Queue.offerUnsafe(queue, Message.DroppedImageFiles({ files, at }))
          )
        }

        return Effect.acquireRelease(
          Effect.sync(() => {
            element.addEventListener(imageFilesEvent, dropped)

            return new Editor({
              element,
              content,
              extensions: [
                ...config.extensions,
                contentStyles({ typography: config.withTypographyStyles ?? true, highlighter: highlighterFor(config) })
              ],
              editable: config.editable ?? true,
              injectCSS: false,
              editorProps: { attributes: { class: editorClass, role: "textbox", "aria-multiline": "true" } },
              onCreate: report,
              onTransaction: report,
              onFocus: report,
              onBlur: report
            })
          }),
          (editor) =>
            Effect.sync(() => {
              element.removeEventListener(imageFilesEvent, dropped)
              editor.destroy()
            })
        ).pipe(Effect.flatMap(() => Effect.never))
      })
  })
})

export type EditorBundle = ReturnType<typeof create>

export { contentId }
