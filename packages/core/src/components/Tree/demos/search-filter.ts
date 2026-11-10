import { filtered, plainLabel, searchDemo } from "./search.ts"

export { Message, Model } from "./search.ts"

export const { init, update, view } = searchDemo({
  id: "search-filter-tree",
  placeholder: "Search...",
  shown: filtered(),
  expandedFor: () => "*",
  label: plainLabel
})
