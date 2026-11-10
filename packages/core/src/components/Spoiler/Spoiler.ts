import * as stylex from "@stylexjs/stylex"
import { Effect, Queue, Schema, Stream } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Mount from "foldkit/mount"
import type { Child } from "../../content.ts"
import { listOf, mergeStyles, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { rem } from "../../theme/units.ts"
import { Anchor } from "../Anchor/Anchor.ts"
import type { AnchorConfig } from "../Anchor/Anchor.ts"

export const Model = Schema.Struct({ id: Schema.String, expanded: Schema.Boolean, height: Schema.Finite })

export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Toggled: {}, Measured: { height: Schema.Finite } })

export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({ ExpandedChanged: { expanded: Schema.Boolean } })

export type OutMessage = typeof OutMessage.Type

export const init = (config: { readonly id: string; readonly expanded?: boolean }): Model => ({
  id: config.id,
  expanded: config.expanded ?? false,
  height: 0
})

export const update = (
  model: Model,
  message: Message
): {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessage?: OutMessage
} =>
  Message.match(message, {
    Toggled: () => ({
      model: { ...model, expanded: !model.expanded },
      commands: [],
      outMessage: OutMessage.ExpandedChanged({ expanded: !model.expanded })
    }),
    Measured: ({ height }) => ({ model: { ...model, height }, commands: [] })
  })

const MeasureContent = Mount.defineStream("MeasureSpoilerContent", {
  messages: [Message.Measured],
  execute: ({ element }) =>
    Stream.callback<typeof Message.Measured.Type>((queue) =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const observer = new ResizeObserver(() => {
            Queue.offerUnsafe(queue, Message.Measured({ height: element.getBoundingClientRect().height }))
          })
          observer.observe(element)

          return observer
        }),
        (observer) => Effect.sync(() => observer.disconnect())
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

export type SpoilerPart = "root" | "content" | "control"

export type SpoilerOptions = { readonly maxHeight?: number; readonly transitionDuration?: number }

export type SpoilerProps<M> = SpoilerOptions &
  StylesApiProps<SpoilerPart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly showLabel: Child | null
    readonly hideLabel: Child | null
    readonly showAriaLabel?: string
    readonly hideAriaLabel?: string
    readonly children: ReadonlyArray<Child>
  }

export type SpoilerConfig = ComponentConfig<SpoilerOptions, SpoilerPart>

const styles = stylex.create({
  root: { position: "relative" },
  withControl: { marginBottom: "24px" },
  content: {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    transitionProperty: "max-height",
    transitionTimingFunction: "ease"
  },
  control: { position: "absolute", insetInlineStart: 0, top: "100%", height: "24px" }
})

export const Spoiler = (config: { readonly Spoiler?: SpoilerConfig; readonly Anchor?: AnchorConfig }) => {
  const anchor = Anchor(config)

  return <M>(h: HtmlBuilder<M>, input: SpoilerProps<M>): Html => {
    const props = withDefaults(config.Spoiler, input)
    const getStyles = stylesApi<M, SpoilerPart>(h, props, config.Spoiler, "root")
    const parts = mergeStyles(["control"], config.Spoiler?.styles, props.styles)
    const { expanded, height, id } = props.model
    const maxHeight = props.maxHeight ?? 100
    const label = expanded ? props.hideLabel : props.showLabel
    const ariaLabel = expanded ? props.hideAriaLabel : props.showAriaLabel
    const regionId = `${id}-region`
    const shown = label !== null && maxHeight < height

    return h.div(
      [
        ...getStyles("root", styles.root, shown && styles.withControl),
        h.Id(id),
        ...(shown ? [h.DataAttribute("has-spoiler", "")] : [])
      ],
      [
        ...(label !== null && shown
          ? [
              anchor(h, {
                component: "button",
                onClick: props.toParentMessage(Message.Toggled()),
                styles: { root: [styles.control, ...listOf(parts.control)] },
                attributes: {
                  root: {
                    "aria-expanded": String(expanded),
                    "aria-controls": regionId,
                    ...(ariaLabel === undefined ? {} : { "aria-label": ariaLabel })
                  }
                },
                children: [label]
              })
            ]
          : []),
        h.div(
          [
            ...getStyles("content", styles.content),
            h.Style({
              maxHeight: expanded ? (height === 0 ? "none" : rem(height)) : rem(maxHeight),
              transitionDuration: `${props.transitionDuration ?? 200}ms`
            }),
            h.DataAttribute("reduce-motion", ""),
            h.Role("region"),
            h.Id(regionId)
          ],
          [h.div([h.OnMount(Mount.mapMessage(MeasureContent(), props.toParentMessage))], props.children)]
        )
      ]
    )
  }
}
