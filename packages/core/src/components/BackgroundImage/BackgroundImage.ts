import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { radiusValue } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, setStyle, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import type { BoxElement } from "../Box/Box.ts"
import { backgroundImageVars } from "./BackgroundImage.stylex.ts"

export type BackgroundImagePart = "root"

export type BackgroundImageOptions = { readonly radius?: StyleValue }

export type BackgroundImageProps = BackgroundImageOptions &
  StylesApiProps<BackgroundImagePart> & {
    readonly src: string
    readonly component?: BoxElement
    readonly children?: ReadonlyArray<Child>
  }

export type BackgroundImageConfig = ComponentConfig<BackgroundImageOptions, BackgroundImagePart>

const styles = stylex.create({
  root: {
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "block",
    width: "100%",
    borderWidth: 0,
    textDecoration: "none",
    borderRadius: backgroundImageVars.radius
  }
})

export const BackgroundImage =
  (config: { readonly BackgroundImage?: BackgroundImageConfig }) =>
  <M>(h: HtmlBuilder<M>, input: BackgroundImageProps): Html => {
    const props = withDefaults(config.BackgroundImage, input)
    const getStyles = stylesApi<M, BackgroundImagePart>(h, props, config.BackgroundImage, "root")

    return h[props.component ?? "div"](
      getStyles(
        "root",
        styles.root,
        setDefinedVars([backgroundImageVars.radius, mapDefined(props.radius, radiusValue)]),
        setStyle(["backgroundImage", `url(${JSON.stringify(props.src)})`])
      ),
      props.children ?? []
    )
  }
