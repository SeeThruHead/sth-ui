import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { radiusValue } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { forwardPart, mapDefined, setDefinedStyle, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { accentStyle } from "../../theme/accent.ts"
import { customAccent } from "../../theme/customAccent.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { staticVariants } from "../../theme/staticVariants.ts"
import type { StaticVariant } from "../../theme/staticVariants.ts"
import { accent, fontSize, fontWeight, radius, space } from "../../theme/tokens.stylex.ts"
import { CloseButton } from "../CloseButton/CloseButton.ts"
import type { CloseButtonConfig } from "../CloseButton/CloseButton.ts"

export type AlertPart = "root" | "wrapper" | "body" | "title" | "label" | "icon" | "message" | "closeButton"

export type AlertVariant = Exclude<StaticVariant, "gradient">

export type AlertOptions = {
  readonly variant?: AlertVariant
  readonly color?: string
  readonly radius?: StyleValue
  readonly autoContrast?: boolean
}

export type AlertProps<M> = AlertOptions &
  StylesApiProps<AlertPart> & {
    readonly id?: string
    readonly title?: Child
    readonly icon?: Child
    readonly withCloseButton?: boolean
    readonly onClose?: M
    readonly closeButtonLabel?: string
    readonly role?: string
    readonly children?: ReadonlyArray<Child>
  }

export type AlertConfig = ComponentConfig<AlertOptions, AlertPart>

const styles = stylex.create({
  root: {
    paddingBlock: space.md,
    paddingInline: space.md,
    borderRadius: radius.default,
    position: "relative",
    overflow: "hidden",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "transparent"
  },
  contrast: { color: accent.contrast },
  wrapper: { display: "flex" },
  body: { flexGrow: 1, flexShrink: 1, flexBasis: 0, display: "flex", flexDirection: "column", gap: space.xs },
  title: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold
  },
  titleWithClose: { paddingInlineEnd: space.md },
  label: { display: "block", overflow: "hidden", textOverflow: "ellipsis" },
  icon: {
    lineHeight: 1,
    width: "20px",
    height: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    marginInlineEnd: space.md,
    marginTop: "1px"
  },
  message: {
    textOverflow: "ellipsis",
    overflow: "hidden",
    fontSize: fontSize.sm,
    color: `light-dark(${palette.black}, ${palette.white})`
  },
  messageInherit: { color: "inherit" },
  messageWhite: { color: palette.black },
  closeButton: { width: "20px", height: "20px", color: "inherit" }
})

export const Alert = (config: { readonly Alert?: AlertConfig; readonly CloseButton?: CloseButtonConfig }) => {
  const closeButton = CloseButton(config)

  return <M>(h: HtmlBuilder<M>, input: AlertProps<M>): Html => {
    const props = withDefaults(config.Alert, input)
    const getStyles = stylesApi<M, AlertPart>(h, props, config.Alert, "root")
    const variant = props.variant ?? "light"
    const titleId = props.id === undefined || props.title === undefined ? undefined : `${props.id}-title`
    const bodyId = props.id === undefined || props.children === undefined ? undefined : `${props.id}-body`
    const withClose = props.withCloseButton === true

    return h.div(
      [
        ...getStyles(
          "root",
          styles.root,
          ...accentStyle(props.color, customAccent),
          staticVariants[variant],
          variant === "filled" && props.autoContrast === true && styles.contrast,
          setDefinedStyle(["borderRadius", mapDefined(props.radius, radiusValue)])
        ),
        h.Role(props.role ?? "alert"),
        h.DataAttribute("variant", variant),
        ...(props.id === undefined ? [] : [h.Id(props.id)]),
        ...(titleId === undefined ? [] : [h.AriaLabelledBy(titleId)]),
        ...(bodyId === undefined ? [] : [h.AriaDescribedBy(bodyId)])
      ],
      [
        h.div(getStyles("wrapper", styles.wrapper), [
          ...(props.icon === undefined ? [] : [h.div(getStyles("icon", styles.icon), [props.icon])]),
          h.div(getStyles("body", styles.body), [
            ...(props.title === undefined
              ? []
              : [
                  h.div(
                    [
                      ...getStyles("title", styles.title, withClose && styles.titleWithClose),
                      ...(withClose ? [h.DataAttribute("with-close-button", "")] : [])
                    ],
                    [
                      h.span(
                        [...getStyles("label", styles.label), ...(titleId === undefined ? [] : [h.Id(titleId)])],
                        [props.title]
                      )
                    ]
                  )
                ]),
            ...(props.children === undefined
              ? []
              : [
                  h.div(
                    [
                      ...getStyles(
                        "message",
                        styles.message,
                        variant === "filled" && styles.messageInherit,
                        variant === "white" && styles.messageWhite
                      ),
                      h.DataAttribute("variant", variant),
                      ...(bodyId === undefined ? [] : [h.Id(bodyId)])
                    ],
                    props.children
                  )
                ])
          ]),
          ...(withClose
            ? [
                closeButton(h, {
                  variant: "transparent",
                  size: 16,
                  iconSize: 16,
                  ...(props.closeButtonLabel === undefined ? {} : { label: props.closeButtonLabel }),
                  ...(props.onClose === undefined ? {} : { onClick: props.onClose }),
                  ...forwardPart(props, config.Alert, "closeButton", {}, styles.closeButton)
                })
              ]
            : [])
        ])
      ]
    )
  }
}
