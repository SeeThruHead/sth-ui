import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { demoApp } from "@sth-ui/core/stories/harness.ts"
import * as FieldDemo from "./demos/field.ts"
import * as ListsDemo from "./demos/lists.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Form/useForm" }

export default meta

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("textbox", { name: "Name" })).toHaveValue("")
    await expect(canvas.getByText("Not submitted")).toBeVisible()
  }
}

export const Submitting: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Submit" }))
    await expect(await canvas.findByText("3 fields need attention")).toBeVisible()
    await expect(canvas.getByText("Name must have at least 2 letters")).toBeVisible()
    await expect(canvas.getByText("Invalid email")).toBeVisible()
    await userEvent.type(canvas.getByRole("textbox", { name: "Name" }), "Ann")
    await waitFor(() => expect(canvas.queryByText("Name must have at least 2 letters")).toBeNull())
    await userEvent.type(canvas.getByRole("textbox", { name: "Email" }), "nope")
    await userEvent.tab()
    await expect(await canvas.findByText("Invalid email")).toBeVisible()
    await userEvent.clear(canvas.getByRole("textbox", { name: "Email" }))
    await userEvent.type(canvas.getByRole("textbox", { name: "Email" }), "ann@example.com")
    await userEvent.click(canvas.getByRole("checkbox", { name: "I accept the terms and conditions" }))
    await userEvent.click(canvas.getByRole("button", { name: "Submit" }))
    await expect(await canvas.findByText(/Submitted .*ann@example.com/)).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Reset" }))
    await waitFor(() => expect(canvas.getByRole("textbox", { name: "Name" })).toHaveValue(""))
  }
}

export const Lists: StoryObj = {
  render: demoApp(ListsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("textbox", { name: "Employee 1" })).toHaveValue("Ada")
    await expect(canvas.getByRole("textbox", { name: "Employee 2" })).toHaveValue("Linus")
  }
}

export const EditingLists: StoryObj = {
  render: demoApp(ListsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Move 2 up" }))
    await waitFor(() => expect(canvas.getByRole("textbox", { name: "Employee 1" })).toHaveValue("Linus"))
    await userEvent.click(canvas.getByRole("button", { name: "Add employee" }))
    await userEvent.click(canvas.getByRole("button", { name: "Save team" }))
    await expect((await canvas.findAllByText("Name is required"))[0]).toBeVisible()
    await userEvent.type(canvas.getByRole("textbox", { name: "Employee 3" }), "Grace")
    await userEvent.click(canvas.getAllByRole("switch", { name: "Active" })[2] ?? canvasElement)
    await userEvent.click(canvas.getByRole("button", { name: "Save team" }))
    await expect(await canvas.findByText(/Saved .*Grace/)).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Remove 3" }))
    await waitFor(() => expect(canvas.getAllByRole("textbox")).toHaveLength(2))
    await userEvent.click(canvas.getByRole("button", { name: "Remove 2" }))
    await waitFor(() => expect(canvas.getAllByRole("textbox")).toHaveLength(1))
    await userEvent.click(canvas.getByRole("button", { name: "Remove 1" }))
    await waitFor(() => expect(canvas.queryAllByRole("textbox")).toHaveLength(0))
    await userEvent.click(canvas.getByRole("button", { name: "Save team" }))
    await expect((await canvas.findAllByText("Add at least one employee"))[0]).toBeVisible()
  }
}

export const Field: StoryObj = {
  render: demoApp(FieldDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole("textbox", { name: "Username" })).toBeVisible()
    await expect(canvas.getByText("Unchanged")).toBeVisible()
  }
}

export const CheckingField: StoryObj = {
  render: demoApp(FieldDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(await canvas.findByRole("textbox", { name: "Username" }), "admin")
    await expect(await canvas.findByText("Changed")).toBeVisible()
    await userEvent.tab()
    await expect(await canvas.findByText("That username is taken")).toBeVisible()
    await userEvent.type(canvas.getByRole("textbox", { name: "Username" }), "2")
    await waitFor(() => expect(canvas.queryByText("That username is taken")).toBeNull())
  }
}
