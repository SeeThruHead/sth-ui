import * as stylex from "@stylexjs/stylex"
import type { AnyExtension } from "@tiptap/core"
import type { Node as ProseNode } from "@tiptap/pm/model"
import { Decoration } from "@tiptap/pm/view"
import { Option, Predicate, Schema } from "effect"
import { stylexClass } from "@sth-ui/core/styles/stylexClass.ts"
import { palette } from "@sth-ui/core/theme/palette.stylex.ts"
import { invoke } from "./call.ts"

type HastNode =
  | { readonly type: "text"; readonly value: string }
  | {
      readonly type: "root" | "element"
      readonly properties?: { readonly className?: ReadonlyArray<string> }
      readonly children: ReadonlyArray<HastNode>
    }

const HastNode: Schema.Codec<HastNode> = Schema.Union([
  Schema.Struct({ type: Schema.Literal("text"), value: Schema.String }),
  Schema.Struct({
    type: Schema.Literals(["root", "element"]),
    properties: Schema.optionalKey(Schema.Struct({ className: Schema.optionalKey(Schema.Array(Schema.String)) })),
    children: Schema.Array(Schema.suspend(() => HastNode))
  })
])

const decodeTree = Schema.decodeUnknownOption(HastNode)

const styles = stylex.create({
  comment: { color: `light-dark(${palette.gray5}, ${palette.dark2})` },
  variable: { color: `light-dark(${palette.red7}, ${palette.red5})` },
  number: { color: `light-dark(${palette.blue7}, ${palette.cyan5})` },
  title: { color: `light-dark(${palette.pink7}, ${palette.yellow5})` },
  keyword: { color: `light-dark(${palette.violet7}, ${palette.violet3})` },
  emphasis: { fontStyle: "italic" },
  strong: { fontWeight: 700 }
})

const tokenStyles: Readonly<Record<string, (typeof styles)[keyof typeof styles]>> = {
  "hljs-comment": styles.comment,
  "hljs-quote": styles.comment,
  "hljs-variable": styles.variable,
  "hljs-template-variable": styles.variable,
  "hljs-attribute": styles.variable,
  "hljs-tag": styles.variable,
  "hljs-regexp": styles.variable,
  "hljs-link": styles.variable,
  "hljs-name": styles.variable,
  "hljs-selector-id": styles.variable,
  "hljs-selector-class": styles.variable,
  "hljs-string": styles.variable,
  "hljs-symbol": styles.variable,
  "hljs-bullet": styles.variable,
  "hljs-number": styles.number,
  "hljs-meta": styles.number,
  "hljs-built_in": styles.number,
  "hljs-builtin-name": styles.number,
  "hljs-literal": styles.number,
  "hljs-type": styles.number,
  "hljs-params": styles.number,
  "hljs-title": styles.title,
  "hljs-section": styles.title,
  "hljs-keyword": styles.keyword,
  "hljs-selector-tag": styles.keyword,
  "hljs-emphasis": styles.emphasis,
  "hljs-strong": styles.strong
}

type Token = { readonly text: string; readonly classes: ReadonlyArray<string> }

const tokensOf = (node: HastNode, classes: ReadonlyArray<string>): ReadonlyArray<Token> => {
  if (node.type === "text") return [{ text: node.value, classes }]
  const inner = [...classes, ...(node.properties?.className ?? [])]

  return node.children.flatMap((child) => tokensOf(child, inner))
}

const classOf = (classes: ReadonlyArray<string>): string =>
  stylexClass(...classes.flatMap((name) => Option.toArray(Option.fromNullishOr(tokenStyles[name]))))

export const highlighterIn = (extensions: ReadonlyArray<AnyExtension>): Option.Option<object> =>
  Option.fromNullishOr(
    extensions.map((extension) => Reflect.get(extension.options, "lowlight")).find(Predicate.isObject)
  )

const treeOf = (highlighter: object, block: ProseNode): unknown => {
  const language = String(block.attrs["language"] ?? "")
  const text = block.textContent
  const known = language !== "" && invoke(highlighter, { name: "registered", args: [language] }) === true

  return known
    ? invoke(highlighter, { name: "highlight", args: [language, text] })
    : invoke(highlighter, { name: "highlightAuto", args: [text] })
}

type Span = { readonly from: number; readonly to: number; readonly className: string }

const spansOf = (tokens: ReadonlyArray<Token>, from: number): ReadonlyArray<Span> =>
  tokens.reduce<{ readonly at: number; readonly spans: ReadonlyArray<Span> }>(
    (state, token) => ({
      at: state.at + token.text.length,
      spans: [...state.spans, { from: state.at, to: state.at + token.text.length, className: classOf(token.classes) }]
    }),
    { at: from, spans: [] }
  ).spans

export const tokenDecorations = (highlighter: object, block: ProseNode, from: number): ReadonlyArray<Decoration> =>
  Option.toArray(decodeTree(treeOf(highlighter, block)))
    .flatMap((tree) => spansOf(tokensOf(tree, []), from))
    .filter((span) => span.className !== "")
    .map((span) => Decoration.inline(span.from, span.to, { class: span.className }))
