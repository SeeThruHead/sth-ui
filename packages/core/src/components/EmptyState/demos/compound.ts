import type { Html, HtmlBuilder } from "foldkit/html"
import { MagnifyingGlassIcon } from "@sth-ui/icons/icons/MagnifyingGlassIcon.ts"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.EmptyState(h, {
    icon: MagnifyingGlassIcon(h, {}),
    title: "No results found",
    titleOrder: 3,
    description:
      "We couldn't find anything matching your search. Try adjusting your filters or searching with different keywords to see more results.",
    actions: [
      ui.Button(h, { variant: "default", children: ["Reset filters"] }),
      ui.Button(h, { variant: "default", children: ["Create new"] })
    ],
    children: [ui.Text(h, { size: "xs", c: "dimmed", children: ["Results are refreshed every five minutes."] })]
  })
