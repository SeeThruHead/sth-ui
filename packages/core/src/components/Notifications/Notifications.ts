import * as stylex from "@stylexjs/stylex"
import { Option } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import type { Child } from "../../content.ts"
import { rem } from "../../theme/units.ts"
import { setDefinedVars, setStyle, setVars, stylesApi, sx, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { space } from "../../theme/tokens.stylex.ts"
import type { CloseButtonConfig } from "../CloseButton/CloseButton.ts"
import type { LoaderConfig } from "../Loader/Loader.ts"
import { Notification } from "../Notification/Notification.ts"
import type { NotificationConfig } from "../Notification/Notification.ts"
import { Portal } from "../Portal/Portal.ts"
import type { PortalConfig } from "../Portal/Portal.ts"
import { transitionAttributes } from "../Transition/Transition.ts"
import { WatchGesture, WatchOutside } from "./gesture.ts"
import { expanded, Message, renderedEntries } from "./model.ts"
import type { Entry, Model, NotificationsContext } from "./model.ts"
import { notificationVars } from "../Notification/Notification.stylex.ts"
import { notificationsVars } from "./Notifications.stylex.ts"
import {
  autoCloseOf,
  collapsedTransform,
  expandedOffsets,
  grouped,
  positions,
  stackOrder,
  stateTransform,
  swipeOpacity
} from "./queue.ts"
import type { NotificationPosition } from "./queue.ts"

export type NotificationsPart = "root" | "notification" | "progress"

export type NotificationsOptions = NotificationsContext & {
  readonly allowDragDismiss?: boolean
  readonly allowScrollDismiss?: boolean
  readonly containerWidth?: number | string
  readonly notificationMaxHeight?: number | string
  readonly zIndex?: number | string
  readonly withinPortal?: boolean
  readonly layout?: "default" | "stacked"
  readonly withAutoCloseProgress?: boolean
}

export type NotificationsProps<M> = NotificationsOptions &
  StylesApiProps<NotificationsPart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly icons?: Readonly<Record<string, Child>>
    readonly renderNotification?: (h: HtmlBuilder<M>, entry: Entry, close: M) => Child
  }

export type NotificationsConfig = ComponentConfig<NotificationsOptions, NotificationsPart>

const progress = stylex.keyframes({ from: { transform: "scaleX(0)" }, to: { transform: "scaleX(1)" } })

const progressFade = stylex.keyframes({ from: { opacity: 0 } })

const styles = stylex.create({
  root: {
    width: `calc(100% - ${space.md} * 2)`,
    position: "fixed",
    zIndex: notificationsVars.zIndex,
    maxWidth: notificationsVars.containerWidth
  },
  "top-center": { top: space.md, left: "50%", transform: "translateX(-50%)" },
  "top-left": { top: space.md, left: space.md },
  "top-right": { top: space.md, right: space.md },
  "bottom-center": { bottom: space.md, left: "50%", transform: "translateX(-50%)" },
  "bottom-left": { bottom: space.md, left: space.md },
  "bottom-right": { bottom: space.md, right: space.md },
  stack: { display: "grid" },
  notification: { position: "relative", cursor: "default", touchAction: "pan-y" },
  spaced: { marginTop: space.md },
  progress: {
    position: "absolute",
    bottom: 0,
    insetInlineStart: 0,
    width: "100%",
    height: "3px",
    backgroundColor: notificationVars.color,
    transform: "scaleX(0)",
    transformOrigin: { default: "left center", ":dir(rtl)": "right center" },
    transitionProperty: "opacity",
    transitionDuration: "200ms",
    animationName: `${progress}, ${progressFade}`,
    animationDuration: `${notificationsVars.progressDuration}, 200ms`,
    animationTimingFunction: "linear, ease",
    animationFillMode: "forwards, none"
  },
  paused: { opacity: 0, animationPlayState: "paused, running" }
})

const sizeOf = (value: number | string | undefined, fallback: string) =>
  value === undefined ? fallback : typeof value === "number" ? rem(value) : value

const closed = (entry: Entry) =>
  entry.transition.transitionState === "EnterStart" || entry.transition.transitionState === "LeaveAnimating"

const exiting = (entry: Entry) => entry.closing

const ease = "cubic-bezier(.51,.3,0,1.21)"

type Placement = {
  readonly position: NotificationPosition
  readonly index: number
  readonly size: number
  readonly expanded: boolean
  readonly expandedOffset: number
}

const swipe = (entry: Entry) => `translate3d(${entry.offset}px, 0, 0)`

const stackedTransform = (entry: Entry, place: Placement) => {
  const state = stateTransform(place.position, !closed(entry))
  if (exiting(entry)) {
    const exit = place.expanded
      ? `translateY(${place.expandedOffset}px)`
      : collapsedTransform(place.index, place.position)

    return `${exit} ${state} ${swipe(entry)}`
  }
  if (place.expanded) return `translateY(${place.expandedOffset}px) ${swipe(entry)}`
  if (place.index > 0) return collapsedTransform(place.index, place.position)

  return `${state} ${swipe(entry)}`
}

const opacityOf = (entry: Entry) => (closed(entry) ? 0 : 1) * swipeOpacity(entry.offset, entry.dismissed)

export const Notifications = (config: {
  readonly Notifications?: NotificationsConfig
  readonly Notification?: NotificationConfig
  readonly CloseButton?: CloseButtonConfig
  readonly Loader?: LoaderConfig
  readonly Portal?: PortalConfig
}) => {
  const notification = Notification(config)
  const portal = Portal(config)

  return <M>(h: HtmlBuilder<M>, input: NotificationsProps<M>): Html => {
    const props = withDefaults(config.Notifications, input)
    const getStyles = stylesApi<M, NotificationsPart>(h, props, config.Notifications, "root")
    const send = props.toParentMessage
    const layout = props.layout ?? "default"
    const stacked = layout === "stacked"
    const duration = props.transitionDuration ?? 250
    const defaultPosition = props.position ?? "bottom-right"
    const groups = grouped(renderedEntries(props.model, props), defaultPosition)
    const maxHeight = sizeOf(props.notificationMaxHeight, "200px")

    const defaultStyle = (entry: Entry, position: NotificationPosition) =>
      setStyle(
        ["opacity", String(opacityOf(entry))],
        ["maxHeight", entry.transition.transitionState === "LeaveAnimating" ? "0px" : maxHeight],
        ["transform", `${stateTransform(position, !closed(entry))} ${swipe(entry)}`],
        ["transitionProperty", "opacity, transform, max-height"],
        ["transitionDuration", entry.dragging ? "0ms, 0ms, 0ms" : `${duration}ms, ${duration}ms, ${duration}ms`],
        ["transitionTimingFunction", `${ease}, ${ease}, linear`]
      )

    const stackedStyle = (entry: Entry, place: Placement) =>
      setStyle(
        ["opacity", String(opacityOf(entry))],
        ["transform", stackedTransform(entry, place)],
        ["gridArea", "1 / 1"],
        ["zIndex", String(place.size - place.index)],
        ["pointerEvents", !place.expanded && place.index > 0 ? "none" : "auto"],
        ["alignSelf", place.position.startsWith("top") ? "start" : "end"],
        ["transitionProperty", entry.dragging ? "none" : "transform, opacity"],
        ["transitionDuration", `${duration}ms, ${duration}ms`],
        ["transitionTimingFunction", `${ease}, ease`],
        ["transitionDelay", entry.dragging || exiting(entry) ? "0ms" : `${place.index * 30}ms`]
      )

    const progressBar = (entry: Entry): ReadonlyArray<Child> => {
      const millis = autoCloseOf(props.autoClose === undefined ? 4000 : props.autoClose, entry.autoClose)
      if (typeof millis !== "number") return []
      if ((entry.withAutoCloseProgress ?? props.withAutoCloseProgress) !== true) return []

      return [
        h.keyed("div")(
          `${entry.id}-progress-${entry.timer}`,
          [
            ...getStyles(
              "progress",
              styles.progress,
              !entry.running && styles.paused,
              setVars([notificationsVars.progressDuration, `${millis}ms`])
            ),
            h.AriaHidden(true),
            ...(entry.running ? [] : [h.DataAttribute("paused", "")])
          ],
          []
        )
      ]
    }

    const body = (entry: Entry, close: M): Child => {
      if (props.renderNotification !== undefined) return props.renderNotification(h, entry, close)
      const icon = Option.flatMap(Option.fromNullishOr(entry.icon), (key) => Option.fromNullishOr(props.icons?.[key]))

      return notification(h, {
        ...(entry.title === undefined ? {} : { title: entry.title }),
        ...(entry.color === undefined ? {} : { color: entry.color }),
        ...(entry.radius === undefined ? {} : { radius: entry.radius }),
        ...(entry.withBorder === undefined ? {} : { withBorder: entry.withBorder }),
        ...(entry.loading === undefined ? {} : { loading: entry.loading }),
        ...Option.match(icon, { onNone: () => ({}), onSome: (child) => ({ icon: child }) }),
        withCloseButton: entry.allowClose === false ? false : (entry.withCloseButton ?? true),
        onClose: close,
        children: [entry.message, ...progressBar(entry)]
      })
    }

    const item = (entry: Entry, place: Placement, first: boolean): Html => {
      const close = send(Message.Hid({ id: entry.id }))
      const closable = entry.allowClose !== false

      return h.keyed("div")(
        entry.id,
        [
          ...transitionAttributes(h, entry.transition),
          ...getStyles(
            "notification",
            styles.notification,
            !stacked && !first && styles.spaced,
            stacked ? stackedStyle(entry, place) : defaultStyle(entry, place.position)
          ),
          h.DataAttribute("position", place.position),
          ...(entry.dismissed ? [h.DataAttribute("dismissed", "")] : []),
          h.OnMouseEnter(send(Message.HoverStarted({ id: entry.id }))),
          h.OnMouseLeave(send(Message.HoverEnded({ id: entry.id }))),
          ...(stacked
            ? [
                h.OnFocusEnter(send(Message.HoverStarted({ id: entry.id }))),
                h.OnFocusLeave(send(Message.HoverEnded({ id: entry.id }))),
                h.OnPointerDown((pointerType) =>
                  pointerType === "mouse"
                    ? Option.none()
                    : Option.some(send(Message.Pinned({ position: Option.some(place.position) })))
                )
              ]
            : []),
          h.OnMount(
            Mount.mapMessage(
              WatchGesture({
                id: entry.id,
                drag: closable && (props.allowDragDismiss ?? true) && !entry.dismissed,
                scroll: closable && (props.allowScrollDismiss ?? true) && !entry.dismissed
              }),
              send
            )
          )
        ],
        [body(entry, close)]
      )
    }

    const group = (position: NotificationPosition): Html => {
      const entries = stacked ? stackOrder(groups[position]) : groups[position]
      const open = stacked && expanded(props.model, position, props)
      const offsets = open
        ? expandedOffsets(
            entries.map((entry) => Option.getOrUndefined(entry.height)),
            position
          )
        : []
      const pinned = Option.contains(props.model.pinned, position)

      return h.div(
        [
          ...getStyles(
            "root",
            styles.root,
            styles[position],
            setDefinedVars(
              [notificationsVars.zIndex, props.zIndex === undefined ? undefined : String(props.zIndex)],
              [notificationsVars.containerWidth, sizeOf(props.containerWidth, "440px")]
            )
          ),
          h.DataAttribute("position", position),
          h.DataAttribute("layout", layout)
        ],
        [
          h.div(
            [
              ...(stacked
                ? [
                    ...sx(h, styles.stack),
                    h.OnMouseEnter(send(Message.GroupHovered({ position, hovered: true }))),
                    h.OnMouseLeave(send(Message.GroupHovered({ position, hovered: false })))
                  ]
                : []),
              ...(pinned ? [h.DataAttribute("pinned", "")] : []),
              h.OnMount(Mount.mapMessage(WatchOutside(), send))
            ],
            entries.map((entry, index) =>
              item(
                entry,
                { position, index, size: entries.length, expanded: open, expandedOffset: offsets[index] ?? 0 },
                index === 0
              )
            )
          )
        ]
      )
    }

    const roots = positions.map(group)

    return (props.withinPortal ?? true) ? portal(h, { children: roots }) : h.div([], roots)
  }
}
