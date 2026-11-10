import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  h.div(
    [],
    [
      ui.Box(h, {
        component: "section",
        id: "spacing",
        m: "md",
        p: 20,
        mt: "-sm",
        px: "xl",
        w: 240,
        maw: "90%",
        mih: 60,
        bdrs: "lg",
        bd: "2px dashed blue",
        bg: "grape.1",
        c: "grape",
        children: ["Spacing, size, border and colour"]
      }),
      ui.Box(h, {
        id: "type",
        ff: "mono",
        fz: "lg",
        fw: 700,
        lh: "h1",
        lts: 2,
        ta: "center",
        tt: "uppercase",
        td: "underline",
        fs: "italic",
        opacity: 0.8,
        c: "dimmed",
        children: ["Type"]
      }),
      ui.Box(h, {
        id: "layout",
        pos: "relative",
        top: 4,
        left: "2px",
        display: "flex",
        flex: "1 1 auto",
        bg: "#123456",
        c: "#ffffff",
        bd: 3,
        bdrs: 6,
        fz: "h3",
        lh: 1.2,
        ff: "Georgia, serif",
        bgsz: "cover",
        bgp: "center",
        bgr: "no-repeat",
        bga: "fixed",
        children: ["Layout"]
      }),
      ui.Box(h, { id: "named", bd: "1px solid red", c: "red.4", bg: "white", fz: 13, children: ["Named colours"] }),
      ui.Box(h, { id: "raw", bd: "4px", bdrs: "10px", fz: "1.5em", children: ["Raw values"] })
    ]
  )
