import type { Html, HtmlBuilder } from "foldkit/html"
import { stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"

export type SpacePart = "root"

export type SpaceOptions = object

export type SpaceProps = StylesApiProps<SpacePart>

export type SpaceConfig = ComponentConfig<SpaceOptions, SpacePart>

export const Space =
  (config: { readonly Space?: SpaceConfig }) =>
  <M>(h: HtmlBuilder<M>, input: SpaceProps): Html => {
    const props = withDefaults(config.Space, input)
    const sized: SpaceProps = {
      ...props,
      ...(props.miw === undefined && props.w !== undefined ? { miw: props.w } : {}),
      ...(props.mih === undefined && props.h !== undefined ? { mih: props.h } : {})
    }

    return h.div(stylesApi<M, SpacePart>(h, sized, config.Space, "root")("root"), [])
  }
