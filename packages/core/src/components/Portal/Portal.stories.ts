import * as stylex from "@stylexjs/stylex"
import type { Meta, StoryObj } from "@storybook/html-vite"
import { Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { app, demoApp } from "../../stories/harness.ts"
import * as TargetDemo from "./demos/target.ts"
import * as UsageDemo from "./demos/usage.ts"
import type { Ui } from "../../Ui.ts"
import type { PortalOptions } from "./Portal.ts"

const storyStyles = stylex.create({ clip: { overflow: "hidden" } })

const meta: Meta = { title: "Miscellaneous/Portal" }

export default meta

const Model = Schema.Struct({ shown: Schema.Boolean })
type Model = typeof Model.Type

const Message = defineMessageUnion({ Toggled: {} })
type Message = typeof Message.Type

const portalStory = (
  options: PortalOptions,
  around: (h: HtmlBuilder<Message>, ui: Ui, portal: Html) => ReadonlyArray<Html>
) =>
  app<Model, Message>({
    Model,
    init: () => ({ shown: true }),
    update: (model, message) =>
      Message.match(message, {
        Toggled: () => ({ model: { ...model, shown: !model.shown } })
      }),
    view: (model, h, ui) => [
      ui.Button(h, {
        size: "xs",
        variant: "default",
        mb: "sm",
        onClick: Message.Toggled(),
        children: ["Toggle portal"]
      }),
      ...around(
        h,
        ui,
        model.shown
          ? ui.Portal(h, {
              ...options,
              children: [ui.Paper(h, { withBorder: true, p: "sm", children: ["Rendered in a portal"] })]
            })
          : h.span([], [])
      )
    ]
  })

const clipped = (h: HtmlBuilder<Message>, ui: Ui, portal: Html) => [
  ui.Paper(h, {
    withBorder: true,
    h: 40,
    p: "xs",
    styles: { root: storyStyles.clip },
    children: [ui.Text(h, { size: "sm", children: ["A clipped box holding the portal"] }), portal]
  })
]

const portalled = async (canvasElement: HTMLElement): Promise<HTMLElement> => {
  await within(canvasElement).findByRole("button", { name: "Toggle portal" })

  await waitFor(() => expect(canvasElement).not.toHaveTextContent("Rendered in a portal"))

  return within(document.body).getByText("Rendered in a portal")
}

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const content = await portalled(canvasElement)
    await expect(canvasElement.contains(content)).toBe(false)
    await expect(content.closest("#foldkit-portal-root")).not.toBeNull()
    await expect(content.closest("[data-portal]")).not.toBeNull()
  }
}

export const Target: StoryObj = {
  render: demoApp(TargetDemo),
  play: async ({ canvasElement }) => {
    const target = await within(canvasElement).findByText(/Target box/)
    await waitFor(() => expect(target).toHaveTextContent("Target box: Rendered in a portal"))
    await expect(target).toHaveAttribute("id", "portal-target")
  }
}

export const MissingTarget: StoryObj = {
  render: portalStory({ target: "#nowhere" }, clipped),
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByRole("button", { name: "Toggle portal" })
    await waitFor(() => expect(within(document.body).queryByText("Rendered in a portal")).toBeNull())
  }
}

export const Clicking: StoryObj = {
  render: portalStory({ reuseTargetNode: false }, clipped),
  play: async ({ canvasElement }) => {
    const content = await portalled(canvasElement)
    const node = content.closest("body > div[data-portal]")
    await expect(node).not.toBeNull()
    await expect(content.closest("#foldkit-portal-root")).toBeNull()
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Toggle portal" }))
    await waitFor(() => expect(within(document.body).queryByText("Rendered in a portal")).toBeNull())
    await expect(node?.isConnected).toBe(false)
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Toggle portal" }))
    await waitFor(() => expect(within(document.body).getByText("Rendered in a portal")).toBeVisible())
  }
}

export const Unmounting: StoryObj = {
  render: portalStory({}, clipped),
  play: async ({ canvasElement }) => {
    await portalled(canvasElement)
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Toggle portal" }))
    await waitFor(() => expect(within(document.body).queryByText("Rendered in a portal")).toBeNull())
    await expect(document.getElementById("foldkit-portal-root")).toBeNull()
  }
}

export const ThemedInDark: StoryObj = {
  globals: { scheme: "dark" },
  render: portalStory({}, clipped),
  play: async ({ canvasElement }) => {
    const content = await portalled(canvasElement)
    await waitFor(() => expect(getComputedStyle(content).colorScheme).toBe("dark"))
    await expect(getComputedStyle(content).backgroundColor).toBe("rgb(36, 36, 36)")
    await expect(getComputedStyle(content).fontFamily).toContain("Segoe UI")
  }
}

const togglesPortal = async ({ canvasElement }: { readonly canvasElement: HTMLElement }) => {
  await within(document.body).findByText("Rendered in a portal")
  await userEvent.click(within(canvasElement).getByRole("button", { name: "Toggle portal" }))
  await waitFor(() => expect(within(document.body).queryByText("Rendered in a portal")).toBeNull())
}

export const TogglingUsageDemo: StoryObj = { render: demoApp(UsageDemo), play: togglesPortal }

export const TogglingTargetDemo: StoryObj = { render: demoApp(TargetDemo), play: togglesPortal }
