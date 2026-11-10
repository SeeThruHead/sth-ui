import type { Html, HtmlBuilder } from "foldkit/html"
import { appShellAside, appShellFooter, appShellHeader, appShellMain, appShellNavbar } from "../AppShell.ts"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.AppShell(h, {
    header: { height: { base: 48, md: 60 } },
    navbar: { width: { base: 200, lg: 300 }, breakpoint: "sm" },
    aside: { width: 240, breakpoint: "md", collapsed: { mobile: true } },
    footer: { height: { md: 50 } },
    padding: { sm: "xs", md: "xl" },
    transitionTimingFunction: "linear",
    children: [
      appShellHeader({ children: [ui.Group(h, { h: "100%", px: "md", children: ["Header"] })] }),
      appShellNavbar({ p: "md", children: ["Navbar"] }),
      appShellAside({ p: "md", children: ["Aside"] }),
      appShellFooter({ p: "sm", children: ["Footer"] }),
      appShellMain({
        children: [ui.Text(h, { children: ["Main: header, navbar, aside and footer, each sized by breakpoint"] })]
      })
    ]
  })
