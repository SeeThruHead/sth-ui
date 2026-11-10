import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import type { EditorView } from "@tiptap/pm/view"
import type { Editor } from "@tiptap/core"
import type { Node as ProseNode } from "@tiptap/pm/model"
import { Array as Arr, Option, Predicate } from "effect"

export type ImageUploadResult = { readonly src: string; readonly alt?: string; readonly title?: string }

export type UploadImageOptions = {
  readonly onImageUpload: (file: File) => Promise<string | ImageUploadResult>
  readonly onImageUploadError?: (file: File, error: unknown) => void
}

export const imageFilesEvent = "sth-image-files"

export type ImageFilesDetail = { readonly files: ReadonlyArray<File>; readonly at: number }

const announce = (view: EditorView, files: ReadonlyArray<File>, at: number): boolean => {
  const images = imageFiles(files)
  if (images.length === 0) return false
  view.dom.dispatchEvent(
    new CustomEvent<ImageFilesDetail>(imageFilesEvent, { bubbles: true, detail: { files: images, at } })
  )

  return true
}

const filesOf = (transfer: DataTransfer | null): ReadonlyArray<File> =>
  Option.match(Option.fromNullishOr(transfer), { onNone: Arr.empty<File>, onSome: (data) => Array.from(data.files) })

const dropAt = (view: EditorView, event: DragEvent): boolean =>
  Option.exists(Option.fromNullishOr(view.posAtCoords({ left: event.clientX, top: event.clientY })), ({ pos }) =>
    announce(view, filesOf(event.dataTransfer), pos)
  )

export const ImageUploads = Extension.create<Partial<UploadImageOptions>>({
  name: "sthImageUploads",
  addOptions: () => ({}),
  addProseMirrorPlugins: () => [
    new Plugin({
      key: new PluginKey("sthImageUploads"),
      props: {
        handlePaste: (view, event) => announce(view, filesOf(event.clipboardData), view.state.selection.to),
        handleDrop: (view, event) => dropAt(view, event)
      }
    })
  ],
  addGlobalAttributes: () => [
    {
      types: ["image"],
      attributes: {
        uploading: { default: false, renderHTML: () => ({}) },
        uploadError: { default: false, renderHTML: () => ({}) },
        uploadId: { default: null, rendered: false }
      }
    }
  ]
})

export type ResolvedUploadOptions = Required<UploadImageOptions>

const functionOf = (value: unknown): Option.Option<Function> => Option.liftPredicate(value, Predicate.isFunction)

export const uploadOptionsOf = (editor: Editor): Option.Option<ResolvedUploadOptions> =>
  Option.flatMap(
    Arr.findFirst(editor.extensionManager.extensions, (extension) => extension.name === ImageUploads.name),
    (extension) =>
      Option.map(functionOf(extension.options.onImageUpload), (upload) => ({
        onImageUpload: (file: File): Promise<string | ImageUploadResult> => Reflect.apply(upload, undefined, [file]),
        onImageUploadError: (file: File, error: unknown) => {
          Option.map(functionOf(extension.options.onImageUploadError), (failed) =>
            Reflect.apply(failed, undefined, [file, error])
          )
        }
      }))
  )

type Found = { readonly node: ProseNode; readonly pos: number }

const childrenOf = (node: ProseNode): ReadonlyArray<ProseNode> =>
  Array.from({ length: node.childCount }, (_, index) => node.child(index))

const findIn = (parent: ProseNode, start: number, uploadId: string): Option.Option<Found> =>
  childrenOf(parent).reduce<{ readonly at: number; readonly found: Option.Option<Found> }>(
    (state, node) => ({
      at: state.at + node.nodeSize,
      found: Option.orElse(state.found, () =>
        node.type.name === "image" && node.attrs["uploadId"] === uploadId
          ? Option.some({ node, pos: state.at })
          : findIn(node, state.at + 1, uploadId)
      )
    }),
    { at: start, found: Option.none() }
  ).found

export const findUpload = (editor: Editor, uploadId: string): Option.Option<Found> =>
  findIn(editor.state.doc, 0, uploadId)

const resultOf = (result: string | ImageUploadResult): ImageUploadResult =>
  Predicate.isString(result) ? { src: result } : result

const settle = (editor: Editor, uploadId: string, attrs: (found: Found) => Readonly<Record<string, unknown>>) =>
  Option.map(findUpload(editor, uploadId), (found) =>
    editor.view.dispatch(
      editor.state.tr.setNodeMarkup(found.pos, undefined, attrs(found)).setMeta("addToHistory", false)
    )
  )

export const finishUpload = (editor: Editor, uploadId: string, result: string | ImageUploadResult) =>
  settle(editor, uploadId, (found) => ({
    ...found.node.attrs,
    ...resultOf(result),
    uploading: false,
    uploadError: false,
    uploadId: null
  }))

export const failUpload = (editor: Editor, uploadId: string) =>
  settle(editor, uploadId, (found) => ({ ...found.node.attrs, uploading: false, uploadError: true }))

export const removeUpload = (editor: Editor, uploadId: string) =>
  Option.map(findUpload(editor, uploadId), (found) =>
    editor.view.dispatch(
      editor.state.tr.delete(found.pos, found.pos + found.node.nodeSize).setMeta("addToHistory", false)
    )
  )

export const imageFiles = (files: ReadonlyArray<File>): ReadonlyArray<File> =>
  files.filter((file) => file.type.startsWith("image/"))
