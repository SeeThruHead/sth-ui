import type { Html, HtmlBuilder } from "foldkit/html"

export type IconWeight = "thin" | "light" | "regular" | "bold" | "fill" | "duotone"

export type IconPath = { readonly d: string; readonly opacity?: number }

export type IconData = { readonly [Weight in IconWeight]: ReadonlyArray<IconPath> }

export type IconProps = {
  readonly size?: number | string
  readonly weight?: IconWeight
  readonly color?: string
  readonly label?: string
  readonly mirrored?: boolean
}

export type Icon = <M>(h: HtmlBuilder<M>, props?: IconProps) => Html

const sizeOf = (size: number | string | undefined): string => (size === undefined ? "1em" : String(size))

const naming = <M>(h: HtmlBuilder<M>, label: string | undefined) =>
  label === undefined ? [h.AriaHidden(true)] : [h.Role("img"), h.AriaLabel(label)]

export const icon =
  (name: string, data: IconData): Icon =>
  (h, props = {}) =>
    h.svg(
      [
        h.Attribute("viewBox", "0 0 256 256"),
        h.Attribute("width", sizeOf(props.size)),
        h.Attribute("height", sizeOf(props.size)),
        h.Attribute("fill", props.color ?? "currentColor"),
        h.DataAttribute("icon", name),
        ...naming(h, props.label),
        ...(props.mirrored === true ? [h.Attribute("transform", "scale(-1, 1)")] : [])
      ],
      data[props.weight ?? "regular"].map((path) =>
        h.path(
          [
            h.Attribute("d", path.d),
            ...(path.opacity === undefined ? [] : [h.Attribute("opacity", String(path.opacity))])
          ],
          []
        )
      )
    )
