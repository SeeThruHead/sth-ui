import { describe, expect, it } from "@effect/vitest"
import {
  highlightJsHighlighter,
  normalizeCode,
  plainTextHighlighter,
  shikiHighlighter,
  stripShikiCodeBlocks
} from "./highlighter.ts"

describe("highlighters, as Mantine's adapters", () => {
  it("leaves plain text alone", () => {
    expect(plainTextHighlighter({ code: "a < b", colorScheme: "light" })).toEqual({
      highlightedCode: "a < b",
      isHighlighted: false
    })
  })

  it("normalizes code, keeping the first line's indentation when asked", () => {
    expect(normalizeCode("\n\n  const a = 1  \n")).toBe("const a = 1")
    expect(normalizeCode("\n \n  const a = 1  \n", { withFirstLineIndentation: true })).toBe("  const a = 1")
  })

  it("runs highlight.js, falling back to plaintext for unknown languages", () => {
    const hljs = {
      getLanguage: (language: string) => (language === "ts" ? {} : undefined),
      highlight: (code: string, { language }: { readonly language: string }) => ({ value: `${language}:${code}` })
    }
    expect(highlightJsHighlighter(hljs)({ code: "x", language: "ts", colorScheme: "light" })).toEqual({
      highlightedCode: "ts:x",
      isHighlighted: true,
      codeClassName: "hljs ts"
    })
    expect(highlightJsHighlighter(hljs)({ code: "x", language: "cobol", colorScheme: "light" }).codeClassName).toBe(
      "hljs plaintext"
    )
    expect(highlightJsHighlighter(hljs)({ code: "x", colorScheme: "light" }).codeClassName).toBe("hljs plaintext")
  })

  it("strips shiki's pre and code wrappers", () => {
    expect(stripShikiCodeBlocks('<pre class="shiki" style="x"><code><span>a</span></code></pre>')).toBe(
      "<span>a</span>"
    )
    expect(stripShikiCodeBlocks("<span>a</span>")).toBe("<span>a</span>")
  })

  it("runs shiki with the theme for the scheme, and plain text for languages it has not loaded", () => {
    const shiki = {
      codeToHtml: (code: string, { lang, theme }: { readonly lang: string; readonly theme: string }) =>
        `<pre><code>${lang}|${theme}|${code}</code></pre>`,
      getLoadedLanguages: () => ["ts"]
    }
    expect(shikiHighlighter(shiki)({ code: "x", language: "ts", colorScheme: "dark" }).highlightedCode).toBe(
      "ts|github-dark|x"
    )
    expect(shikiHighlighter(shiki)({ code: "x", language: "ts", colorScheme: "light" }).highlightedCode).toBe(
      "ts|github-light|x"
    )
    expect(
      shikiHighlighter(shiki, { themes: { light: "l", dark: "d" } })({ code: "x", language: "ts", colorScheme: "nord" })
        .highlightedCode
    ).toBe("ts|nord|x")
    expect(
      shikiHighlighter(shiki, { forceColorScheme: "dark" })({ code: "x", colorScheme: "light" }).highlightedCode
    ).toBe("text|github-dark|x")
    expect(shikiHighlighter(shiki)({ code: "x", language: "rust", colorScheme: "dark" })).toEqual({
      highlightedCode: "x",
      isHighlighted: false
    })
    expect(shikiHighlighter(shiki)({ code: "x", language: "txt", colorScheme: "dark" }).isHighlighted).toBe(true)
    expect(
      shikiHighlighter({ codeToHtml: shiki.codeToHtml })({ code: "x", language: "rust", colorScheme: "dark" })
        .isHighlighted
    ).toBe(true)
  })
})
