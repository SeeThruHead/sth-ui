import { Option, Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import { CopyText, ExpireCopy } from "../clipboard.ts"
import { expandablePaths } from "./jsonValue.ts"

export const Model = Schema.Struct({
  id: Schema.String,
  expanded: Schema.Array(Schema.String),
  strings: Schema.Array(Schema.String),
  copied: Schema.Option(Schema.String)
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Toggled: { path: Schema.String },
  ToggledString: { path: Schema.String },
  ExpandedAll: { paths: Schema.Array(Schema.String) },
  CollapsedAll: {},
  Selected: { path: Schema.Array(Schema.String) },
  Copied: { target: Schema.String, text: Schema.String, timeout: Schema.Finite },
  CopyDone: { target: Schema.String, timeout: Schema.Finite },
  CopyFailed: {},
  CopyExpired: { target: Schema.String }
})
export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({
  ExpandedPathsChanged: { paths: Schema.Array(Schema.String) },
  ValueSelected: { path: Schema.Array(Schema.String) }
})
export type OutMessage = typeof OutMessage.Type

export type Result = {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessages: ReadonlyArray<OutMessage>
}

export const allTarget = "\u0000all"

export const init = (config: {
  readonly id: string
  readonly value: unknown
  readonly defaultExpandDepth?: number
  readonly groupArraysAfterLength?: number | false
  readonly expandedPaths?: ReadonlyArray<string>
}): Model => ({
  id: config.id,
  expanded:
    config.expandedPaths ??
    expandablePaths(config.value, {
      depth: config.defaultExpandDepth ?? 1,
      groupArraysAfterLength: config.groupArraysAfterLength ?? false
    }),
  strings: [],
  copied: Option.none()
})

const expanded = (model: Model, paths: ReadonlyArray<string>): Result => ({
  model: { ...model, expanded: paths },
  commands: [],
  outMessages: [OutMessage.ExpandedPathsChanged({ paths })]
})

const quiet = (model: Model): Result => ({ model, commands: [], outMessages: [] })

export type JsonViewerContext = { readonly allExpanded?: boolean }

export const update = (model: Model, message: Message, context: JsonViewerContext = {}): Result =>
  Message.match(message, {
    Toggled: ({ path }) => {
      if (context.allExpanded === true) return quiet(model)

      return expanded(
        model,
        model.expanded.includes(path) ? model.expanded.filter((item) => item !== path) : [...model.expanded, path]
      )
    },
    ToggledString: ({ path }) =>
      quiet({
        ...model,
        strings: model.strings.includes(path) ? model.strings.filter((item) => item !== path) : [...model.strings, path]
      }),
    ExpandedAll: ({ paths }) => expanded(model, paths),
    CollapsedAll: () => expanded(model, []),
    Selected: ({ path }) => ({ model, commands: [], outMessages: [OutMessage.ValueSelected({ path })] }),
    Copied: ({ target, text, timeout }) => ({
      model,
      commands: [CopyText({ target, text, timeout })],
      outMessages: []
    }),
    CopyDone: ({ target, timeout }) => ({
      model: { ...model, copied: Option.some(target) },
      commands: [ExpireCopy({ target, timeout })],
      outMessages: []
    }),
    CopyFailed: () => quiet(model),
    CopyExpired: ({ target }) =>
      quiet(Option.contains(model.copied, target) ? { ...model, copied: Option.none() } : model)
  })

export const setExpandedPaths = (model: Model, paths: ReadonlyArray<string>): Model => ({ ...model, expanded: paths })
