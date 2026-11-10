import type { Html, HtmlBuilder } from "foldkit/html"
import { appShellAside, appShellFooter, appShellHeader, appShellMain, appShellNavbar } from "../AppShell.ts"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.AppShell(h, {
    header: { height: 60, collapsed: true },
    navbar: { width: 300, breakpoint: "sm", collapsed: { desktop: true } },
    aside: { width: 200, breakpoint: "sm", collapsed: { desktop: true, mobile: true } },
    footer: { height: 40, offset: false },
    withBorder: false,
    zIndex: 300,
    children: [
      appShellHeader({ children: ["Hidden header"] }),
      appShellNavbar({ zIndex: 50, children: ["Hidden navbar"] }),
      appShellAside({ children: ["Hidden aside"] }),
      appShellFooter({ withBorder: true, children: ["Footer over the page"] }),
      appShellMain({ children: ["Main"] })
    ]
  })
