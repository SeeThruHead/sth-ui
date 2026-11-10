import { CodeHighlight } from "./CodeHighlight/CodeHighlight.ts"
import type { CodeHighlightConfig } from "./CodeHighlight/CodeHighlight.ts"
import { CodeHighlightTabs } from "./CodeHighlight/CodeHighlightTabs.ts"
import type { CodeHighlightTabsConfig } from "./CodeHighlight/CodeHighlightTabs.ts"
import { InlineCodeHighlight } from "./CodeHighlight/InlineCodeHighlight.ts"
import type { InlineCodeHighlightConfig } from "./CodeHighlight/InlineCodeHighlight.ts"
import type { Highlighter } from "./highlighter.ts"
import { JsonViewer } from "./JsonViewer/JsonViewer.ts"
import type { JsonViewerConfig } from "./JsonViewer/JsonViewer.ts"

export type HighlightComponents = {
  readonly CodeHighlight?: CodeHighlightConfig
  readonly CodeHighlightTabs?: CodeHighlightTabsConfig
  readonly InlineCodeHighlight?: InlineCodeHighlightConfig
  readonly JsonViewer?: JsonViewerConfig
}

export type HighlightConfig = { readonly components?: HighlightComponents; readonly highlighter?: Highlighter }

export const createHighlight = (config: HighlightConfig = {}) => {
  const components = {
    ...config.components,
    ...(config.highlighter === undefined ? {} : { highlighter: config.highlighter })
  }

  return {
    CodeHighlight: CodeHighlight(components),
    CodeHighlightTabs: CodeHighlightTabs(components),
    InlineCodeHighlight: InlineCodeHighlight(components),
    JsonViewer: JsonViewer(components)
  }
}

export type Highlight = ReturnType<typeof createHighlight>

export const highlight = createHighlight()
