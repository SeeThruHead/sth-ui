import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { initialArgs } from "@sth-ui/core/stories/controls.ts"
import { configureApp, demoApp } from "@sth-ui/core/stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Dates/DateTimePicker" }

export default meta

const page = within(document.body)

const hidden = (canvasElement: HTMLElement, name: string) =>
  present(canvasElement.querySelector<HTMLInputElement>(`input[name='${name}']`)).value

const values = (canvasElement: HTMLElement) => present(within(canvasElement).getByText(/single=/).textContent)

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("button", { name: "Pick date and time" })).toHaveTextContent(
      "14/05/2024 10:30"
    )
    await expect(hidden(canvasElement, "when")).toBe("2024-05-14 10:30:00")
    await expect(canvas.getByRole("button", { name: "Pick a range" })).toHaveTextContent("")
    await expect(getComputedStyle(canvas.getByRole("button", { name: "Pick a range" })).fontWeight).toBe("700")
    await expect(hidden(canvasElement, "span")).toBe("")
    await expect(canvas.getByRole("button", { name: "Read only" })).toHaveTextContent("01/05/2024 08:00:00")
    await expect(canvas.getAllByRole("button", { name: "Clear" })).toHaveLength(1)
  }
}

export const Picking: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole("button", { name: "Pick date and time" })
    await userEvent.click(input)
    await userEvent.click(await page.findByRole("button", { name: "20 May 2024" }))
    await waitFor(() => expect(input).toHaveTextContent("20/05/2024 10:30"))
    await waitFor(() => expect(present(document.activeElement).id).toBe("single-inline-start-hours"))
    await userEvent.keyboard("23{Enter}")
    await waitFor(() => expect(page.queryByRole("button", { name: "20 May 2024" })).toBeNull())
    await waitFor(() => expect(values(canvasElement)).toContain("single=2024-05-20 23:30:00"))
    await userEvent.click(input)
    await userEvent.click(await page.findByRole("button", { name: "28 May 2024" }))
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(values(canvasElement)).toContain("single=2024-05-28 18:00:00"))
    await userEvent.click(canvas.getAllByRole("button", { name: "Clear" })[0] ?? canvasElement)
    await waitFor(() => expect(input).toHaveTextContent("Pick date and time"))
  }
}

export const PickingARange: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = await canvas.findByRole("button", { name: "Pick a range" })
    await userEvent.click(input)
    await userEvent.click(await page.findByRole("button", { name: "10 May 2024" }))
    await waitFor(() => expect(input).toHaveTextContent("10 May 09:00:00 – ..."))
    await expect(hidden(canvasElement, "span")).toBe("2024-05-10 09:00:00 –")
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(input.textContent).toBe(""))
    await userEvent.click(input)
    await userEvent.click(await page.findByRole("button", { name: "10 May 2024" }))
    await userEvent.click(page.getByRole("button", { name: "12 May 2024" }))
    await waitFor(() => expect(input).toHaveTextContent("10 May 09:00:00 – 12 May 09:00:00"))
    await expect(hidden(canvasElement, "span")).toBe("2024-05-10 09:00:00 – 2024-05-12 09:00:00")
    await userEvent.click(page.getByRole("button", { name: "Submit" }))
    await waitFor(() => expect(page.queryByRole("button", { name: "12 May 2024" })).toBeNull())
    await userEvent.click(canvas.getByRole("button", { name: "Read only" }))
    await expect(page.queryByRole("button", { name: "1 May 2024" })).toBeNull()
  }
}

export const Configurator: StoryObj = {
  render: configureApp(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Input label")).toBeVisible()
    await expect(canvas.getByText("Input description")).toBeVisible()
  }
}
