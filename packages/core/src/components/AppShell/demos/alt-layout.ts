import type { Html, HtmlBuilder } from "foldkit/html"
import { appShellAside, appShellFooter, appShellHeader, appShellMain, appShellNavbar } from "../AppShell.ts"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.AppShell(h, {
    layout: "alt",
    header: { height: { base: 48, md: 60 } },
    navbar: { width: { base: 200, lg: 300 }, breakpoint: "sm" },
    aside: { width: 240, breakpoint: "md", collapsed: { mobile: true } },
    footer: { height: 50, collapsed: true },
    padding: { sm: "xs", md: "xl" },
    children: [
      appShellHeader({ children: [ui.Group(h, { h: "100%", px: "md", children: ["Header"] })] }),
      appShellNavbar({ p: "md", children: ["Navbar"] }),
      appShellAside({ p: "md", children: ["Aside"] }),
      appShellFooter({ p: "sm", children: ["Footer"] }),
      appShellMain({
        children: [ui.Text(h, { children: ["Main: the navbar and aside run the full height, beside the header"] })]
      })
    ]
  })
