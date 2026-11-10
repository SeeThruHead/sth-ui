import type { TreeNodeData } from "../Tree.ts"
import { filtered, plainLabel, searchDemo } from "./search.ts"

export { Message, Model } from "./search.ts"

const escaped = (character: string): string => character.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&")

const inOrder = (query: string): RegExp =>
  new RegExp(Array.from(query.replaceAll(/\s/g, "")).map(escaped).join(".*"), "i")

const fuzzy = (query: string, node: TreeNodeData): boolean =>
  inOrder(query).test(typeof node.label === "string" ? node.label : node.value)

export const { init, update, view } = searchDemo({
  id: "search-fuzzy-tree",
  placeholder: "Fuzzy search...",
  shown: filtered(fuzzy),
  expandedFor: () => "*",
  label: plainLabel
})
