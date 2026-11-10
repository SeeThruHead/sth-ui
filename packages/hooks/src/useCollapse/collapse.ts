export type CollapseOptions = {
  readonly expanded: boolean
  readonly transitionDuration?: number
  readonly transitionTimingFunction?: string
  readonly orientation?: "vertical" | "horizontal"
}

export const collapseStyle = (options: CollapseOptions): Readonly<Record<string, string>> => {
  const horizontal = options.orientation === "horizontal"
  const size = options.expanded ? "1fr" : "0fr"
  const duration = `${options.transitionDuration ?? 200}ms`

  return {
    display: "grid",
    [horizontal ? "gridTemplateColumns" : "gridTemplateRows"]: size,
    transitionProperty: `${horizontal ? "grid-template-columns" : "grid-template-rows"}, opacity`,
    transitionDuration: duration,
    transitionTimingFunction: options.transitionTimingFunction ?? "ease",
    opacity: options.expanded ? "1" : "0"
  }
}

export const collapseInnerStyle: Readonly<Record<string, string>> = {
  minHeight: "0",
  minWidth: "0",
  overflow: "hidden"
}
