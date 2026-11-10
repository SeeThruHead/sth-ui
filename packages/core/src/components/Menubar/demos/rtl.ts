import { barDemo, menus } from "./bar.ts"

export { Message, Model } from "./bar.ts"

const entries = menus.map((menu) => (menu.label === "View" ? { ...menu, disabled: true } : menu))

export const { init, update, view } = barDemo("rtl", entries, { dir: "rtl" })
