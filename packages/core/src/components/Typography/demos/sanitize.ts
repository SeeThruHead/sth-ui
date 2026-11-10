import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

const html = `
<section><p onclick="alert(1)" style="color: red">A paragraph inside a section keeps its text, not its handlers or styles.</p></section>
<!-- a comment is dropped -->
<script>window.injected = true</script>
<style>p { color: red }</style>
<p><a href="javascript:alert(1)">A script link</a>, <a href="data:text/html,hi">a data link</a> and
<a href="https://mantine.dev" title="Mantine">a real link</a>.</p>
<p>Line one<br />line two</p>
`

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html => ui.Typography(h, { maw: 700, html })
