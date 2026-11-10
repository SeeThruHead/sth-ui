export const shellNames = [
  "navbarWidth",
  "navbarOffset",
  "navbarTransform",
  "navbarPosition",
  "navbarDisplay",
  "navbarRow",
  "navbarColumn",
  "navbarHandle",
  "asideWidth",
  "asideOffset",
  "asideTransform",
  "asidePosition",
  "asideDisplay",
  "asideRow",
  "asideColumn",
  "asideHandle",
  "headerHeight",
  "headerOffset",
  "footerHeight",
  "footerOffset",
  "padding",
  "columns",
  "mainStart",
  "mainEnd"
] as const

export type ShellName = (typeof shellNames)[number]
