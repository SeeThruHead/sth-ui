import { Option, Predicate, Schema } from "effect"
import { Runtime } from "foldkit"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Subscriptions } from "foldkit/subscription"
import type { ThemeScope } from "../components/ThemeProvider/ThemeProvider.ts"
import { createUi } from "../Ui.ts"
import type { UiConfig } from "../Ui.ts"
import type { Ui } from "../Ui.ts"
import { valuesOf } from "./controls.ts"
import type { Configurator, Control, Values } from "./controls.ts"
import { themes } from "./themes.ts"
import type { StoryTheme } from "./themes.ts"

const Model = Schema.Struct({
  values: Schema.Record(Schema.String, Schema.String),
  events: Schema.Array(Schema.String)
})
type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Set: { key: Schema.String, value: Schema.String },
  Logged: { event: Schema.String }
})
export type Message = typeof Message.Type

export type Kit = {
  readonly h: HtmlBuilder<Message>
  readonly ui: Ui
  readonly value: (key: string, fallback?: string) => string
  readonly set: (key: string, value: string) => Message
  readonly log: (event: string) => Message
  readonly events: ReadonlyArray<string>
}

export type Globals = { readonly globals: { readonly [name: string]: unknown } }

const replaced = "sth-story-replaced"

export type StoryApp<AppModel, AppMessage extends { readonly _tag: string }> = {
  readonly Model: Schema.Codec<AppModel, unknown>
  readonly init: () => AppModel
  readonly initCommands?: () => ReadonlyArray<Command.Command<AppMessage>>
  readonly update: (
    model: AppModel,
    message: AppMessage
  ) => { readonly model: AppModel; readonly commands?: ReadonlyArray<Command.Command<AppMessage>> }
  readonly subscriptions?: Subscriptions<AppModel, AppMessage>
  readonly view: (model: AppModel, h: HtmlBuilder<AppMessage>, ui: Ui) => ReadonlyArray<Html>
}

const update = (model: Model, message: Message): { readonly model: Model } =>
  Message.match(message, {
    Set: ({ key, value }) => ({ model: { ...model, values: { ...model.values, [key]: value } } }),
    Logged: ({ event }) => ({ model: { ...model, events: [...model.events, event] } })
  })

const afterStorybookAttaches = (start: () => void): void => queueMicrotask(start)

const chosen = (globals: Globals["globals"], name: string, fallback: string): string => {
  const value = globals[name]

  return Predicate.isString(value) ? value : fallback
}

const schemeOf = (value: string): "light" | "dark" | "auto" => {
  if (value === "dark") return "dark"
  if (value === "auto") return "auto"

  return "light"
}

const stage = { padding: "16px" }

const centeredStage = { padding: "16px", display: "flex", flexDirection: "column", alignItems: "center" }

const spaciousStage = { ...centeredStage, paddingBlock: "64px" }

export type Centering = boolean | "spacious"

const stageOf = (centered: Centering) => {
  if (centered === "spacious") return spaciousStage

  return centered ? centeredStage : stage
}

export const eventsView = <AppMessage>(h: HtmlBuilder<AppMessage>, events: ReadonlyArray<string>): Html =>
  h.output(
    [h.AriaLabel("Events"), h.Style({ display: "block", marginTop: "12px", fontSize: "12px" })],
    [events.join(", ")]
  )

export const app =
  <AppModel, AppMessage extends { readonly _tag: string }>(
    build: StoryApp<AppModel, AppMessage>,
    config?: UiConfig,
    scope: ThemeScope = "document",
    centered: Centering = false
  ) =>
  (_args: unknown, context: Globals): HTMLElement => {
    document.dispatchEvent(new Event(replaced))
    const container = document.createElement("div")
    container.setAttribute("id", "sth-story")
    const theme: StoryTheme = themes[chosen(context.globals, "theme", "Mantine")] ?? { themes: [], config: {} }
    const ui = createUi(config ?? theme.config)
    const scheme = schemeOf(chosen(context.globals, "scheme", "light"))

    afterStorybookAttaches(() => {
      const handle = Runtime.embed(
        Runtime.makeElement({
          Model: build.Model,
          init: () => ({ model: build.init(), commands: build.initCommands?.() ?? [] }),
          update: build.update,
          ...(build.subscriptions === undefined ? {} : { subscriptions: build.subscriptions }),
          view: (model: AppModel, h: HtmlBuilder<AppMessage>) =>
            ui.ThemeProvider(h, {
              colorScheme: scheme,
              scope,
              themes: theme.themes,
              ...(theme.primaryColor === undefined ? {} : { primaryColor: theme.primaryColor }),
              children: [h.div([h.Style(stageOf(centered))], build.view(model, h, ui))]
            }),
          crash: {
            view: (crashed, h) =>
              h.div(
                [h.Role("alert")],
                [
                  `Story crashed: ${crashed.error.message}`,
                  h.pre([], [`${JSON.stringify(Option.getOrNull(crashed.message))}\n${String(crashed.error.cause)}`])
                ]
              )
          },
          container
        })
      )
      document.addEventListener(replaced, handle.dispose, { once: true })
    })
    return container
  }

export type StoryOptions = {
  readonly values?: { readonly [key: string]: string }
  readonly config?: UiConfig
  readonly scope?: ThemeScope
  readonly centered?: Centering
}

export const story = (view: (kit: Kit) => Html, options: StoryOptions = {}) =>
  app<Model, Message>(
    {
      Model,
      init: () => ({ values: options.values ?? {}, events: [] }),
      update,
      view: (model, h, ui) => [
        view({
          h,
          ui,
          value: (key, fallback = "") => model.values[key] ?? fallback,
          set: (key, value) => Message.Set({ key, value }),
          log: (event) => Message.Logged({ event }),
          events: model.events
        }),
        eventsView(h, model.events)
      ]
    },
    options.config,
    options.scope,
    options.centered
  )

export type DemoView = <M>(h: HtmlBuilder<M>, ui: Ui) => Html

export type DemoApp<AppModel, AppMessage extends { readonly _tag: string }> = Omit<
  StoryApp<AppModel, AppMessage>,
  "view"
> & { readonly view: (model: AppModel, h: HtmlBuilder<AppMessage>, ui: Ui) => Html }

export const demo = (view: DemoView, options: StoryOptions = {}) => story(({ h, ui }) => view(h, ui), options)

export const demoApp = <AppModel, AppMessage extends { readonly _tag: string }>(
  module: DemoApp<AppModel, AppMessage>,
  options: Pick<StoryOptions, "centered" | "config"> = {}
) =>
  app<AppModel, AppMessage>(
    { ...module, view: (model, h, ui) => [module.view(model, h, ui)] },
    options.config,
    "document",
    options.centered
  )

export type ConfiguratorDemo<Controls extends ReadonlyArray<Control>> = {
  readonly configurator: Configurator<Controls>
  readonly view: <M>(h: HtmlBuilder<M>, ui: Ui, props: Values<Controls>) => Html
}

export const configure =
  <Controls extends ReadonlyArray<Control>>(module: ConfiguratorDemo<Controls>, options: StoryOptions = {}) =>
  (args: unknown, context: Globals): HTMLElement =>
    story(({ h, ui }) => module.view(h, ui, valuesOf(module.configurator.controls, args)), options)(args, context)

export type ConfiguratorAppDemo<
  Controls extends ReadonlyArray<Control>,
  AppModel,
  AppMessage extends { readonly _tag: string }
> = Omit<StoryApp<AppModel, AppMessage>, "view"> & {
  readonly configurator: Configurator<Controls>
  readonly view: (model: AppModel, h: HtmlBuilder<AppMessage>, ui: Ui, props: Values<Controls>) => Html
}

export const configureApp =
  <Controls extends ReadonlyArray<Control>, AppModel, AppMessage extends { readonly _tag: string }>(
    module: ConfiguratorAppDemo<Controls, AppModel, AppMessage>,
    options: Pick<StoryOptions, "centered" | "config"> = {}
  ) =>
  (args: unknown, context: Globals): HTMLElement =>
    demoApp<AppModel, AppMessage>(
      { ...module, view: (model, h, ui) => module.view(model, h, ui, valuesOf(module.configurator.controls, args)) },
      options
    )(args, context)
