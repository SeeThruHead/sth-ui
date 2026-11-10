import { RichTextEditor } from "./RichTextEditor/RichTextEditor.ts"
import type { RichTextEditorComponents } from "./RichTextEditor/RichTextEditor.ts"

export type TiptapComponents = RichTextEditorComponents

export type TiptapConfig = { readonly components?: TiptapComponents }

export const createTiptap = (config: TiptapConfig = {}) => {
  const components = config.components ?? {}

  return { RichTextEditor: RichTextEditor(components) }
}

export type TiptapUi = ReturnType<typeof createTiptap>

export const tiptap = createTiptap()
