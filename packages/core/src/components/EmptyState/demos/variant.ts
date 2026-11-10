import type { Html, HtmlBuilder } from "foldkit/html"
import { MagnifyingGlassIcon } from "@sth-ui/icons/icons/MagnifyingGlassIcon.ts"
import type { Ui } from "../../../Ui.ts"

const description =
  "We couldn't find anything matching your search. Try adjusting your filters or searching with different keywords to see more results."

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.SimpleGrid(h, {
    cols: { base: 1, sm: 2 },
    spacing: "xl",
    children: [
      ui.EmptyState(h, {
        variant: "light",
        color: "blue",
        icon: MagnifyingGlassIcon(h, {}),
        title: "No results found",
        description
      }),
      ui.EmptyState(h, {
        variant: "filled",
        color: "teal",
        icon: MagnifyingGlassIcon(h, {}),
        title: "No results found",
        description
      })
    ]
  })
