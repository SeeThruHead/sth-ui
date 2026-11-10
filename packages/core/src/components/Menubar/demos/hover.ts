import { barDemo, menus } from "./bar.ts"

export { Message, Model } from "./bar.ts"

export const { init, update, view } = barDemo("hover", menus, { trigger: "hover", loop: false })
