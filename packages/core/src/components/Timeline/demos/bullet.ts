import type { Html, HtmlBuilder } from "foldkit/html"
import { SunIcon } from "@sth-ui/icons/icons/SunIcon.ts"
import type { Ui } from "../../../Ui.ts"

const dimmed = <M>(h: HtmlBuilder<M>, ui: Ui, text: string) => ui.Text(h, { c: "dimmed", size: "sm", children: [text] })

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Timeline(h, {
    bulletSize: 24,
    maw: 360,
    items: [
      { title: "Default bullet", children: [dimmed(h, ui, "Default bullet without anything")] },
      {
        title: "Avatar",
        bullet: ui.Avatar(h, {
          size: 22,
          radius: "xl",
          src: "https://avatars0.githubusercontent.com/u/10353856?s=460&u=88394dfd67727327c1f7670a1764dc38a8a24831&v=4",
          alt: "Vitaly Rtishchev"
        }),
        children: [dimmed(h, ui, "Timeline bullet as avatar image")]
      },
      { title: "Icon", bullet: SunIcon(h, { size: 13 }), children: [dimmed(h, ui, "Timeline bullet as icon")] },
      {
        title: "Initials",
        bullet: ui.Avatar(h, { size: 22, radius: "xl", color: "cyan", name: "Robert Gluesticker" }),
        children: [dimmed(h, ui, "Timeline bullet as an avatar with initials")]
      }
    ]
  })
