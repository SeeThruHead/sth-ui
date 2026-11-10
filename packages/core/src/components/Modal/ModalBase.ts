import * as stylex from "@stylexjs/stylex"
import { Effect, Option, Queue, Stream } from "effect"
import type { Cause } from "effect"
import type { Attribute, Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import type { Child } from "../../content.ts"
import { shadowValue, spacing } from "../../styles/styleProps.ts"
import { forwardPart, mapDefined, setDefinedVars } from "../../styles/StylesApi.ts"
import type { GetStyles, PartStyles, StylesApiProps, Sx } from "../../styles/StylesApi.ts"
import { colors, fontSize, fontWeight, radius, shadow, space, zIndex } from "../../theme/tokens.stylex.ts"
import { CloseButton } from "../CloseButton/CloseButton.ts"
import type { CloseButtonConfig, CloseButtonProps } from "../CloseButton/CloseButton.ts"
import { FocusTrap } from "../FocusTrap/FocusTrap.ts"
import { Overlay } from "../Overlay/Overlay.ts"
import type { OverlayConfig, OverlayProps } from "../Overlay/Overlay.ts"
import { Portal } from "../Portal/Portal.ts"
import type { PortalConfig } from "../Portal/Portal.ts"
import * as Transition from "../Transition/Transition.ts"
import type { TransitionOptions } from "../Transition/Transition.ts"
import { modalVars } from "./Modal.stylex.ts"

import { Message } from "./model.ts"
import type { Model } from "./model.ts"

export { close, init, Message, Model, open, OutMessage, update } from "./model.ts"
export type { Result } from "./model.ts"

export const titleId = (model: Model): string => `${model.id}-title`

export const bodyId = (model: Model): string => `${model.id}-body`

const stopsPropagation = (target: EventTarget | null): boolean =>
  target instanceof Element && target.getAttribute("data-sth-stop-propagation") === "true"

const escapeCloses = (event: KeyboardEvent): boolean => {
  if (event.key !== "Escape" || event.isComposing) return false

  return !stopsPropagation(event.target)
}

const isOpened = (element: Element): boolean => element.hasAttribute("data-opened")

const closesOnEscape = (element: Element): boolean => element.hasAttribute("data-close-on-escape")

const escapeListener =
  (queue: Queue.Queue<typeof Message.RequestedClose.Type, Cause.Done>, element: Element) =>
  (event: KeyboardEvent): void => {
    if (!closesOnEscape(element)) return
    if (!isOpened(element)) return
    if (!escapeCloses(event)) return
    Queue.offerUnsafe(queue, Message.RequestedClose())
  }

const lockAttribute = "data-scroll-lock"

const measuredGap = (): string => {
  const scrollbar = window.innerWidth - document.documentElement.clientWidth
  const margin = Number.parseFloat(getComputedStyle(document.body).marginRight)

  return `${scrollbar + margin}px`
}

const heldLock = (): Option.Option<Element> =>
  Option.fromNullishOr(document.head.querySelector(`style[${lockAttribute}]`))

const pageWantsLock = (): boolean => document.querySelector("[data-opened][data-lock-scroll]") !== null

const createLock = (): void => {
  const lock = document.createElement("style")
  const gap = measuredGap()
  lock.setAttribute(lockAttribute, gap)
  lock.replaceChildren(`html, body { overflow: hidden !important; } body { margin-right: ${gap} !important; }`)
  document.head.append(lock)
}

export const syncPageLock = (): void => {
  if (!pageWantsLock()) return Option.match(heldLock(), { onNone: () => undefined, onSome: (lock) => lock.remove() })
  if (Option.isNone(heldLock())) createLock()
}

const ModalLifecycle = Mount.defineStream("ModalLifecycle", {
  messages: [Message.RequestedClose],
  execute: ({ element }) =>
    Stream.callback<typeof Message.RequestedClose.Type>((queue) =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const observer = new MutationObserver(syncPageLock)
          const onKeyDown = escapeListener(queue, element)
          syncPageLock()
          observer.observe(element, { attributes: true, attributeFilter: ["data-opened", "data-lock-scroll"] })
          window.addEventListener("keydown", onKeyDown, { capture: true })

          return () => {
            observer.disconnect()
            window.removeEventListener("keydown", onKeyDown, { capture: true })
            queueMicrotask(syncPageLock)
          }
        }),
        (release) => Effect.sync(release)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

export type ModalBasePart = "root" | "inner" | "content" | "header" | "overlay" | "title" | "body" | "close"

export type ModalBaseOptions = {
  readonly radius?: string | number
  readonly padding?: string | number
  readonly shadow?: string
  readonly zIndex?: string | number
  readonly withOverlay?: boolean
  readonly withCloseButton?: boolean
  readonly closeOnClickOutside?: boolean
  readonly closeOnEscape?: boolean
  readonly trapFocus?: boolean
  readonly returnFocus?: boolean
  readonly lockScroll?: boolean
  readonly withinPortal?: boolean
  readonly keepMounted?: boolean
  readonly transitionProps?: TransitionOptions
}

export type ModalStackOptions = {
  readonly stack?: ReadonlyArray<string>
}

export type ModalFrameProps<M> = ModalBaseOptions &
  ModalStackOptions &
  StylesApiProps<ModalBasePart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
  }

export type ModalBaseProps<M> = ModalFrameProps<M> & {
  readonly title?: Child
  readonly overlayProps?: Omit<OverlayProps<M>, "onClick" | "children">
  readonly closeButtonProps?: Omit<CloseButtonProps<M>, "onClick">
  readonly children: ReadonlyArray<Child>
}

export type ModalParts<M> = {
  readonly overlay: (props?: Omit<OverlayProps<M>, "onClick" | "children">) => Html
  readonly content: (children: ReadonlyArray<Html>) => Html
  readonly header: (children: ReadonlyArray<Html>) => Html
  readonly title: (children: ReadonlyArray<Child>) => Html
  readonly closeButton: (props?: Omit<CloseButtonProps<M>, "onClick">) => Html
  readonly body: (children: ReadonlyArray<Child>) => Html
}

export const stackZIndex = (stack: ReadonlyArray<string>, id: string): string =>
  `calc(${zIndex.modal} + ${stack.indexOf(id)} + 1)`

export const stackOpened = (stack: ReadonlyArray<string>, id: string): ReadonlyArray<string> => [
  ...stack.filter((item) => item !== id),
  id
]

export const stackClosed = (stack: ReadonlyArray<string>, id: string): ReadonlyArray<string> =>
  stack.filter((item) => item !== id)

type StackState = { readonly stack: ReadonlyArray<string> | undefined; readonly current: boolean }

const stackState = (stack: ReadonlyArray<string> | undefined, id: string): StackState => ({
  stack,
  current: stack === undefined || stack.at(-1) === id
})

const trapsFocus = (model: Model, props: ModalBaseOptions, stack: StackState): boolean => {
  if (!model.isShowing) return false
  if (!stack.current) return false

  return props.trapFocus ?? true
}

const whenTrue = <A>(condition: boolean, make: () => A): ReadonlyArray<A> => {
  if (!condition) return []

  return [make()]
}

const overlayStyle = (model: Model, layout: Layout<unknown>, stack: StackState) => {
  if (!stack.current) return styles.hidden
  if (stack.stack === undefined) return Transition.transitionStyle(model, { ...layout.transition, transition: "fade" })

  return Transition.transitionStyle(model, { ...layout.transition, transition: "fade", duration: 0 })
}

const zIndexOf = (props: { readonly zIndex?: string | number }, stack: StackState, id: string) =>
  stack.stack === undefined ? mapDefined(props.zIndex, String) : stackZIndex(stack.stack, id)
export type Layout<M> = {
  readonly root: ReadonlyArray<Sx>
  readonly inner: ReadonlyArray<Sx>
  readonly content: ReadonlyArray<Sx>
  readonly header: ReadonlyArray<Sx>
  readonly attributes: ReadonlyArray<Attribute<M>>
  readonly transition: TransitionOptions
  readonly radius: string | undefined
  readonly config: { readonly styles?: PartStyles<ModalBasePart> } | undefined
}

const styles = stylex.create({
  root: {
    [modalVars.radius]: radius.default,
    [modalVars.padding]: space.md,
    [modalVars.shadow]: shadow.xl,
    [modalVars.zIndex]: zIndex.modal
  },
  inner: {
    position: "fixed",
    width: "100%",
    top: 0,
    bottom: 0,
    insetInlineStart: 0,
    zIndex: modalVars.zIndex,
    pointerEvents: "none",
    display: "flex"
  },
  trap: { display: "contents" },
  content: {
    pointerEvents: "all",
    boxShadow: modalVars.shadow,
    backgroundColor: colors.body,
    borderRadius: modalVars.radius,
    maxWidth: "100%",
    overflowY: "auto",
    outline: "none"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: modalVars.padding,
    paddingInlineEnd: `calc(${modalVars.padding} - 5px)`,
    position: "sticky",
    top: 0,
    backgroundColor: colors.body,
    zIndex: 1000,
    minHeight: "60px"
  },
  title: { lineHeight: 1, padding: 0, margin: 0, fontWeight: fontWeight.regular, fontSize: fontSize.md },
  close: { marginInlineStart: "auto" },
  body: {
    paddingInline: modalVars.padding,
    paddingBottom: modalVars.padding,
    paddingTop: { default: 0, ":only-child": modalVars.padding }
  },
  hidden: { opacity: 0, pointerEvents: "none" }
})

export type ModalBaseConfig = {
  readonly Overlay?: OverlayConfig
  readonly CloseButton?: CloseButtonConfig
  readonly Portal?: PortalConfig
}

const trapStyles = { root: styles.trap }

const trapped = <M>(h: HtmlBuilder<M>, active: boolean, returnFocus: boolean, child: Html): Html =>
  FocusTrap(h, { active, returnFocus, styles: trapStyles, children: [child] })

export const modalFrame = (config: ModalBaseConfig) => {
  const overlay = Overlay(config)
  const closeButton = CloseButton(config)
  const portal = Portal(config)

  return <M>(
    h: HtmlBuilder<M>,
    props: ModalFrameProps<M>,
    getStyles: GetStyles<M, ModalBasePart>,
    layout: Layout<M>,
    compose: (parts: ModalParts<M>) => ReadonlyArray<Html>,
    labelled: boolean
  ): Html => {
    const { model, toParentMessage } = props
    if (!Transition.isVisible(model) && props.keepMounted !== true) return h.empty
    const requestClose = toParentMessage(Message.RequestedClose())
    const stack = stackState(props.stack, model.id)
    const hidden = model.isShowing && !stack.current
    const sectionAttributes = [
      ...getStyles(
        "content",
        styles.content,
        ...layout.content,
        Transition.transitionStyle(model, layout.transition),
        hidden && styles.hidden
      ),
      ...Transition.transitionAttributes(h, model),
      ...whenTrue(hidden, () => h.DataAttribute("hidden", "")),
      h.Role("dialog"),
      h.AriaModal(true),
      h.Tabindex(-1),
      ...whenTrue(labelled, () => h.AriaLabelledBy(titleId(model))),
      h.AriaDescribedBy(bodyId(model))
    ]
    const parts: ModalParts<M> = {
      overlay: (overlayProps) =>
        overlay(h, {
          fixed: true,
          zIndex: modalVars.zIndex,
          ...overlayProps,
          ...((props.closeOnClickOutside ?? true) ? { onClick: requestClose } : {}),
          ...forwardPart(props, layout.config, "overlay", { ...overlayProps }, overlayStyle(model, layout, stack))
        }),
      header: (children) => h.header(getStyles("header", styles.header, ...layout.header), children),
      title: (children) => h.h2([...getStyles("title", styles.title), h.Id(titleId(model))], children),
      closeButton: (closeProps) =>
        h.div(getStyles("close", styles.close), [
          closeButton(h, { label: "Close", ...closeProps, onClick: requestClose })
        ]),
      body: (children) => h.div([...getStyles("body", styles.body), h.Id(bodyId(model))], children),
      content: (children) =>
        h.div(getStyles("inner", styles.inner, ...layout.inner), [
          trapped(
            h,
            trapsFocus(model, props, stack),
            props.returnFocus !== false,
            h.section(sectionAttributes, children)
          )
        ])
    }
    const root = h.div(
      [
        ...getStyles(
          "root",
          styles.root,
          ...layout.root,
          setDefinedVars(
            [modalVars.radius, layout.radius],
            [modalVars.padding, mapDefined(props.padding, spacing)],
            [modalVars.shadow, mapDefined(props.shadow, shadowValue)],
            [modalVars.zIndex, zIndexOf(props, stack, model.id)]
          )
        ),
        ...layout.attributes,
        ...(model.isShowing ? [h.DataAttribute("opened", "")] : []),
        ...((props.lockScroll ?? true) ? [h.DataAttribute("lock-scroll", "")] : []),
        ...((props.closeOnEscape ?? true) && stack.current ? [h.DataAttribute("close-on-escape", "")] : []),
        h.OnMount(Mount.mapMessage(ModalLifecycle(), toParentMessage))
      ],
      compose(parts)
    )

    return (props.withinPortal ?? true) ? portal(h, { children: [root] }) : root
  }
}

export const modalBase = (config: ModalBaseConfig) => {
  const frame = modalFrame(config)

  return <M>(
    h: HtmlBuilder<M>,
    props: ModalBaseProps<M>,
    getStyles: GetStyles<M, ModalBasePart>,
    layout: Layout<M>
  ): Html => {
    const withCloseButton = props.withCloseButton ?? true
    const hasHeader = props.title !== undefined || withCloseButton

    return frame(
      h,
      props,
      getStyles,
      layout,
      (parts) => [
        ...((props.withOverlay ?? true) ? [parts.overlay(props.overlayProps)] : []),
        parts.content([
          ...(hasHeader
            ? [
                parts.header([
                  ...(props.title === undefined ? [] : [parts.title([props.title])]),
                  ...(withCloseButton ? [parts.closeButton(props.closeButtonProps)] : [])
                ])
              ]
            : []),
          parts.body(props.children)
        ])
      ],
      props.title !== undefined
    )
  }
}
