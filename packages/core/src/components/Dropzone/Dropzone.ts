import * as stylex from "@stylexjs/stylex"
import { Option } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import type { Child } from "../../content.ts"
import { radiusValue } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, setStyle, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, PartStyles, StylesApiProps, Sx } from "../../styles/StylesApi.ts"
import { accentStyle } from "../../theme/accent.ts"
import { customAccent } from "../../theme/customAccent.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { accent, colors, radius, space } from "../../theme/tokens.stylex.ts"
import { shared } from "../../styles/shared.ts"
import type { LoaderConfig, LoaderProps } from "../Loader/Loader.ts"
import { LoadingOverlay } from "../LoadingOverlay/LoadingOverlay.ts"
import type { LoadingOverlayConfig } from "../LoadingOverlay/LoadingOverlay.ts"
import type { OverlayConfig } from "../Overlay/Overlay.ts"
import { Portal } from "../Portal/Portal.ts"
import type { PortalConfig } from "../Portal/Portal.ts"
import { WatchDrop, WatchWindowDrag } from "./drag.ts"
import { Message, openDialog } from "./model.ts"
import type { DropzoneContext, Model } from "./model.ts"
import { dropzoneVars } from "./Dropzone.stylex.ts"

export type DropzonePart = "root" | "inner"

export type DropzoneFullScreenPart = "fullScreen" | "root" | "inner"

export type DropzoneOptions = {
  readonly acceptColor?: string
  readonly rejectColor?: string
  readonly radius?: StyleValue
  readonly variant?: "light" | "filled"
  readonly activateOnClick?: boolean
  readonly activateOnDrag?: boolean
  readonly activateOnKeyboard?: boolean
  readonly dragEventsBubbling?: boolean
  readonly enablePointerEvents?: boolean
}

export type DropzoneProps<M> = DropzoneOptions &
  DropzoneContext &
  StylesApiProps<DropzonePart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly loaderProps?: LoaderProps
    readonly children?: ReadonlyArray<Child>
  }

export type DropzoneConfig = ComponentConfig<DropzoneOptions, DropzonePart>

export type DropzoneFullScreenConfig = ComponentConfig<DropzoneOptions, DropzoneFullScreenPart>

export type DropzoneFullScreenProps<M> = Omit<DropzoneProps<M>, "styles"> &
  StylesApiProps<DropzoneFullScreenPart> & {
    readonly active?: boolean
    readonly zIndex?: number | string
    readonly withinPortal?: boolean
  }

export type DropzoneStatusProps = { readonly model: Model; readonly children: ReadonlyArray<Child> }

const styles = stylex.create({
  root: {
    [dropzoneVars.radius]: radius.default,
    position: "relative",
    borderWidth: "1px",
    borderStyle: "dashed",
    borderColor: `light-dark(${palette.gray4}, ${palette.dark4})`,
    color: colors.text,
    padding: space.md,
    borderRadius: dropzoneVars.radius,
    cursor: "pointer",
    userSelect: "none",
    backgroundColor: `light-dark(${palette.white}, ${palette.dark6})`,
    transitionProperty: "background-color, border-color",
    transitionDuration: "100ms",
    transitionTimingFunction: "ease"
  },
  clickable: {
    backgroundColor: {
      default: `light-dark(${palette.white}, ${palette.dark6})`,
      ":hover": `light-dark(${palette.gray0}, ${palette.dark5})`
    }
  },
  still: { cursor: "default" },
  lightStatus: { backgroundColor: accent.light, borderColor: accent.light, color: accent.lightColor },
  filledStatus: { backgroundColor: accent.filled, borderColor: accent.filled, color: palette.white },
  inner: { pointerEvents: "none", userSelect: "none" },
  pointerEvents: { pointerEvents: "all" },
  fullScreen: {
    position: "fixed",
    inset: 0,
    backgroundColor: colors.body,
    display: "flex",
    flexDirection: "column",
    padding: space.xs,
    transitionProperty: "opacity",
    transitionDuration: "100ms",
    transitionTimingFunction: "ease"
  },
  fullScreenDropzone: { flexGrow: 1, flexShrink: 1, flexBasis: 0 }
})

const keyOpens = (key: string) => key === "Enter" || key === " "

type Configs = {
  readonly Dropzone?: DropzoneConfig
  readonly DropzoneFullScreen?: DropzoneFullScreenConfig
  readonly LoadingOverlay?: LoadingOverlayConfig
  readonly Loader?: LoaderConfig
  readonly Overlay?: OverlayConfig
  readonly Portal?: PortalConfig
}

const dropzone = (config: Configs) => {
  const loadingOverlay = LoadingOverlay(config)

  return <M>(h: HtmlBuilder<M>, input: DropzoneProps<M>, extra: ReadonlyArray<Sx> = []): Html => {
    const props = withDefaults(config.Dropzone, input)
    const getStyles = stylesApi<M, DropzonePart>(h, props, config.Dropzone, "root")
    const send = props.toParentMessage
    const status = props.model.status
    const inactive = props.disabled === true || props.loading === true
    const clickable = (props.activateOnClick ?? true) && !inactive
    const keyboard = (props.activateOnKeyboard ?? true) && !inactive
    const statusColor = status === "accept" ? props.acceptColor : (props.rejectColor ?? "red")
    const statusStyle = props.variant === "filled" ? styles.filledStatus : styles.lightStatus

    const dragging = props.activateOnDrag ?? true

    return h.keyed("div")(
      `${props.model.id}-${dragging ? "drag" : "still"}`,
      [
        ...getStyles(
          "root",
          ...(status === "idle" ? [] : accentStyle(statusColor, customAccent)),
          styles.root,
          clickable ? styles.clickable : styles.still,
          status === "idle" ? null : statusStyle,
          shared.focusRing,
          setDefinedVars([dropzoneVars.radius, mapDefined(props.radius, radiusValue)]),
          ...extra
        ),
        h.Role("button"),
        ...(keyboard ? [h.Tabindex(0)] : []),
        ...(inactive ? [h.AriaDisabled(true)] : []),
        h.DataAttribute(status, ""),
        ...(props.disabled === true ? [h.DataAttribute("disabled", "")] : []),
        ...(props.loading === true ? [h.DataAttribute("loading", "")] : []),
        ...((props.activateOnClick ?? true) ? [h.DataAttribute("activate-on-click", "")] : []),
        ...(clickable ? [h.OnClick(send(openDialog()))] : []),
        ...(keyboard
          ? [h.OnKeyDownPreventDefault((key) => (keyOpens(key) ? Option.some(send(openDialog())) : Option.none()))]
          : []),
        ...(dragging
          ? [h.OnMount(Mount.mapMessage(WatchDrop({ bubbling: props.dragEventsBubbling ?? true }), send))]
          : [])
      ],
      [
        loadingOverlay(h, {
          visible: props.loading === true,
          ...(props.loaderProps === undefined ? {} : { loaderProps: props.loaderProps }),
          ...(props.radius === undefined ? {} : { overlayProps: { radius: props.radius } })
        }),
        h.div(
          [
            ...getStyles("inner", styles.inner, props.enablePointerEvents === true && styles.pointerEvents),
            ...(props.enablePointerEvents === true ? [h.DataAttribute("enable-pointer-events", "")] : [])
          ],
          props.children ?? []
        )
      ]
    )
  }
}

export const Dropzone = (config: Configs) => dropzone(config)

const status =
  (wanted: Model["status"]) =>
  <M>(h: HtmlBuilder<M>, props: DropzoneStatusProps): Html =>
    props.model.status === wanted ? h.span([], props.children) : h.empty

export const DropzoneAccept = status("accept")

export const DropzoneReject = status("reject")

export const DropzoneIdle = status("idle")

export const DropzoneFullScreen = (config: Configs) => {
  const portal = Portal(config)
  const inner = dropzone(config)

  return <M>(h: HtmlBuilder<M>, input: DropzoneFullScreenProps<M>): Html => {
    const props = withDefaults(config.DropzoneFullScreen, input)
    const getStyles = stylesApi<M, DropzoneFullScreenPart>(h, props, config.DropzoneFullScreen, "fullScreen")
    const visible = props.model.windowDrag
    const { active: _active, zIndex: _zIndex, withinPortal: _withinPortal, styles: _styles, ...rest } = props
    const active = props.active ?? true
    const root = h.keyed("div")(
      `${props.model.id}-${active ? "active" : "inactive"}`,
      [
        ...getStyles(
          "fullScreen",
          styles.fullScreen,
          setStyle(
            ["opacity", visible ? "1" : "0"],
            ["pointerEvents", visible ? "all" : "none"],
            ["zIndex", String(props.zIndex ?? 9999)]
          )
        ),
        ...(active ? [h.OnMount(Mount.mapMessage(WatchWindowDrag(), props.toParentMessage))] : [])
      ],
      [
        inner(
          h,
          {
            activateOnClick: false,
            ...rest,
            styles: dropzoneStyles(props.styles)
          },
          [styles.fullScreenDropzone]
        )
      ]
    )

    return (props.withinPortal ?? true) ? portal(h, { children: [root] }) : root
  }
}

const dropzoneStyles = (parts: PartStyles<DropzoneFullScreenPart> | undefined): PartStyles<DropzonePart> => ({
  ...(parts?.root === undefined ? {} : { root: parts.root }),
  ...(parts?.inner === undefined ? {} : { inner: parts.inner })
})
