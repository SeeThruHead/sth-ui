import type { HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import * as Tree from "../Tree.ts"
import type { TreeNodeData } from "../Tree.ts"
import { files, searchDemo } from "./search.ts"

export { Message, Model } from "./search.ts"

const matchingAncestors = (nodes: ReadonlyArray<TreeNodeData>, query: string): ReadonlyArray<string> =>
  nodes.flatMap((node) => {
    const inner = matchingAncestors(node.children ?? [], query)

    return Tree.defaultTreeNodeFilter(query, node) || inner.length > 0 ? [node.value, ...inner] : []
  })

export const { init, update, view } = searchDemo({
  id: "search-highlight-tree",
  placeholder: "Search...",
  shown: () => files,
  expandedFor: (search) => matchingAncestors(files, search),
  label: <M>(h: HtmlBuilder<M>, ui: Ui, search: string, node: TreeNodeData) =>
    ui.Highlight(h, {
      component: "span",
      highlight: search,
      children: typeof node.label === "string" ? node.label : node.value
    })
})
