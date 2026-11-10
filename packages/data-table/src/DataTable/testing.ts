import { Effect } from "effect"
import * as Mount from "foldkit/mount"
import * as Scene from "foldkit/scene"
import { ScrollTo } from "./commands.ts"
import { Message, scrollId } from "./model.ts"
import { WatchDataTable } from "./watch.ts"

export type Measurement = { readonly viewportHeight: number; readonly coarse: boolean }

export const measured = (
  toParentMessage: (message: Message) => unknown,
  measurement: Measurement = { viewportHeight: 480, coarse: false }
) =>
  Scene.Mount.resolve(
    Mount.mapMessage(WatchDataTable(), toParentMessage),
    toParentMessage(Message.Measured(measurement))
  )

export const scrolled = (toParentMessage: (message: Message) => unknown, id: string, top = 0) => {
  const message = toParentMessage(Message.CompletedScroll())

  return Scene.Command.resolve(
    { name: ScrollTo.name, args: { container: scrollId(id), top }, effect: Effect.succeed(message) },
    message
  )
}
