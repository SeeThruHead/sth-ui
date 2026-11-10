import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

const named = (label: string) => ({ attributes: { root: { "aria-label": label } } })

const lorem = [
  "Lorem ipsum dolor sit amet consectetur adipisicing elit. Modi dolor nihil amet tempore magnam optio, numquam nostrum inventore tempora assumenda saepe, aut repellat.",
  "Laborum fuga quam voluptas aut pariatur delectus repudiandae commodi tempora debitis dolores vero cumque magni cum, deserunt, ad tempore consectetur libero molestias."
]

const content = <M>(h: HtmlBuilder<M>, ui: Ui, visible: boolean) =>
  ui.Skeleton(h, {
    visible,
    ...named("Article"),
    children: lorem.map((text) => ui.Text(h, { children: [text] }))
  })

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html => ui.Box(h, { maw: 480, children: [content(h, ui, true)] })
