import * as stylex from "@stylexjs/stylex"
import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { createHighlight, highlight } from "../../Highlight.ts"
import type { Highlighter } from "../../highlighter.ts"
import * as CodeHighlight from "../model.ts"

const escape = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")

export const keywords: Highlighter = ({ code, language }) => ({
  highlightedCode: escape(code).replaceAll(/\b(const|return|function)\b/gu, '<span class="token-keyword">$1</span>'),
  isHighlighted: language !== "text",
  codeClassName: `language-${language ?? "text"}`
})

const highlighted = createHighlight({ highlighter: keywords })

const tight = stylex.create({ code: { letterSpacing: "0.02em" } })

export const sample = `
const add = (a, b) => {
  return a + b
}

function twice(x) {
  return add(x, x)
}
`

const lines = Array.from({ length: 30 }, (_line, index) => `const line${index} = ${index}`).join("\n")

const names = ["plain", "collapsed", "tabs"] as const

export const Model = Schema.Struct({
  plain: CodeHighlight.Model,
  collapsed: CodeHighlight.Model,
  tabs: CodeHighlight.Model,
  events: Schema.String
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Got: { name: Schema.Literals(names), message: CodeHighlight.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({
  plain: CodeHighlight.init({ id: "plain" }),
  collapsed: CodeHighlight.init({ id: "collapsed", expanded: false }),
  tabs: CodeHighlight.init({ id: "tabs" }),
  events: ""
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => {
  const result = CodeHighlight.update(model[message.name], message.message)
  const events =
    result.outMessages
      .map((out) => (out._tag === "TabChanged" ? `tab ${out.index}` : `expanded ${String(out.expanded)}`))
      .at(-1) ?? model.events

  return {
    model: { ...model, [message.name]: result.model, events },
    commands: result.commands.map((command) =>
      Command.mapMessage(command, (inner) => Message.Got({ name: message.name, message: inner }))
    )
  }
}

const viewer = (model: Model, name: (typeof names)[number]) => ({
  model: model[name],
  toParentMessage: (message: CodeHighlight.Message) => Message.Got({ name, message })
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 560,
    mx: "auto",
    children: [
      highlight.CodeHighlight(h, { ...viewer(model, "plain"), code: sample, language: "tsx", radius: "md" }),
      highlighted.CodeHighlight(h, {
        ...viewer(model, "collapsed"),
        code: lines,
        language: "ts",
        withExpandButton: true,
        withLineNumbers: true,
        withBorder: true,
        maxCollapsedHeight: 120,
        codeColorScheme: "dark",
        copyLabel: "Copy it",
        copiedLabel: "Got it",
        expandCodeLabel: "Show all",
        collapseCodeLabel: "Show less",
        controls: [h.span([h.DataAttribute("extra-control", "")], ["ts"])],
        styles: { code: tight.code }
      }),
      ui.Text(h, { size: "sm", children: [`Last event: ${model.events || "none"}`] }),
      highlighted.CodeHighlightTabs(h, {
        ...viewer(model, "tabs"),
        code: [
          { fileName: "add.ts", code: "const add = 1", language: "ts", icon: "TS" },
          { fileName: "notes.txt", code: "plain words", language: "text" },
          { fileName: "twice.js", code: "function twice() {}" }
        ],
        getFileIcon: (fileName) => (fileName.endsWith(".js") ? "JS" : "?"),
        codeColorScheme: "light",
        withCopyButton: false,
        background: "#fff8e1",
        withFirstLineIndentation: true
      }),
      ui.Text(h, {
        children: [
          "Inline: ",
          highlight.InlineCodeHighlight(h, { code: "useState()", withBorder: true }),
          " and ",
          highlighted.InlineCodeHighlight(h, {
            code: "const x",
            language: "ts",
            codeColorScheme: "dark",
            radius: "xl",
            background: "#222"
          })
        ]
      }),
      highlight.CodeHighlightTabs(h, { ...viewer(model, "tabs"), code: [] }),
      highlight.CodeHighlight(h, {
        ...viewer(model, "plain"),
        code: "const light = true",
        highlighter: keywords,
        codeColorScheme: "light",
        withBorder: true,
        withCopyButton: false,
        withExpandButton: true,
        maxCollapsedHeight: "100px"
      }),
      highlight.CodeHighlight(h, {
        ...viewer(model, "plain"),
        code: "bordered",
        withBorder: true,
        withCopyButton: false
      }),
      highlight.CodeHighlightTabs(h, {
        ...viewer(model, "plain"),
        code: [{ fileName: "dark.ts", code: "const dark = 1\nconst more = 2" }],
        codeColorScheme: "dark",
        withLineNumbers: true,
        withExpandButton: true
      }),
      highlight.CodeHighlightTabs(h, {
        ...viewer(model, "plain"),
        code: [{ code: "no name" }],
        styles: { code: tight.code }
      })
    ]
  })
