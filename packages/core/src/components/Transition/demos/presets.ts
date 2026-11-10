import type { Html, HtmlBuilder } from "foldkit/html"
import * as Transition from "../Transition.ts"
import type { Ui } from "../../../Ui.ts"

const names = Object.keys(Transition.transitions).filter(
  (name): name is Transition.TransitionName => name in Transition.transitions
)

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.SimpleGrid(h, {
    cols: { base: 2, sm: 4 },
    children: names.map((name) =>
      ui.Transition(h, {
        model: Transition.init({ id: `preset-${name}`, mounted: true }),
        transition: name,
        children: [ui.Paper(h, { withBorder: true, p: "xs", children: [name] })]
      })
    )
  })
