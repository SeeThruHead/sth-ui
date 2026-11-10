export type HighlighterInput = {
  readonly code: string
  readonly language?: string
  readonly colorScheme: string
}

export type Highlighted = {
  readonly highlightedCode: string
  readonly isHighlighted: boolean
  readonly codeClassName?: string
}

export type Highlighter = (input: HighlighterInput) => Highlighted

export const plainTextHighlighter: Highlighter = ({ code }) => ({ highlightedCode: code, isHighlighted: false })

export const normalizeCode = (code: string, options: { readonly withFirstLineIndentation?: boolean } = {}): string =>
  options.withFirstLineIndentation === true ? code.replace(/^(?:[^\S\r\n]*\r?\n)+/u, "").trimEnd() : code.trim()

export type HighlightJs = {
  readonly getLanguage: (language: string) => unknown
  readonly highlight: (code: string, options: { readonly language: string }) => { readonly value: string }
}

export const highlightJsHighlighter =
  (hljs: HighlightJs): Highlighter =>
  ({ code, language }) => {
    const lang = language !== undefined && hljs.getLanguage(language) !== undefined ? language : "plaintext"

    return {
      highlightedCode: hljs.highlight(code, { language: lang }).value,
      isHighlighted: true,
      codeClassName: `hljs ${lang}`
    }
  }

const stripElement = (tag: string, html: string) => {
  const open = html.indexOf(`<${tag}`)
  if (open < 0) return html
  const close = html.indexOf(">", open)

  return `${html.slice(0, open)}${html.slice(close + 1)}`.replace(`</${tag}>`, "")
}

export const stripShikiCodeBlocks = (html: string): string => stripElement("code", stripElement("pre", html))

export type Shiki = {
  readonly codeToHtml: (code: string, options: { readonly lang: string; readonly theme: string }) => string
  readonly getLoadedLanguages?: () => ReadonlyArray<string>
}

const plainLanguages = new Set(["text", "plaintext", "txt", "plain", "ansi"])

const available = (shiki: Shiki, language: string | undefined) => {
  if (language === undefined || plainLanguages.has(language)) return true

  return shiki.getLoadedLanguages === undefined || shiki.getLoadedLanguages().includes(language)
}

export const shikiHighlighter =
  (
    shiki: Shiki,
    options: {
      readonly themes?: { readonly light: string; readonly dark: string }
      readonly forceColorScheme?: string
    } = {}
  ): Highlighter =>
  ({ code, language, colorScheme }) => {
    if (!available(shiki, language)) return plainTextHighlighter({ code, colorScheme })
    const themes = options.themes ?? { light: "github-light", dark: "github-dark" }
    const scheme = options.forceColorScheme ?? colorScheme
    const theme = scheme === "dark" ? themes.dark : scheme === "light" ? themes.light : scheme

    return {
      highlightedCode: stripShikiCodeBlocks(shiki.codeToHtml(code, { lang: language ?? "text", theme })),
      isHighlighted: true
    }
  }
