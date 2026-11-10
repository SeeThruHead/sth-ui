import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { TextAlignCenterIcon } from "@sth-ui/icons/icons/TextAlignCenterIcon.ts"
import { TextAlignLeftIcon } from "@sth-ui/icons/icons/TextAlignLeftIcon.ts"
import { TextAlignRightIcon } from "@sth-ui/icons/icons/TextAlignRightIcon.ts"
import { TextBIcon } from "@sth-ui/icons/icons/TextBIcon.ts"
import { TextItalicIcon } from "@sth-ui/icons/icons/TextItalicIcon.ts"
import { TextUnderlineIcon } from "@sth-ui/icons/icons/TextUnderlineIcon.ts"
import type { ToolbarParts, ToolbarToggleGroupProps } from "../Toolbar.ts"

export const Model = Schema.Struct({
  formatting: Schema.Array(Schema.String),
  alignment: Schema.NullOr(Schema.String)
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Formatted: { value: Schema.Array(Schema.String) },
  Aligned: { value: Schema.NullOr(Schema.String) }
})
export type Message = typeof Message.Type

export const initWith = (start: Model) => (): Model => start

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    Formatted: ({ value }) => ({ model: { ...model, formatting: value }, commands: [] }),
    Aligned: ({ value }) => ({ model: { ...model, alignment: value }, commands: [] })
  })

export const formatItems = <M>(h: HtmlBuilder<M>) => [
  { value: "bold", ariaLabel: "Bold", children: [TextBIcon(h, { weight: "bold", size: "100%" })] },
  { value: "italic", ariaLabel: "Italic", children: [TextItalicIcon(h, { weight: "bold", size: "100%" })] },
  { value: "underline", ariaLabel: "Underline", children: [TextUnderlineIcon(h, { weight: "bold", size: "100%" })] }
]

export const alignItems = <M>(h: HtmlBuilder<M>) => [
  { value: "left", ariaLabel: "Align left", children: [TextAlignLeftIcon(h, { weight: "bold", size: "100%" })] },
  { value: "center", ariaLabel: "Align center", children: [TextAlignCenterIcon(h, { weight: "bold", size: "100%" })] },
  { value: "right", ariaLabel: "Align right", children: [TextAlignRightIcon(h, { weight: "bold", size: "100%" })] }
]

export const formatting = (
  model: Model,
  h: HtmlBuilder<Message>,
  extra: Partial<ToolbarToggleGroupProps<Message>> = {}
): ToolbarToggleGroupProps<Message> => ({
  ...extra,
  type: "multiple",
  value: model.formatting,
  onChange: (value) => Message.Formatted({ value }),
  items: formatItems(h)
})

export const alignment = (
  model: Model,
  h: HtmlBuilder<Message>,
  extra: Partial<ToolbarToggleGroupProps<Message>> = {}
): ToolbarToggleGroupProps<Message> => ({
  ...extra,
  type: "single",
  value: model.alignment,
  onChange: (value) => Message.Aligned({ value }),
  items: alignItems(h)
})

export const editor = (model: Model, h: HtmlBuilder<Message>) => (toolbar: ToolbarParts<Message>) => [
  toolbar.ToggleGroup(formatting(model, h)),
  toolbar.Divider(),
  toolbar.ToggleGroup(alignment(model, h))
]
