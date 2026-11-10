import { Editor } from "@tiptap/core"
import { Option, Schema } from "effect"
import { controlNames, controls } from "./controls.ts"
import { can, invoke } from "./call.ts"
import type { Call } from "./call.ts"
import type { ControlName, ControlSpec } from "./controls.ts"

export const LinkAttributes = Schema.Struct({ href: Schema.String, external: Schema.Boolean })
export type LinkAttributes = typeof LinkAttributes.Type

export const Snapshot = Schema.Struct({
  html: Schema.String,
  link: LinkAttributes,
  color: Schema.String,
  empty: Schema.Boolean,
  focused: Schema.Boolean,
  active: Schema.Array(Schema.String),
  disabled: Schema.Array(Schema.String)
})
export type Snapshot = typeof Snapshot.Type

export const emptySnapshot: Snapshot = {
  html: "",
  link: { href: "", external: false },
  color: "",
  empty: true,
  focused: false,
  active: [],
  disabled: []
}

export const contentId = (id: string): string => `${id}-content`

const isEditor = (value: unknown): value is Editor => value instanceof Editor

const attached = (element: Element): Option.Option<Editor> =>
  Option.liftPredicate(Reflect.get(element, "editor"), isEditor)

export const editorIn = (root: Element): Option.Option<Editor> =>
  Option.flatMap(Option.fromNullishOr(root.querySelector(".ProseMirror")), attached)

export const editorOf = (id: string): Option.Option<Editor> =>
  Option.flatMap(Option.fromNullishOr(document.getElementById(contentId(id))), editorIn)

const isActive = (editor: Editor, spec: ControlSpec): boolean => {
  if (spec.isActive !== undefined) return spec.isActive(editor)

  return spec.active !== undefined && editor.isActive(spec.active.name, spec.active.attributes ?? {})
}

const supported = (editor: Editor, spec: ControlSpec): boolean =>
  spec.requires === undefined || Object.hasOwn(editor.schema.nodes, spec.requires)

const isDisabled = (editor: Editor, spec: ControlSpec): boolean => {
  if (!supported(editor, spec)) return true

  if (spec.isDisabled !== undefined) return spec.isDisabled(editor)

  return spec.checksCan === true && !can(editor, spec.operation)
}

const linkOf = (editor: Editor): LinkAttributes => {
  const attributes = editor.getAttributes("link")
  const href = attributes["href"]

  return { href: typeof href === "string" ? href : "", external: attributes["target"] === "_blank" }
}

const colorOf = (editor: Editor): string => {
  const color = editor.getAttributes("textStyle")["color"]

  return typeof color === "string" ? color : ""
}

export const snapshotOf = (editor: Editor): Snapshot => ({
  html: editor.getHTML(),
  link: linkOf(editor),
  color: colorOf(editor),
  empty: editor.isEmpty,
  focused: editor.isFocused,
  active: controlNames.filter((name) => isActive(editor, controls[name])),
  disabled: controlNames.filter((name) => isDisabled(editor, controls[name]))
})

export const runCalls = (editor: Editor, calls: ReadonlyArray<Call>): boolean =>
  invoke(
    calls.reduce((chain, call) => invoke(chain, call), invoke(invoke(editor, { name: "chain" }), { name: "focus" })),
    { name: "run" }
  ) === true

export const runCall = (editor: Editor, call: Call): boolean => runCalls(editor, [call])

export const linkCalls = (href: string, external: boolean): ReadonlyArray<Call> => [
  { name: "extendMarkRange", args: ["link"] },
  href === "" ? { name: "unsetLink" } : { name: "setLink", args: [{ href, target: external ? "_blank" : null }] }
]

const operationOf = (editor: Editor, spec: ControlSpec): Call =>
  spec.choose === undefined ? spec.operation : spec.choose(editor)

export const runControl = (editor: Editor, name: ControlName): boolean =>
  supported(editor, controls[name]) && runCall(editor, operationOf(editor, controls[name]))
