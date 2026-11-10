import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as IconDemo from "./demos/icon.ts"
import * as StatesDemo from "./demos/states.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Feedback/Notification" }

export default meta

const css = (element: Element | null | undefined, pseudo?: string) => getComputedStyle(present(element), pseudo)

export const Usage: StoryObj = {
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const alert = await canvas.findByRole("alert")
    await expect(css(alert, "::before").backgroundColor).toBe("rgb(34, 139, 230)")
    await expect(css(alert, "::before").width).toBe("6px")
    await expect(css(alert).borderTopLeftRadius).toBe("8px")
    await expect(css(alert).paddingLeft).toBe("22px")
    await expect(css(alert).boxShadow).not.toBe("none")
    await expect(css(canvas.getByText("We notify you that")).fontWeight).toBe("600")
    const description = canvas.getByText(/You are now obligated/)
    await expect(description).toHaveAttribute("data-with-title")
    await expect(css(description).color).toBe("rgb(134, 142, 150)")
    await expect(canvas.getByRole("button", { name: "Close notification" })).toBeVisible()
  }
}

export const WithIcon: StoryObj = {
  render: demo(IconDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [bummer] = await canvas.findAllByRole("alert")
    await expect(bummer).toHaveAttribute("data-with-icon")
    await expect(css(bummer, "::before").display).toBe("none")
    const icon = present(bummer?.firstElementChild)
    await expect(css(icon).backgroundColor).toBe("rgb(250, 82, 82)")
    await expect(icon.getBoundingClientRect().width).toBe(28)
  }
}

export const States: StoryObj = {
  render: demoApp(StatesDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [found] = await canvas.findAllByRole("alert")
    const uploading = present(found)
    await expect(uploading).toHaveAttribute("data-with-border")
    await expect(css(uploading).borderTopWidth).toBe("1px")
    await expect(css(uploading).borderTopLeftRadius).toBe("2px")
    await expect(present(uploading.firstElementChild).getBoundingClientRect().width).toBe(28)
    await expect(uploading).not.toHaveTextContent("!")
    const status = present(canvas.getByText("No title and no close button").closest<HTMLElement>("[role=status]"))
    await expect(within(status).queryByRole("button")).toBeNull()
    await expect(css(canvas.getByText("No title and no close button")).color).toBe("rgb(0, 0, 0)")
    await expect(css(status, "::before").backgroundColor).toBe("rgb(190, 75, 219)")
  }
}

export const Closing: StoryObj = {
  render: demoApp(StatesDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.setup().click(await canvas.findByRole("button", { name: "Close notification" }))
    await waitFor(() => expect(canvas.getByText("Closed 1 times")).toBeVisible())
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const alert = await within(canvasElement).findByRole("alert")
    await expect(css(alert).backgroundColor).toBe("rgb(46, 46, 46)")
    await expect(css(within(alert).getByText("We notify you that")).color).toBe("rgb(255, 255, 255)")
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("We notify you that")).toBeVisible()
  }
}
