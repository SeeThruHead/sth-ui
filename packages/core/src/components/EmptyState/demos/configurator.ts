import type { Html, HtmlBuilder } from "foldkit/html"
import { MagnifyingGlassIcon } from "@sth-ui/icons/icons/MagnifyingGlassIcon.ts"
import type { Ui } from "../../../Ui.ts"

import { defineConfigurator } from "../../../stories/controls.ts"
import type { Values } from "../../../stories/controls.ts"

export const configurator = defineConfigurator({
  controls: [
    { type: "size", prop: "size", initial: "md", library: "md" },
    { type: "select", prop: "align", options: ["center", "left", "right"], initial: "center", library: "center" },
    { type: "boolean", prop: "withIndicatorBackground", initial: false, library: false }
  ],
  code: `ui.EmptyState(h, {
{{props}}  icon: MagnifyingGlassIcon(h, {}),
  title: "No results found",
  description:
      "We couldn't find anything matching your search. Try adjusting your filters or searching with different keywords to see more results.",
  actions: [ui.Button(h, { variant: "default", children: ["Reset filters"] })]
})`
})

export const view = <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<typeof configurator.controls>): Html =>
  ui.EmptyState(h, {
    icon: MagnifyingGlassIcon(h, {}),
    title: "No results found",
    description:
      "We couldn't find anything matching your search. Try adjusting your filters or searching with different keywords to see more results.",
    actions: [ui.Button(h, { variant: "default", children: ["Reset filters"] })],
    ...props
  })
