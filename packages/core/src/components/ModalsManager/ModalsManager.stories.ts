import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { demoApp } from "../../stories/harness.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Extensions/ModalsManager" }

export default meta

const page = within(document.body)

const gone = (name: string) => waitFor(() => expect(page.queryByRole("dialog", { name })).toBeNull())

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("button", { name: "Open confirm modal" })).toBeVisible()
    await expect(canvas.getByText("No events yet")).toBeVisible()
    await expect(page.queryByRole("dialog")).toBeNull()
  }
}

export const Opening: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Open content modal" }))
    await waitFor(async () => expect(await page.findByRole("dialog", { name: "Terms of service" })).toBeVisible())
    await userEvent.click(page.getByRole("button", { name: "I agree" }))
    await gone("Terms of service")
    await expect(await canvas.findByText(/ModalClosed modals-0/)).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Open confirm modal" }))
    await waitFor(async () => expect(await page.findByText("This cannot be undone.")).toBeVisible())
    await userEvent.click(page.getByRole("button", { name: "Delete account" }))
    await gone("Delete your profile")
    await expect(await canvas.findByText(/ModalConfirmed delete; ModalClosed delete/)).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Open confirm modal" }))
    await userEvent.click(await page.findByRole("button", { name: "No, keep it" }))
    await gone("Delete your profile")
    await expect(await canvas.findByText(/ModalCancelled delete; ModalClosed delete$/)).toBeVisible()
  }
}

export const Stepping: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Open context modal" }))
    await waitFor(async () => expect(await page.findByText("You are on step 1")).toBeVisible())
    await userEvent.click(page.getByRole("button", { name: "Next step" }))
    await waitFor(async () => expect(await page.findByRole("dialog", { name: "Step 2" })).toBeVisible())
    await waitFor(() => expect(page.getByText("You are on step 2")).toBeVisible())
    await userEvent.click(page.getByRole("button", { name: "Close all" }))
    await gone("Step 2")
    await userEvent.click(canvas.getByRole("button", { name: "Open plain confirm" }))
    await waitFor(async () => expect(await page.findByText("Stays open after confirming.")).toBeVisible())
    await userEvent.click(page.getByRole("button", { name: "Confirm" }))
    await expect(await canvas.findByText(/ModalConfirmed plain$/)).toBeVisible()
    await waitFor(() => expect(page.getByText("Stays open after confirming.")).toBeVisible())
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(page.queryByText("Stays open after confirming.")).toBeNull())
    await expect(await canvas.findByText(/ModalClosed plain$/)).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Open bare confirm" }))
    await waitFor(async () => expect(await page.findByRole("button", { name: "Cancel" })).toBeVisible())
    await userEvent.click(page.getByRole("button", { name: "Cancel" }))
    await expect(await canvas.findByText(/ModalCancelled bare; ModalClosed bare$/)).toBeVisible()
  }
}
