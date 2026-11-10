import { Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import type { InteractionContext } from "../DayView/interaction.ts"
import * as View from "../DayView/model.ts"

export const ViewLevel = Schema.Literals(["day", "week", "month", "year"])
export type ViewLevel = typeof ViewLevel.Type

export const Model = Schema.Struct({
  date: Schema.String,
  view: ViewLevel,
  selectedDate: Schema.String,
  views: View.Model
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  ChangedDate: { date: Schema.String },
  ChangedView: { view: ViewLevel },
  OpenedMonth: { date: Schema.String },
  SelectedDay: { date: Schema.String },
  GotView: { message: View.Message }
})
export type Message = typeof Message.Type

export const Change = defineMessageUnion({
  DateChanged: { date: Schema.String },
  ViewChanged: { view: ViewLevel }
})
export type Change = typeof Change.Type

export type OutMessage = Change | View.OutMessage

export type Result = {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessages: ReadonlyArray<OutMessage>
}

export const init = (config: { readonly id: string; readonly date: string; readonly view?: ViewLevel }): Model => ({
  date: config.date,
  view: config.view ?? "week",
  selectedDate: config.date,
  views: View.init({ id: config.id })
})

export const gotView = (message: View.Message): Message => Message.GotView({ message })

const changed = (model: Model, outMessages: ReadonlyArray<OutMessage>): Result => ({ model, commands: [], outMessages })

export const update = (model: Model, message: Message, context: InteractionContext): Result =>
  Message.match(message, {
    ChangedDate: ({ date }) => changed({ ...model, date }, [Change.DateChanged({ date })]),
    ChangedView: ({ view }) => changed({ ...model, view }, [Change.ViewChanged({ view })]),
    OpenedMonth: ({ date }) =>
      changed({ ...model, date, view: "month" }, [Change.DateChanged({ date }), Change.ViewChanged({ view: "month" })]),
    SelectedDay: ({ date }) => changed({ ...model, selectedDate: date }, []),
    GotView: ({ message: inner }) => {
      const result = View.update(model.views, inner, context)

      return {
        model: { ...model, views: result.model },
        commands: result.commands.map((command) => Command.mapMessage(command, gotView)),
        outMessages: result.outMessages
      }
    }
  })
