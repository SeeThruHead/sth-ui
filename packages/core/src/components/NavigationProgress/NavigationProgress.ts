import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import { listOf, setStyle, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { Portal } from "../Portal/Portal.ts"
import type { PortalConfig } from "../Portal/Portal.ts"
import { Progress } from "../Progress/Progress.ts"
import type { ProgressConfig, ProgressPart } from "../Progress/Progress.ts"
import { progressVars } from "../Progress/Progress.stylex.ts"
import type { Model } from "./model.ts"

export { ClearAfter, HideAfter, init, Message, Model, nextProgress, Tick, update } from "./model.ts"

export type NavigationProgressOptions = {
  readonly color?: string
  readonly size?: number
  readonly zIndex?: number | string
  readonly withinPortal?: boolean
}

export type NavigationProgressProps = NavigationProgressOptions &
  Omit<StylesApiProps<ProgressPart>, "attributes"> & { readonly model: Model }

export type NavigationProgressConfig = ComponentConfig<NavigationProgressOptions, ProgressPart>

const styles = stylex.create({
  root: {
    position: "fixed",
    top: 0,
    insetInline: 0,
    backgroundColor: "transparent",
    transitionProperty: "opacity",
    transitionDuration: "150ms",
    transitionTimingFunction: "ease",
    transitionDelay: "50ms",
    opacity: 0,
    overflow: "visible"
  },
  mounted: { opacity: 1 },
  section: {
    position: "relative",
    transitionProperty: "width",
    transitionDuration: "150ms",
    transitionTimingFunction: "ease",
    overflow: "visible",
    "::before": {
      content: "''",
      position: "absolute",
      width: "100px",
      height: progressVars.size,
      top: 0,
      insetInlineEnd: "1px",
      transform: "rotate(4deg) translateY(-4px)",
      boxShadow: `0 0 10px ${progressVars.sectionColor}, 0 0 5px ${progressVars.sectionColor}`
    }
  }
})

export const NavigationProgress = (config: {
  readonly NavigationProgress?: NavigationProgressConfig
  readonly Progress?: ProgressConfig
  readonly Portal?: PortalConfig
}) => {
  const progress = Progress(config)
  const portal = Portal(config)

  return <M>(h: HtmlBuilder<M>, input: NavigationProgressProps): Html => {
    const props = withDefaults(config.NavigationProgress, input)
    const bar = progress<M>(h, {
      value: props.model.progress,
      size: props.size ?? 3,
      radius: 0,
      ...(props.color === undefined ? {} : { color: props.color }),
      styles: {
        root: [
          styles.root,
          props.model.mounted && styles.mounted,
          setStyle(["zIndex", String(props.zIndex ?? 9999)]),
          ...listOf(props.styles?.root)
        ],
        section: [styles.section, ...listOf(props.styles?.section)]
      },
      attributes: { root: props.model.mounted ? { "data-mounted": "" } : {} }
    })

    return props.withinPortal === false ? bar : portal(h, { children: [bar] })
  }
}
