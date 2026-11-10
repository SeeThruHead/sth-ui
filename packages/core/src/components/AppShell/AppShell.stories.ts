import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import type { Kit } from "../../stories/harness.ts"
import { demo, demoApp, story } from "../../stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as HeaderNavbarAsideFooterDemo from "./demos/header-navbar-aside-footer.ts"
import * as AltLayoutDemo from "./demos/alt-layout.ts"
import * as CollapsedAndNoOffsetDemo from "./demos/collapsed-and-no-offset.ts"
import * as StaticModeDemo from "./demos/static-mode.ts"
import * as ResizeDemo from "./demos/resize.ts"
import {
  appShellAside,
  appShellFooter,
  appShellHeader,
  appShellMain,
  appShellNavbar,
  appShellSection
} from "./AppShell.ts"
import type { AppShellProps } from "./AppShell.ts"
import { present } from "../../stories/dom.ts"

const meta: Meta = {
  title: "Layout/AppShell",
  parameters: { layout: "fullscreen" },
  globals: { viewport: { value: "wide", isRotated: false } }
}

export default meta

const box = (element: Element | null | undefined) => present(element?.getBoundingClientRect())

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const header = ({ h, ui, value, set }: Kit) =>
  appShellHeader({
    children: [
      ui.Group(h, {
        h: "100%",
        px: "md",
        children: [
          ui.Box(h, {
            hiddenFrom: "sm",
            children: [
              ui.Burger(h, {
                size: "sm",
                opened: value("open", "no") === "yes",
                onClick: set("open", value("open", "no") === "yes" ? "no" : "yes"),
                label: "Toggle navigation"
              })
            ]
          }),
          ui.Text(h, { fw: 700, children: ["Header"] })
        ]
      })
    ]
  })

const links = ["Dashboard", "Projects", "Messages", "Settings"]

const navbar = ({ h, ui, value, set }: Kit) =>
  appShellNavbar({
    children: [
      appShellSection({ children: [ui.Text(h, { p: "md", fw: 600, children: ["Navbar header"] })] }),
      appShellSection({
        grow: true,
        component: "div",
        children: links.map((label) =>
          ui.NavLink(h, {
            component: "button",
            label,
            active: value("page", "Dashboard") === label,
            onClick: set("page", label)
          })
        )
      }),
      appShellSection({
        children: [ui.Text(h, { p: "md", c: "dimmed", size: "sm", children: ["Navbar footer, always at the bottom"] })]
      })
    ]
  })

const main = ({ h, ui }: Kit, text = "This is the main section, your app content here.") =>
  appShellMain({
    children: [
      ui.Text(h, { children: [text] }),
      ...Array.from({ length: 6 }, (_, index) =>
        ui.Skeleton(h, {
          h: 28,
          mt: "sm",
          animate: false,
          attributes: { root: { "aria-label": `Loading row ${index + 1}` } }
        })
      )
    ]
  })

const basic = (kit: Kit, extra: Partial<AppShellProps> = {}) =>
  kit.ui.AppShell(kit.h, {
    header: { height: 60 },
    navbar: { width: 300, breakpoint: "sm", collapsed: { mobile: kit.value("open", "no") === "no" } },
    padding: "md",
    children: [header(kit), navbar(kit), main(kit)],
    ...extra
  })

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const nav = await canvas.findByRole("navigation")
    const banner = canvas.getByRole("banner")
    const page = canvas.getByRole("main")
    await expect(box(banner).height).toBe(60)
    await expect(box(nav).width).toBe(300)
    await expect(box(nav).top).toBe(60)
    await expect(css(page).paddingLeft).toBe("316px")
    await expect(css(page).paddingTop).toBe("76px")
    await expect(css(canvas.getByRole("button", { name: "Dashboard" }).parentElement).flexGrow).toBe("1")
    await expect(canvas.getByRole("button", { name: "Dashboard" })).toHaveAttribute("data-active")
    await expect(box(canvas.getByLabelText("Loading row 1")).height).toBe(28)
    await expect(canvas.queryByRole("button", { name: "Toggle navigation" })).toBeNull()
  }
}

export const OnPhone: StoryObj = {
  globals: { viewport: { value: "phone", isRotated: false } },
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const nav = await canvas.findByRole("navigation")
    await expect(box(nav).right).toBeLessThanOrEqual(0)
    await expect(css(canvas.getByRole("main")).paddingLeft).toBe("16px")
    await expect(canvas.getByRole("button", { name: "Toggle navigation" })).toBeVisible()
  }
}

export const Clicking: StoryObj = {
  globals: { viewport: { value: "phone", isRotated: false } },
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Toggle navigation" }))
    const nav = canvas.getByRole("navigation")
    await waitFor(() => expect(box(nav).left).toBe(0))
    await expect(box(nav).width).toBe(390)
    await expect(canvas.getByRole("button", { name: "Toggle navigation" })).toHaveAttribute("aria-expanded", "true")
    await userEvent.click(canvas.getByRole("button", { name: "Projects" }))
    await waitFor(() => expect(canvas.getByRole("button", { name: "Projects" })).toHaveAttribute("data-active"))
  }
}

export const HeaderNavbarAsideFooter: StoryObj = {
  render: demo(HeaderNavbarAsideFooterDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const aside = await canvas.findByRole("complementary")
    const footer = canvas.getByRole("contentinfo")
    const page = canvas.getByRole("main")
    await expect(box(aside).width).toBe(240)
    await expect(box(aside).right).toBe(1440)
    await expect(box(aside).bottom).toBe(900 - 50)
    await expect(box(footer).bottom).toBe(900)
    await expect(box(canvas.getByRole("navigation")).width).toBe(300)
    await expect(css(canvas.getByRole("navigation")).paddingTop).toBe("16px")
    await expect(css(page).paddingRight).toBe("272px")
    await expect(css(page).paddingBottom).toBe("82px")
    await expect(css(page).transitionTimingFunction).toBe("linear")
  }
}

export const AltLayout: StoryObj = {
  render: demo(AltLayoutDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const nav = await canvas.findByRole("navigation")
    await expect(box(nav).top).toBe(0)
    await expect(box(nav).height).toBe(900)
    await expect(box(canvas.getByRole("banner")).left).toBe(300)
    await expect(box(canvas.getByRole("banner")).right).toBe(1440 - 240)
    await expect(box(canvas.getByRole("contentinfo")).top).toBeGreaterThanOrEqual(900)
  }
}

export const CollapsedAndNoOffset: StoryObj = {
  render: demo(CollapsedAndNoOffsetDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const nav = await canvas.findByRole("navigation")
    await expect(box(nav).right).toBeLessThanOrEqual(0)
    await expect(css(nav).zIndex).toBe("51")
    await expect(box(canvas.getByRole("complementary")).left).toBeGreaterThanOrEqual(1440)
    await expect(box(canvas.getByRole("banner")).bottom).toBeLessThanOrEqual(0)
    await expect(css(canvas.getByRole("banner")).zIndex).toBe("300")
    await expect(css(canvas.getByRole("banner")).borderBottomWidth).toBe("0px")
    await expect(css(canvas.getByRole("contentinfo")).borderTopWidth).toBe("1px")
    const page = canvas.getByRole("main")
    await expect(css(page).paddingTop).toBe("0px")
    await expect(css(page).paddingLeft).toBe("0px")
    await expect(css(page).paddingBottom).toBe("0px")
  }
}

const inBox = (kit: Kit, extra: Partial<AppShellProps>) =>
  kit.ui.Box(kit.h, {
    h: 420,
    bd: "1px solid gray.3",
    children: [
      kit.ui.AppShell(kit.h, {
        mode: "static",
        header: { height: 50 },
        navbar: { width: 220, breakpoint: "sm" },
        aside: { width: 180, breakpoint: "md", collapsed: { desktop: false, mobile: true } },
        footer: { height: 40 },
        padding: "md",
        children: [
          header(kit),
          navbar(kit),
          appShellAside({ children: [kit.ui.Text(kit.h, { p: "md", children: ["Aside"] })] }),
          appShellFooter({ children: [kit.ui.Text(kit.h, { p: "sm", ta: "right", children: ["Footer"] })] }),
          appShellMain({
            children: [
              kit.ui.Paper(kit.h, { withBorder: true, mih: 600, p: "md", children: ["Scrolls inside the box"] })
            ]
          })
        ],
        ...extra
      })
    ]
  })

export const StaticMode: StoryObj = {
  render: demo(StaticModeDemo.view),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const nav = await canvas.findByRole("navigation")
    const page = canvas.getByRole("main")
    const root = page.parentElement
    await expect(css(root).display).toBe("grid")
    await expect(box(root).height).toBe(418)
    await expect(box(page).left - box(root).left).toBe(220)
    await expect(box(nav).top - box(root).top).toBe(50)
    await expect(css(nav).position).toBe("sticky")
    await expect(css(page).paddingLeft).toBe("16px")
    await expect(box(canvas.getByRole("complementary")).right).toBe(box(root).right)
  }
}

export const StaticAltLayout: StoryObj = {
  render: story((kit) =>
    inBox(kit, { layout: "alt", navbar: { width: 220, breakpoint: "sm", collapsed: { desktop: true } } })
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const page = await canvas.findByRole("main")
    const root = page.parentElement
    await expect(css(canvas.getByRole("navigation", { hidden: true })).display).toBe("none")
    await expect(box(page).left).toBe(box(root).left)
    await expect(box(canvas.getByRole("complementary")).top).toBe(box(root).top)
    await expect(box(canvas.getByRole("banner")).right).toBe(box(root).right - 180)
  }
}

export const Disabled: StoryObj = {
  render: story((kit) => basic(kit, { disabled: true })),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const page = await canvas.findByRole("main")
    await expect(canvas.queryByRole("navigation")).toBeNull()
    await expect(canvas.queryByRole("banner")).toBeNull()
    await expect(css(page).paddingTop).toBe("16px")
    await expect(css(page).paddingLeft).toBe("16px")
    await expect(page.parentElement).toHaveAttribute("data-disabled")
  }
}

const pointer = (target: EventTarget, type: string, x: number, y: number) =>
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      button: 0,
      pointerId: 1,
      isPrimary: true,
      clientX: x,
      clientY: y
    })
  )

const middle = (element: Element) => {
  const rect = box(element)

  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

export const Resizing: StoryObj = {
  render: demoApp(ResizeDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const handle = await canvas.findByRole("separator", { name: "Resize navbar" })
    const nav = canvas.getByRole("navigation")
    await waitFor(() => expect(handle).toHaveAttribute("aria-valuenow", "220"))
    await expect(handle).toHaveAttribute("aria-valuemin", "150")
    await expect(handle).toHaveAttribute("aria-valuemax", "400")
    await expect(handle).toHaveAttribute("aria-orientation", "vertical")
    await expect(handle).toHaveAttribute("aria-controls", nav.id)
    const start = middle(handle)
    pointer(handle, "pointerdown", start.x, start.y)
    await waitFor(() => expect(handle).toHaveAttribute("data-active"))
    pointer(document, "pointermove", start.x + 60, start.y)
    await waitFor(() => expect(box(nav).width).toBe(280))
    await expect(nav.parentElement).toHaveAttribute("data-resizing")
    await expect(canvas.getByText("Resizing, navbar 280")).toBeVisible()
    pointer(document, "pointerup", start.x + 60, start.y)
    await expect(await canvas.findByText("Resize ended, navbar 280")).toBeVisible()
    await expect(nav.parentElement).not.toHaveAttribute("data-resizing")
    await expect(box(canvas.getByRole("main")).left - box(nav).left).toBe(280)
    const moved = middle(handle)
    pointer(handle, "pointerdown", moved.x, moved.y)
    await waitFor(() => expect(handle).toHaveAttribute("data-active"))
    pointer(document, "pointermove", moved.x - 200, moved.y)
    await expect(await canvas.findByText("navbar collapsed")).toBeVisible()
    await waitFor(() => expect(box(nav).width).toBe(150))
    await userEvent.keyboard("a")
    await userEvent.keyboard("{Escape}")
    await expect(await canvas.findByText("navbar expanded")).toBeVisible()
    await waitFor(() => expect(box(nav).width).toBe(280))
    pointer(handle, "pointerdown", moved.x, moved.y)
    await waitFor(() => expect(handle).toHaveAttribute("data-active"))
    pointer(document, "pointermove", moved.x + 10, moved.y)
    pointer(document, "pointercancel", moved.x + 10, moved.y)
    await waitFor(() => expect(handle).not.toHaveAttribute("data-active"))
    handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 2 }))
    await expect(handle).not.toHaveAttribute("data-active")
    await userEvent.dblClick(handle)
    await waitFor(() => expect(box(nav).width).toBe(220))
  }
}

export const ResizingWithKeys: StoryObj = {
  render: demoApp(ResizeDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const headerHandle = await canvas.findByRole("separator", { name: "Header height" })
    await expect(headerHandle).toHaveAttribute("aria-orientation", "horizontal")
    headerHandle.focus()
    await userEvent.keyboard("{ArrowDown}")
    await waitFor(() => expect(box(canvas.getByRole("banner")).height).toBe(60))
    await userEvent.keyboard("{Shift>}{ArrowUp}{/Shift}")
    await waitFor(() => expect(box(canvas.getByRole("banner")).height).toBe(40))
    await userEvent.keyboard("{ArrowLeft}x")
    await expect(headerHandle).toHaveAttribute("aria-valuenow", "40")
    const top = middle(headerHandle)
    pointer(headerHandle, "pointerdown", top.x, top.y)
    await waitFor(() => expect(document.body.style.cursor).toBe("row-resize"))
    pointer(document, "pointermove", top.x, top.y + 30)
    pointer(document, "pointerup", top.x, top.y + 30)
    await waitFor(() => expect(box(canvas.getByRole("banner")).height).toBe(70))
    const asideHandle = canvas.getByRole("separator", { name: "Resize aside" })
    asideHandle.focus()
    await userEvent.keyboard("{End}")
    await waitFor(() => expect(box(canvas.getByRole("complementary")).width).toBe(320))
    const footerHandle = canvas.getByRole("separator", { name: "Resize footer" })
    await expect(footerHandle).toHaveAttribute("aria-valuemin", "0")
    footerHandle.focus()
    await userEvent.keyboard("{ArrowUp}")
    await waitFor(() => expect(box(canvas.getByRole("contentinfo")).height).toBe(50))
  }
}
