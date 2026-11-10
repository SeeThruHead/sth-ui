import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { radiusValue } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { listOf, mapDefined, mergeStyles, setDefinedVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { themeColor } from "../../theme/accent.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { accent, fontSize, fontWeight, lineHeight, radius, shadow, space } from "../../theme/tokens.stylex.ts"
import { CloseButton } from "../CloseButton/CloseButton.ts"
import type { CloseButtonConfig } from "../CloseButton/CloseButton.ts"
import { Loader } from "../Loader/Loader.ts"
import type { LoaderConfig, LoaderProps } from "../Loader/Loader.ts"
import { notificationVars } from "./Notification.stylex.ts"

export type NotificationPart = "root" | "icon" | "loader" | "body" | "title" | "description" | "closeButton"

export type NotificationOptions = {
  readonly color?: string
  readonly radius?: StyleValue
  readonly withBorder?: boolean
  readonly withCloseButton?: boolean
}

export type NotificationProps<M> = NotificationOptions &
  StylesApiProps<NotificationPart> & {
    readonly title?: Child
    readonly icon?: Child
    readonly loading?: boolean
    readonly onClose?: M
    readonly closeButtonLabel?: string
    readonly loaderProps?: LoaderProps
    readonly role?: string
    readonly children?: ReadonlyArray<Child>
  }

export type NotificationConfig = ComponentConfig<NotificationOptions, NotificationPart>

const styles = stylex.create({
  root: {
    [notificationVars.radius]: radius.default,
    [notificationVars.color]: accent.filled,
    overflow: "hidden",
    boxSizing: "border-box",
    position: "relative",
    display: "flex",
    alignItems: "center",
    paddingInlineStart: "22px",
    paddingInlineEnd: space.xs,
    paddingTop: space.xs,
    paddingBottom: space.xs,
    borderRadius: notificationVars.radius,
    boxShadow: shadow.lg,
    backgroundColor: `light-dark(${palette.white}, ${palette.dark6})`,
    "::before": {
      content: "''",
      display: "block",
      position: "absolute",
      width: "6px",
      top: notificationVars.radius,
      bottom: notificationVars.radius,
      insetInlineStart: "4px",
      borderRadius: notificationVars.radius,
      backgroundColor: notificationVars.color
    }
  },
  withIcon: { "::before": { display: "none" } },
  withBorder: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: `light-dark(${palette.gray3}, ${palette.dark4})`
  },
  icon: {
    boxSizing: "border-box",
    marginInlineEnd: space.md,
    width: "28px",
    height: "28px",
    borderRadius: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: notificationVars.color,
    color: palette.white
  },
  loader: { marginInlineEnd: space.md },
  body: { flexGrow: 1, flexShrink: 1, flexBasis: 0, overflow: "hidden", marginInlineEnd: space.xs },
  title: {
    marginBottom: "2px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    fontWeight: fontWeight.medium,
    color: `light-dark(${palette.gray9}, ${palette.white})`
  },
  description: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    overflow: "hidden",
    textOverflow: "ellipsis",
    color: `light-dark(${palette.black}, ${palette.dark0})`
  },
  descriptionWithTitle: { color: `light-dark(${palette.gray6}, ${palette.dark2})` },
  closeButton: {
    backgroundColor: { default: "transparent", ":hover": `light-dark(${palette.gray0}, ${palette.dark8})` }
  }
})

export const Notification = (config: {
  readonly Notification?: NotificationConfig
  readonly CloseButton?: CloseButtonConfig
  readonly Loader?: LoaderConfig
}) => {
  const closeButton = CloseButton(config)
  const loader = Loader(config)

  return <M>(h: HtmlBuilder<M>, input: NotificationProps<M>): Html => {
    const props = withDefaults(config.Notification, input)
    const getStyles = stylesApi<M, NotificationPart>(h, props, config.Notification, "root")
    const parts = mergeStyles(["loader", "closeButton"], config.Notification?.styles, props.styles)
    const loading = props.loading === true
    const withIcon = props.icon !== undefined || loading

    return h.div(
      [
        ...getStyles(
          "root",
          styles.root,
          withIcon && styles.withIcon,
          props.withBorder === true && styles.withBorder,
          setDefinedVars(
            [notificationVars.radius, mapDefined(props.radius, radiusValue)],
            [notificationVars.color, mapDefined(props.color, themeColor)]
          )
        ),
        h.Role(props.role ?? "alert"),
        ...(withIcon ? [h.DataAttribute("with-icon", "")] : []),
        ...(props.withBorder === true ? [h.DataAttribute("with-border", "")] : [])
      ],
      [
        ...(props.icon !== undefined && !loading ? [h.div(getStyles("icon", styles.icon), [props.icon])] : []),
        ...(loading
          ? [
              loader(h, {
                size: 28,
                ...(props.color === undefined ? {} : { color: props.color }),
                ...props.loaderProps,
                styles: { root: [styles.loader, ...listOf(parts.loader)] }
              })
            ]
          : []),
        h.div(getStyles("body", styles.body), [
          ...(props.title === undefined ? [] : [h.div(getStyles("title", styles.title), [props.title])]),
          h.div(
            [
              ...getStyles("description", styles.description, props.title !== undefined && styles.descriptionWithTitle),
              ...(props.title === undefined ? [] : [h.DataAttribute("with-title", "")])
            ],
            props.children ?? []
          )
        ]),
        ...(props.withCloseButton === false
          ? []
          : [
              closeButton(h, {
                iconSize: 16,
                label: props.closeButtonLabel ?? "Close notification",
                ...(props.onClose === undefined ? {} : { onClick: props.onClose }),
                styles: { root: [styles.closeButton, ...listOf(parts.closeButton)] }
              })
            ])
      ]
    )
  }
}
