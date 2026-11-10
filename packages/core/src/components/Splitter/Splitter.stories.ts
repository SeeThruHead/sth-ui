import type { Meta, StoryObj } from "@storybook/html-vite"
import { Predicate, Schema } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Subscription from "foldkit/subscription"
import { Option } from "effect"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { initialArgs } from "../../stories/controls.ts"
import { app, configureApp, demoApp, eventsView } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as LimitsDemo from "./demos/limits.ts"
import * as RowsDemo from "./demos/rows.ts"
import * as FixedSidebarDemo from "./demos/fixed-sidebar.ts"
import type { Ui } from "../../Ui.ts"
import * as Splitter from "./Splitter.ts"
import type { InitConfig, OutMessage, SplitterProps } from "./Splitter.ts"
import { present } from "../../stories/dom.ts"

const meta: Meta = { title: "Layout/Splitter", globals: { viewport: { value: "wide", isRotated: false } } }

export default meta

const Model = Schema.Struct({ splitter: Splitter.Model, events: Schema.Array(Schema.String), hidden: Schema.Boolean })
type Model = typeof Model.Type

const Message = defineMessageUnion({
  GotSplitter: { message: Splitter.Message },
  Pressed: { action: Schema.Literals(["collapse", "expand", "toggle", "reset", "set"]) },
  Hid: {}
})
type Message = typeof Message.Type

const bodyCursor = (): string => getComputedStyle(document.body).cursor

const shown = (sizes: ReadonlyArray<Splitter.PaneSize>): string =>
  sizes.map((size) => (Predicate.isNumber(size) ? String(Math.round(size * 10) / 10) : size)).join("/")

const describe = (out: OutMessage): string =>
  Splitter.OutMessage.match(out, {
    ChangedSizes: ({ sizes }) => `sizes ${shown(sizes)}`,
    StartedResize: ({ handle }) => `started ${handle}`,
    EndedResize: ({ handle, sizes }) => `ended ${handle} at ${shown(sizes)}`,
    ChangedCollapse: ({ panel, collapsed }) => `${collapsed ? "collapsed" : "expanded"} ${panel}`
  })

const settle = (model: Model, result: Splitter.Result): { readonly model: Model } => ({
  model: { ...model, splitter: result.model, events: [...model.events, ...result.outMessages.map(describe)] }
})

const actions = {
  collapse: (splitter: Splitter.Model) => Splitter.collapse(splitter, 0),
  expand: (splitter: Splitter.Model) => Splitter.expand(splitter, 0),
  toggle: (splitter: Splitter.Model) => Splitter.toggleCollapse(splitter, 0),
  reset: (splitter: Splitter.Model) => Splitter.reset(splitter, 0),
  set: (splitter: Splitter.Model) => ({ model: Splitter.setSizes(splitter, [30, 70]), outMessages: [] })
}

type View = (
  h: HtmlBuilder<Message>,
  ui: Ui,
  props: Pick<SplitterProps<Message>, "model" | "toParentMessage">
) => ReadonlyArray<Html>

const splitterStory = (config: InitConfig, view: View, update = Splitter.update, controls = true) =>
  app<Model, Message>({
    Model,
    init: () => ({ splitter: Splitter.init(config), events: [], hidden: false }),
    update: (model, message) =>
      Message.match(message, {
        GotSplitter: ({ message: inner }) => settle(model, update(model.splitter, inner)),
        Pressed: ({ action }) => settle(model, actions[action](model.splitter)),
        Hid: () => ({ model: { ...model, hidden: true } })
      }),
    subscriptions: Subscription.lift(Splitter.subscriptions)<Model, Message>({
      read: (model) => Option.some(model.splitter),
      toParentMessage: (message) => Message.GotSplitter({ message })
    }),
    view: (model, h, ui) => [
      ...(model.hidden
        ? []
        : view(h, ui, { model: model.splitter, toParentMessage: (message) => Message.GotSplitter({ message }) })),
      ...(controls
        ? [
            ui.Button(h, { size: "xs", variant: "subtle", onClick: Message.Hid(), children: ["Hide splitter"] }),
            eventsView(h, model.events)
          ]
        : [])
    ]
  })

const pane = (ui: Ui, h: HtmlBuilder<Message>, label: string) =>
  ui.Center(h, { h: "100%", p: "md", children: [ui.Text(h, { children: [label] })] })

const box = (element: Element | null | undefined) => present(element?.getBoundingClientRect())

const two = (extra: Partial<InitConfig> = {}): InitConfig => ({
  id: "two-panes",
  panels: [{ defaultSize: 50, min: 20, max: 80, collapsible: true }, { defaultSize: 50 }],
  ...extra
})

const usage = (config: InitConfig, props: Partial<SplitterProps<Message>> = {}) =>
  splitterStory(config, (h, ui, bound) => [
    ui.Splitter(h, {
      ...bound,
      h: 220,
      maw: 600,
      bd: "1px solid gray.3",
      ...props,
      children: [pane(ui, h, "Left pane"), pane(ui, h, "Right pane")]
    })
  ])

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const handle = await canvas.findByRole("separator")
    await expect(handle).toHaveAttribute("aria-valuenow", "50")
    await expect(getComputedStyle(canvas.getByText("First pane")).backgroundColor).toBe("rgb(34, 139, 230)")
    await expect(getComputedStyle(canvas.getByText("Second pane")).color).toBe("rgb(255, 255, 255)")
    await expect(canvas.queryByRole("button", { name: "Hide splitter" })).toBeNull()
  }
}

export const Limits: StoryObj = {
  render: demoApp(LimitsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const handle = await canvas.findByRole("separator")
    await expect(handle).toHaveAttribute("aria-valuenow", "50")
    await expect(handle).toHaveAttribute("aria-valuemin", "20")
    await expect(handle).toHaveAttribute("aria-valuemax", "80")
    await expect(handle).toHaveAttribute("aria-orientation", "horizontal")
    const left = canvas.getByText("Left pane").closest("[data-orientation] > div")
    await expect(box(left).width).toBeCloseTo((600 - 2 - 2) / 2, 0)
    await expect(box(handle).width).toBe(2)
  }
}

export const Dragging: StoryObj = {
  render: usage(two()),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const handle = await canvas.findByRole("separator")
    const start = box(handle)
    await waitFor(() => expect(canvas.getByRole("separator")).toHaveAttribute("aria-valuenow", "50"))
    const user = userEvent.setup()
    await user.pointer({ keys: "[MouseLeft>]", target: handle, coords: { clientX: start.x, clientY: start.y } })
    await waitFor(() => expect(canvas.getByRole("separator")).toHaveAttribute("data-active"))
    await waitFor(() => expect(bodyCursor()).toBe("col-resize"))
    await user.pointer({ target: handle, coords: { clientX: start.x + 59.6, clientY: start.y } })
    await waitFor(() => expect(canvas.getByRole("separator")).toHaveAttribute("aria-valuenow", "60"))
    await user.pointer({
      keys: "[/MouseLeft]",
      target: canvas.getByText("Right pane"),
      coords: { clientX: start.x + 59.6, clientY: start.y }
    })
    await waitFor(() => expect(canvas.getByRole("status", { name: "Events" })).toHaveTextContent("ended 0"))
    await waitFor(() => expect(bodyCursor()).toBe("auto"))
    await expect(canvas.getByRole("separator")).not.toHaveAttribute("data-active")
    await user.pointer({ keys: "[MouseRight]", target: handle })
    await expect(canvas.getByRole("separator")).not.toHaveAttribute("data-active")
  }
}

export const Keyboard: StoryObj = {
  render: usage(two()),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const handle = await canvas.findByRole("separator")
    await userEvent.click(handle)
    const now = () => canvas.getByRole("separator").getAttribute("aria-valuenow")
    await userEvent.keyboard("{ArrowRight}")
    await waitFor(() => expect(now()).toBe("51"))
    await userEvent.keyboard("{Shift>}{ArrowRight}{/Shift}")
    await waitFor(() => expect(now()).toBe("61"))
    await userEvent.keyboard("{ArrowLeft}{ArrowUp}")
    await waitFor(() => expect(now()).toBe("60"))
    await userEvent.keyboard("{Home}")
    await waitFor(() => expect(now()).toBe("20"))
    await userEvent.keyboard("{End}{End}")
    await waitFor(() => expect(now()).toBe("80"))
    await userEvent.keyboard("{Enter}")
    await waitFor(() => expect(now()).toBe("0"))
    await expect(canvasElement.querySelector("[data-collapsed]")).toHaveTextContent("Left pane")
    await expect(canvas.getByRole("status", { name: "Events" })).toHaveTextContent("collapsed 0")
    await userEvent.dblClick(canvas.getByRole("separator"))
    await waitFor(() => expect(now()).toBe("50"))
  }
}

export const Vertical: StoryObj = {
  globals: { viewport: { value: "phone", isRotated: false } },
  render: demoApp(RowsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [first] = await canvas.findAllByRole("separator")
    await expect(first).toHaveAttribute("aria-orientation", "vertical")
    await expect(getComputedStyle(present(first?.parentElement)).flexDirection).toBe("column")
    await expect(box(first).height).toBe(2)
    await userEvent.click(present(first))
    await userEvent.keyboard("{ArrowRight}{End}")
    await waitFor(() => expect(canvas.getAllByRole("separator")[0]).toHaveAttribute("aria-valuenow", "80"))
    await expect(box(canvas.getByText("Bottom").parentElement).height).toBeCloseTo((360 - 2 - 4) * 0.1, 0)
    const user = userEvent.setup()
    const top = present(canvas.getAllByRole("separator")[0])
    const start = box(top)
    await user.pointer({ keys: "[MouseLeft>]", target: top, coords: { clientX: start.x, clientY: start.y } })
    await waitFor(() => expect(bodyCursor()).toBe("row-resize"))
    await user.pointer({ target: top, coords: { clientX: start.x, clientY: start.y - 36 } })
    await waitFor(() => expect(canvas.getAllByRole("separator")[0]).toHaveAttribute("aria-valuenow", "70"))
    await user.pointer({ keys: "[/MouseLeft]", target: top, coords: { clientX: start.x, clientY: start.y - 36 } })
  }
}

const sidebarStory = splitterStory(
  { id: "sidebar", step: "20px", panels: [{ defaultSize: "200px", min: "120px", max: "400px" }, { defaultSize: 1 }] },
  (h, ui, bound) => [
    ui.Splitter(h, {
      ...bound,
      h: 200,
      w: 600,
      lineSize: 6,
      handleColor: "blue",
      children: [pane(ui, h, "Sidebar"), pane(ui, h, "Content")]
    })
  ]
)

export const PixelSizes: StoryObj = {
  render: sidebarStory,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const handle = await canvas.findByRole("separator")
    await waitFor(() => expect(handle).toHaveAttribute("aria-valuemax", "400"))
    await expect(box(canvas.getByText("Sidebar").parentElement).width).toBe(200)
    await expect(box(handle).width).toBe(6)
    await expect(getComputedStyle(handle).backgroundColor).toBe("rgb(34, 139, 230)")
    await userEvent.click(handle)
    const sidebarWidth = () => box(canvas.getByText("Sidebar").parentElement).width
    await userEvent.keyboard("{ArrowRight}")
    await waitFor(() => expect(sidebarWidth()).toBe(220))
    await expect(canvas.getByRole("status", { name: "Events" })).toHaveTextContent("sizes 220px/")
    const user = userEvent.setup()
    const start = box(canvas.getByRole("separator"))
    await user.pointer({
      keys: "[MouseLeft>]",
      target: canvas.getByRole("separator"),
      coords: { clientX: start.x, clientY: start.y }
    })
    await waitFor(() => expect(bodyCursor()).toBe("col-resize"))
    await user.pointer({ target: canvas.getByRole("separator"), coords: { clientX: start.x + 20, clientY: start.y } })
    await waitFor(() => expect(sidebarWidth()).toBe(240))
    await user.pointer({
      keys: "[/MouseLeft]",
      target: canvas.getByRole("separator"),
      coords: { clientX: start.x + 20, clientY: start.y }
    })
  }
}

const snapByTen: Splitter.RedistributeFn = ({ sizes, handleIndex, delta }) =>
  sizes.map((size, index) => {
    const step = Math.sign(delta) * 10
    if (index === handleIndex) return size + step
    if (index === handleIndex + 1) return size - step

    return size
  })

export const CustomRedistribution: StoryObj = {
  render: splitterStory(
    {
      id: "snapping",
      dir: "rtl",
      redistribute: "nearest",
      resetOnDoubleClick: false,
      panels: [{ defaultSize: 50 }, { defaultSize: 50, collapsible: true }]
    },
    (h, ui, bound) => [
      ui.Splitter(h, {
        ...bound,
        h: 160,
        maw: 600,
        withHandle: false,
        lineSize: "4px",
        handleColor: "grape.6",
        children: [pane(ui, h, "First"), pane(ui, h, "Second")]
      })
    ],
    Splitter.updateWith({ redistribute: snapByTen })
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const handle = await canvas.findByRole("separator")
    await expect(handle.childElementCount).toBe(0)
    await userEvent.click(handle)
    await userEvent.keyboard("{ArrowLeft}")
    await waitFor(() => expect(canvas.getByRole("separator")).toHaveAttribute("aria-valuenow", "60"))
    await userEvent.keyboard("{Escape}")
    await userEvent.dblClick(canvas.getByRole("separator"))
    await expect(canvas.getByRole("separator")).toHaveAttribute("aria-valuenow", "60")
    const user = userEvent.setup()
    const start = box(handle)
    await user.pointer({
      keys: "[MouseLeft>]",
      target: canvas.getByRole("separator"),
      coords: { clientX: start.x, clientY: start.y }
    })
    await waitFor(() => expect(bodyCursor()).toBe("col-resize"))
    await user.pointer({ target: canvas.getByRole("separator"), coords: { clientX: start.x - 100, clientY: start.y } })
    await waitFor(() => expect(canvas.getByRole("separator")).toHaveAttribute("aria-valuenow", "70"))
    await user.pointer({
      keys: "[/MouseLeft]",
      target: canvas.getByRole("separator"),
      coords: { clientX: start.x - 100, clientY: start.y }
    })
    await waitFor(() => expect(canvas.getByRole("separator")).not.toHaveAttribute("data-active"))
  }
}

export const ProgrammaticControl: StoryObj = {
  render: splitterStory(two({ sizes: [40, 60] }), (h, ui, bound) => [
    ui.Group(h, {
      mb: "sm",
      children: (["collapse", "expand", "toggle", "reset", "set"] as const).map((action) =>
        ui.Button(h, { size: "xs", variant: "default", onClick: Message.Pressed({ action }), children: [action] })
      )
    }),
    ui.Splitter(h, {
      ...bound,
      h: 160,
      maw: 600,
      handleIcon: h.span([], ["⋮"]),
      styles: { thumb: undefined },
      children: [pane(ui, h, "A"), pane(ui, h, "B")]
    })
  ]),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const now = () => canvas.getByRole("separator").getAttribute("aria-valuenow")
    await expect(await canvas.findByText("⋮")).toBeVisible()
    await expect(now()).toBe("40")
    await userEvent.click(canvas.getByRole("button", { name: "collapse" }))
    await waitFor(() => expect(now()).toBe("0"))
    await userEvent.click(canvas.getByRole("button", { name: "expand" }))
    await waitFor(() => expect(now()).toBe("40"))
    await userEvent.click(canvas.getByRole("button", { name: "toggle" }))
    await waitFor(() => expect(now()).toBe("0"))
    await userEvent.click(canvas.getByRole("button", { name: "reset" }))
    await waitFor(() => expect(now()).toBe("50"))
    await userEvent.click(canvas.getByRole("button", { name: "set" }))
    await waitFor(() => expect(now()).toBe("30"))
    await userEvent.click(canvas.getByRole("button", { name: "Hide splitter" }))
    await waitFor(() => expect(canvas.queryByRole("separator")).toBeNull())
  }
}

export const Rows: StoryObj = {
  globals: { viewport: { value: "phone", isRotated: false } },
  render: demoApp(RowsDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const separators = await canvas.findAllByRole("separator")
    await expect(separators).toHaveLength(2)
    await expect(separators.map((separator) => separator.getAttribute("aria-orientation"))).toEqual([
      "vertical",
      "vertical"
    ])
    await waitFor(() => expect(box(canvas.getByText("Top").parentElement).height).toBeCloseTo((360 - 2 - 4) * 0.4, 0))
    await expect(box(canvas.getByText("Middle").parentElement).height).toBeCloseTo((360 - 2 - 4) * 0.3, 0)
  }
}

export const FixedSidebar: StoryObj = {
  render: demoApp(FixedSidebarDemo),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() => expect(canvas.getByRole("separator")).toHaveAttribute("aria-valuenow", "200"))
    await expect(box(canvas.getByText("Sidebar").parentElement).width).toBe(200)
  }
}

const dragsTheHandle = async ({ canvasElement }: { readonly canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement)
  const handle = await canvas.findByRole("separator")
  const before = handle.getAttribute("aria-valuenow")
  const start = box(handle)
  const user = userEvent.setup()
  await user.pointer({ keys: "[MouseLeft>]", target: handle, coords: { clientX: start.x, clientY: start.y } })
  await user.pointer({ target: handle, coords: { clientX: start.x + 40, clientY: start.y } })
  await waitFor(() => expect(canvas.getByRole("separator").getAttribute("aria-valuenow")).not.toBe(before))
  await user.pointer({ keys: "[/MouseLeft]", target: handle, coords: { clientX: start.x + 40, clientY: start.y } })
}

export const DraggingUsageDemo: StoryObj = { render: demoApp(UsageDemo), play: dragsTheHandle }

export const DraggingLimitsDemo: StoryObj = { render: demoApp(LimitsDemo), play: dragsTheHandle }

export const DraggingFixedSidebarDemo: StoryObj = { render: demoApp(FixedSidebarDemo), play: dragsTheHandle }

export const Configurator: StoryObj = {
  render: configureApp(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("separator")).toBeVisible()
  }
}
