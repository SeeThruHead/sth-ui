import type { Html, HtmlBuilder } from "foldkit/html"
import { appShellAside, appShellFooter, appShellHeader, appShellMain, appShellNavbar } from "../AppShell.ts"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, {
    h: 420,
    bd: "1px solid gray.3",
    children: [
      ui.AppShell(h, {
        mode: "static",
        header: { height: 50 },
        navbar: { width: 220, breakpoint: "sm" },
        aside: { width: 180, breakpoint: "md", collapsed: { desktop: false, mobile: true } },
        footer: { height: 40 },
        padding: "md",
        children: [
          appShellHeader({ children: [ui.Group(h, { h: "100%", px: "md", children: ["Header"] })] }),
          appShellNavbar({ p: "md", children: ["Navbar"] }),
          appShellAside({ p: "md", children: ["Aside"] }),
          appShellFooter({ p: "sm", ta: "right", children: ["Footer"] }),
          appShellMain({
            children: [ui.Paper(h, { withBorder: true, mih: 600, p: "md", children: ["Scrolls inside the box"] })]
          })
        ]
      })
    ]
  })
