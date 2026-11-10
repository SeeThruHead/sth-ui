import * as stylex from "@stylexjs/stylex"
import { Effect, Option, Queue, Schema, Stream } from "effect"
import type { Cause } from "effect"
import * as Command from "foldkit/command"
import { childAttributes } from "foldkit/html"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import * as Subscription from "foldkit/subscription"
import type { Child } from "../../content.ts"
import { listOf, mapDefined, mergeStyles, setDefinedVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import type { StyleProps } from "../../styles/styleProps.ts"
import { floatingWindowVars } from "./FloatingWindow.stylex.ts"
import { Paper } from "../Paper/Paper.ts"
import type { PaperConfig } from "../Paper/Paper.ts"
import { Portal } from "../Portal/Portal.ts"
import type { PortalConfig } from "../Portal/Portal.ts"
import { keySteps, Message, placementOf } from "./model.ts"
import type { FloatingWindowDimensions, FloatingWindowPosition, FloatingWindowRules, Model } from "./model.ts"

export * from "./model.ts"

const windowOf = (id: string) => Option.fromNullishOr(document.getElementById(id))

const placement = (element: Element, config: FloatingWindowPosition, rules: FloatingWindowRules) =>
  placementOf(element.getBoundingClientRect(), { width: window.innerWidth, height: window.innerHeight }, config, rules)

const PlaceWindow = Mount.define("PlaceFloatingWindow", {
  args: {
    top: Schema.optional(Schema.Finite),
    left: Schema.optional(Schema.Finite),
    right: Schema.optional(Schema.Finite),
    bottom: Schema.optional(Schema.Finite),
    constrain: Schema.Boolean,
    offset: Schema.Finite
  },
  messages: [Message.Placed],
  execute: ({ element, viewStateChanges: _viewStateChanges, constrain, offset, ...config }) =>
    Effect.sync(() => {
      const point = placement(element, config, { constrainToViewport: constrain, constrainOffset: offset })

      return Message.Placed(point)
    })
})

export const SetPosition = Command.define("SetFloatingWindowPosition", {
  args: {
    id: Schema.String,
    top: Schema.optional(Schema.Finite),
    left: Schema.optional(Schema.Finite),
    right: Schema.optional(Schema.Finite),
    bottom: Schema.optional(Schema.Finite),
    constrain: Schema.Boolean,
    offset: Schema.Finite
  },
  messages: [Message.Positioned, Message.Unplaced],
  execute: ({ id, constrain, offset, ...config }) =>
    Effect.sync(() =>
      Option.match(windowOf(id), {
        onNone: () => Message.Unplaced(),
        onSome: (element) =>
          Message.Positioned(placement(element, config, { constrainToViewport: constrain, constrainOffset: offset }))
      })
    )
})

export const setPosition = (
  model: Model,
  position: FloatingWindowPosition,
  rules: FloatingWindowRules
): Command.Command<Message> =>
  SetPosition({
    id: model.id,
    ...position,
    constrain: rules.constrainToViewport !== false,
    offset: rules.constrainOffset ?? 0
  })

const offering =
  (queue: Queue.Queue<Message, Cause.Done>, toMessage: (event: PointerEvent) => Message) =>
  (event: PointerEvent): void => {
    Queue.offerUnsafe(queue, toMessage(event))
  }

const draggingDocument: Stream.Stream<Message> = Stream.callback<Message>((queue) =>
  Effect.acquireRelease(
    Effect.sync(() => {
      const body = document.body.style
      const moved = offering(queue, (event) => Message.MovedPointer({ x: event.clientX, y: event.clientY }))
      const released = offering(queue, () => Message.ReleasedPointer())
      body.setProperty("user-select", "none")
      document.addEventListener("pointermove", moved)
      document.addEventListener("pointerup", released)
      document.addEventListener("pointercancel", released)

      return () => {
        document.removeEventListener("pointermove", moved)
        document.removeEventListener("pointerup", released)
        document.removeEventListener("pointercancel", released)
        body.removeProperty("user-select")
      }
    }),
    (stop) => Effect.sync(stop)
  ).pipe(Effect.flatMap(() => Effect.never))
)

export const subscriptions = Subscription.make<Model, Message>()((entry) => ({
  dragPointer: entry(
    { active: Schema.Boolean },
    {
      modelToDependencies: (model) => ({ active: Option.isSome(model.gesture) }),
      dependenciesToStream: ({ active }) =>
        Stream.when(
          draggingDocument,
          Effect.sync(() => active)
        )
    }
  )
}))

const isElement = (target: EventTarget | null): target is Element => target instanceof Element

const gestureAt = (
  kind: "drag" | "resize",
  id: string,
  clientX: number,
  clientY: number
): Option.Option<typeof Message.Pressed.Type> =>
  Option.map(windowOf(id), (element) => {
    const box = element.getBoundingClientRect()

    return Message.Pressed({
      gesture: {
        kind,
        startX: clientX,
        startY: clientY,
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
      }
    })
  })

const grabs = (target: Element, handle: string | undefined, exclude: string | undefined) => {
  if (target.closest("[data-floating-window-resize]") !== null) return false
  if (exclude !== undefined && target.closest(exclude) !== null) return false

  return handle === undefined || target.closest(handle) !== null
}

export type FloatingWindowPart = "root"

export type FloatingWindowOptions = {
  readonly constrainToViewport?: boolean
  readonly constrainOffset?: number
  readonly zIndex?: number | string
  readonly withinPortal?: boolean
}

export type FloatingWindowProps<M> = FloatingWindowOptions &
  StyleProps &
  Pick<StylesApiProps<FloatingWindowPart>, "attributes" | "styles"> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly enabled?: boolean
    readonly axis?: "x" | "y"
    readonly dragHandleSelector?: string
    readonly excludeDragHandleSelector?: string
    readonly initialPosition?: FloatingWindowPosition
    readonly dimensions?: FloatingWindowDimensions
    readonly withBorder?: boolean
    readonly shadow?: string
    readonly radius?: string | number
    readonly children: ReadonlyArray<Child>
  }

export type FloatingWindowConfig = ComponentConfig<FloatingWindowOptions, FloatingWindowPart>

const styles = stylex.create({
  root: {
    position: "fixed",
    top: floatingWindowVars.top,
    left: floatingWindowVars.left,
    right: floatingWindowVars.right,
    bottom: floatingWindowVars.bottom,
    width: floatingWindowVars.width,
    height: floatingWindowVars.height,
    zIndex: floatingWindowVars.zIndex
  },
  dragging: { cursor: "grabbing" }
})

const px = (value: number | undefined) => (value === undefined ? undefined : `${value}px`)

export const FloatingWindow = (config: {
  readonly FloatingWindow?: FloatingWindowConfig
  readonly Paper?: PaperConfig
  readonly Portal?: PortalConfig
}) => {
  const paper = Paper(config)
  const portal = Portal(config)

  return <M>(h: HtmlBuilder<M>, input: FloatingWindowProps<M>): Html => {
    const props = withDefaults(config.FloatingWindow, input)
    const {
      model,
      toParentMessage,
      enabled,
      dragHandleSelector,
      excludeDragHandleSelector,
      initialPosition,
      dimensions,
      constrainToViewport,
      constrainOffset,
      zIndex,
      withinPortal,
      axis: _axis,
      children,
      attributes,
      styles: given,
      ...rest
    } = props
    const parts = mergeStyles(["root"], config.FloatingWindow?.styles, given)
    const start = initialPosition ?? {}
    const size = Option.getOrElse(model.size, () => ({
      width: dimensions?.initialWidth,
      height: dimensions?.initialHeight
    }))
    const place = Option.match(model.position, {
      onNone: () => ({ left: px(start.left), top: px(start.top), right: px(start.right), bottom: px(start.bottom) }),
      onSome: ({ x, y }) => ({ left: `${x}px`, top: `${y}px`, right: undefined, bottom: undefined })
    })
    const dragging = Option.exists(model.gesture, (gesture) => gesture.kind === "drag")
    const pressed = (button: number, x: number, y: number, target: EventTarget | null): Option.Option<M> => {
      if (enabled === false || button !== 0 || !isElement(target)) return Option.none()
      if (!grabs(target, dragHandleSelector, excludeDragHandleSelector)) return Option.none()

      return Option.map(gestureAt("drag", model.id, x, y), toParentMessage)
    }
    const root = paper(h, {
      ...rest,
      ...(attributes?.root === undefined ? {} : { attributes: { root: attributes.root } }),
      styles: {
        root: [
          styles.root,
          dragging && styles.dragging,
          setDefinedVars(
            [floatingWindowVars.top, place.top],
            [floatingWindowVars.left, place.left],
            [floatingWindowVars.right, place.right],
            [floatingWindowVars.bottom, place.bottom],
            [floatingWindowVars.width, px(size.width)],
            [floatingWindowVars.height, px(size.height)],
            [floatingWindowVars.zIndex, mapDefined(zIndex, String)]
          ),
          ...listOf(parts.root)
        ]
      },
      bind: childAttributes([
        h.Id(model.id),
        ...(dragging ? [h.DataAttribute("dragging", "")] : []),
        h.OnMount(
          Mount.mapMessage(
            PlaceWindow({
              ...start,
              constrain: constrainToViewport !== false,
              offset: constrainOffset ?? 0
            }),
            toParentMessage
          )
        ),
        h.OnPointerDown((_type, button, _screenX, _screenY, _time, x, y, _pointer, target) =>
          pressed(button, x, y, target)
        )
      ]),
      children
    })

    return withinPortal === false ? root : portal(h, { children: [root] })
  }
}

export type FloatingWindowResizeHandlePart = "root"

export type FloatingWindowResizeHandleProps<M> = StylesApiProps<FloatingWindowResizeHandlePart> & {
  readonly model: Model
  readonly toParentMessage: (message: Message) => M
  readonly dimensions?: FloatingWindowDimensions
  readonly ariaLabel?: string
  readonly children?: ReadonlyArray<Child>
}

const handleStyles = stylex.create({ root: { touchAction: "none" } })

export type FloatingWindowResizeHandleConfig = ComponentConfig<object, FloatingWindowResizeHandlePart>

export const FloatingWindowResizeHandle =
  (config: { readonly FloatingWindowResizeHandle?: FloatingWindowResizeHandleConfig }) =>
  <M>(h: HtmlBuilder<M>, input: FloatingWindowResizeHandleProps<M>): Html => {
    const props = withDefaults(config.FloatingWindowResizeHandle, input)
    const getStyles = stylesApi<M, FloatingWindowResizeHandlePart>(h, props, config.FloatingWindowResizeHandle, "root")
    const width = Option.match(props.model.size, {
      onNone: () => props.dimensions?.initialWidth,
      onSome: (size) => size.width
    })

    return h.div(
      [
        ...getStyles("root", handleStyles.root),
        h.Role("separator"),
        h.AriaLabel(props.ariaLabel ?? "Resize window"),
        h.Tabindex(0),
        h.DataAttribute("floating-window-resize", ""),
        ...(props.dimensions?.minWidth === undefined
          ? []
          : [h.Attribute("aria-valuemin", String(props.dimensions.minWidth))]),
        ...(props.dimensions?.maxWidth === undefined
          ? []
          : [h.Attribute("aria-valuemax", String(props.dimensions.maxWidth))]),
        ...(width === undefined ? [] : [h.Attribute("aria-valuenow", String(Math.round(width)))]),
        h.OnPointerDown((_type, button, _sx, _sy, _t, x, y) =>
          button === 0 ? Option.map(gestureAt("resize", props.model.id, x, y), props.toParentMessage) : Option.none()
        ),
        h.OnKeyDownPreventDefault((key) =>
          keySteps[key] === undefined
            ? Option.none()
            : Option.some(props.toParentMessage(Message.PressedResizeKey({ key })))
        )
      ],
      props.children ?? []
    )
  }
