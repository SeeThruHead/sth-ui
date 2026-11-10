import { Option, Schema } from "effect"
import type * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import { CopyText, ExpireCopy } from "../clipboard.ts"

export const Model = Schema.Struct({
  id: Schema.String,
  expanded: Schema.Boolean,
  copied: Schema.Option(Schema.String),
  activeTab: Schema.Int
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  ToggledExpanded: {},
  ShowedCode: {},
  ChoseTab: { index: Schema.Int },
  Copied: { target: Schema.String, text: Schema.String, timeout: Schema.Finite },
  CopyDone: { target: Schema.String, timeout: Schema.Finite },
  CopyFailed: {},
  CopyExpired: { target: Schema.String }
})
export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({
  ExpandedChanged: { expanded: Schema.Boolean },
  TabChanged: { index: Schema.Int }
})
export type OutMessage = typeof OutMessage.Type

export type Result = {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessages: ReadonlyArray<OutMessage>
}

export const init = (config: {
  readonly id: string
  readonly expanded?: boolean
  readonly activeTab?: number
}): Model => ({
  id: config.id,
  expanded: config.expanded ?? true,
  copied: Option.none(),
  activeTab: config.activeTab ?? 0
})

const expanded = (model: Model, value: boolean): Result => ({
  model: { ...model, expanded: value },
  commands: [],
  outMessages: [OutMessage.ExpandedChanged({ expanded: value })]
})

export const update = (model: Model, message: Message): Result =>
  Message.match(message, {
    ToggledExpanded: () => expanded(model, !model.expanded),
    ShowedCode: () => expanded(model, true),
    ChoseTab: ({ index }) => ({
      model: { ...model, activeTab: index },
      commands: [],
      outMessages: [OutMessage.TabChanged({ index })]
    }),
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
    CopyFailed: () => ({ model, commands: [], outMessages: [] }),
    CopyExpired: ({ target }) => ({
      model: Option.contains(model.copied, target) ? { ...model, copied: Option.none() } : model,
      commands: [],
      outMessages: []
    })
  })

export const setExpanded = (model: Model, value: boolean): Model => ({ ...model, expanded: value })

export const setActiveTab = (model: Model, index: number): Model => ({ ...model, activeTab: index })
