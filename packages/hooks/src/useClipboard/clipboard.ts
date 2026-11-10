import { Option } from "effect"

export type Clipboard = { readonly copied: boolean; readonly error: Option.Option<string>; readonly generation: number }

export const clipboard: Clipboard = { copied: false, error: Option.none(), generation: 0 }

export const copied = (state: Clipboard): Clipboard => ({
  copied: true,
  error: Option.none(),
  generation: state.generation + 1
})

export const copyFailed = (state: Clipboard, error: string): Clipboard => ({
  copied: false,
  error: Option.some(error),
  generation: state.generation + 1
})

export const expired = (state: Clipboard, generation: number): Clipboard =>
  generation === state.generation ? { ...state, copied: false } : state

export const resetClipboard = (state: Clipboard): Clipboard => ({ ...clipboard, generation: state.generation + 1 })
