import { used } from "../../Database.ts"
export const shell = (h: { readonly div: (attributes: unknown, children: unknown) => unknown }) => [used, h.div([], [])]
