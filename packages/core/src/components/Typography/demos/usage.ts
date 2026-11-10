import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

const swatch =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='40'%3E%3Crect width='120' height='40' fill='%23228be6'/%3E%3C/svg%3E"

export const html = `
<h1>Typography styles plain HTML</h1>
<p>Wrap content you don't control, like <a href="#markdown">rendered markdown</a> or a CMS page, and every
element gets the theme's styles: <strong>bold</strong>, <em>italic</em>, <code>inline code</code>,
<kbd>Ctrl</kbd> + <kbd>K</kbd> and <mark>highlighted text</mark>.</p>
<h2>Lists</h2>
<ul><li>First item</li><li>Second item</li></ul>
<ol><li>Step one</li><li>Step two</li></ol>
<ul data-type="taskList"><li>A task list keeps its own layout</li></ul>
<h3>Quotes and code</h3>
<blockquote>Life is like an npm install, you never know what you are going to get.</blockquote>
<pre><code>const answer = 42</code></pre>
<hr />
<h4>A table</h4>
<table>
  <caption>Elements of the first period</caption>
  <thead><tr><th>Element</th><th>Symbol</th></tr></thead>
  <tbody><tr><td>Hydrogen</td><td>H</td></tr><tr><td>Helium</td><td>He</td></tr></tbody>
  <tfoot><tr><th>Element</th><th>Symbol</th></tr></tfoot>
</table>
<h5>Details</h5>
<details open><summary>Opened details</summary><p>Shown until the summary is clicked.</p></details>
<details><summary>Closed details</summary><p>Hidden until the summary is clicked.</p></details>
<h6>An image</h6>
<img src="${swatch}" alt="A blue swatch" width="120" height="40" />
<p>The last paragraph has no bottom margin.</p>
`

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html => ui.Typography(h, { maw: 700, html })
