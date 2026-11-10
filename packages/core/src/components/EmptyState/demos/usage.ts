import type { Html, HtmlBuilder } from "foldkit/html"
import { MagnifyingGlassIcon } from "@sth-ui/icons/icons/MagnifyingGlassIcon.ts"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.EmptyState(h, {
    icon: MagnifyingGlassIcon(h, {}),
    title: "No results found",
    description:
      "We couldn't find anything matching your search. Try adjusting your filters or searching with different keywords to see more results.",
    actions: [ui.Button(h, { variant: "default", children: ["Reset filters"] })]
  })
