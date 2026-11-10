import { Effect, Option, Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"

export const FocusMessage = defineMessageUnion({ Focused: {} })

export const FocusNode = Command.define("TreeFocusNode", {
  args: { tree: Schema.String, value: Schema.String },
  messages: [FocusMessage.Focused],
  execute: ({ tree, value }) =>
    Effect.sync(() => {
      Option.fromNullishOr(
        document.querySelector<HTMLElement>(
          `[data-tree-id="${CSS.escape(tree)}"] [role="treeitem"][data-value="${CSS.escape(value)}"]`
        )
      ).pipe(Option.map((node) => node.focus()))

      return FocusMessage.Focused()
    })
})
