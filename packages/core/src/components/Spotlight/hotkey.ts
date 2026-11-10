import { Schema, Stream } from "effect"
import * as Mount from "foldkit/mount"
import { hotkeysOn } from "../../hooks/hotkey.ts"
import { Message } from "./model.ts"

export const WatchShortcut = Mount.defineStream("SpotlightShortcut", {
  args: {
    shortcuts: Schema.Array(Schema.String),
    tagsToIgnore: Schema.Array(Schema.String),
    triggerOnContentEditable: Schema.Boolean
  },
  messages: [Message.Opened],
  execute: ({ shortcuts, tagsToIgnore, triggerOnContentEditable }) =>
    hotkeysOn(
      document,
      shortcuts.map((shortcut) => [shortcut] as const),
      { tagsToIgnore, triggerOnContentEditable }
    ).pipe(Stream.map(() => Message.Opened()))
})
