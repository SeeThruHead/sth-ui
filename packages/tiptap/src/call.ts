import type { Editor } from "@tiptap/core"
import { Predicate } from "effect"

export type Call = { readonly name: string; readonly args?: ReadonlyArray<unknown> | undefined }

export const invoke = (target: unknown, call: Call): unknown => {
  const method = Predicate.isObject(target) ? Reflect.get(target, call.name) : undefined

  return Predicate.isFunction(method) ? Reflect.apply(method, target, call.args ?? []) : undefined
}

export const can = (editor: Editor, call: Call): boolean => invoke(invoke(editor, { name: "can" }), call) === true

export const stored = (editor: Editor, extension: string, call: Call): unknown =>
  invoke(Reflect.get(editor.storage, extension), call)
