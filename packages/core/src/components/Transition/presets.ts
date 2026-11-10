export type TransitionStyles = {
  readonly in: { readonly [property: string]: string }
  readonly out: { readonly [property: string]: string }
  readonly common?: { readonly [property: string]: string }
  readonly transitionProperty: string
}

const both = "transform, opacity"

const pop = (from: "top" | "bottom", origin: string): TransitionStyles => ({
  in: { opacity: "1", transform: "scale(1)" },
  out: { opacity: "0", transform: `scale(.9) translateY(${from === "bottom" ? 10 : -10}px)` },
  common: { transformOrigin: origin },
  transitionProperty: both
})

const moved = (out: string, origin?: string): TransitionStyles => ({
  in: { opacity: "1", transform: out.startsWith("translateX") ? "translateX(0)" : "translateY(0)" },
  out: { opacity: "0", transform: out },
  ...(origin === undefined ? {} : { common: { transformOrigin: origin } }),
  transitionProperty: origin === undefined ? "opacity, transform" : both
})

const scaled = (axis: string, origin: string): TransitionStyles => ({
  in: { opacity: "1", transform: `${axis}(1)` },
  out: { opacity: "0", transform: `${axis}(0)` },
  common: { transformOrigin: origin },
  transitionProperty: both
})

const turned = (inTransform: string, out: string, origin: string): TransitionStyles => ({
  in: { opacity: "1", transform: inTransform },
  out: { opacity: "0", transform: out },
  common: { transformOrigin: origin },
  transitionProperty: both
})

export const transitions = {
  fade: { in: { opacity: "1" }, out: { opacity: "0" }, transitionProperty: "opacity" },
  "fade-up": moved("translateY(30px)"),
  "fade-down": moved("translateY(-30px)"),
  "fade-left": moved("translateX(30px)"),
  "fade-right": moved("translateX(-30px)"),
  scale: scaled("scale", "top"),
  "scale-y": scaled("scaleY", "top"),
  "scale-x": scaled("scaleX", "left"),
  "skew-up": turned("translateY(0) skew(0deg, 0deg)", "translateY(-20px) skew(-10deg, -5deg)", "top"),
  "skew-down": turned("translateY(0) skew(0deg, 0deg)", "translateY(20px) skew(-10deg, -5deg)", "bottom"),
  "rotate-left": turned("translateY(0) rotate(0deg)", "translateY(20px) rotate(-5deg)", "bottom"),
  "rotate-right": turned("translateY(0) rotate(0deg)", "translateY(20px) rotate(5deg)", "top"),
  "slide-down": moved("translateY(-100%)", "top"),
  "slide-up": moved("translateY(100%)", "bottom"),
  "slide-left": moved("translateX(100%)", "left"),
  "slide-right": moved("translateX(-100%)", "right"),
  pop: pop("bottom", "center center"),
  "pop-bottom-left": pop("bottom", "bottom left"),
  "pop-bottom-right": pop("bottom", "bottom right"),
  "pop-top-left": pop("top", "top left"),
  "pop-top-right": pop("top", "top right")
} satisfies { readonly [name: string]: TransitionStyles }

export type TransitionName = keyof typeof transitions
