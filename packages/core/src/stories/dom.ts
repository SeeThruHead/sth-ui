import { toJson } from "../json.ts"

export const present = <Found>(found: Found | null | undefined): Found => {
  if (found === null || found === undefined) throw new Error("Expected the element on the page, but it is not there")

  return found
}

export const pictureTimeout = { timeout: 5000 }

export const pictureState = (image: Element): string => {
  const source = image.getAttribute("src")

  return toJson({
    src: source,
    dataSrc: image.getAttribute("data-src"),
    complete: image instanceof HTMLImageElement && image.complete,
    naturalWidth: image instanceof HTMLImageElement ? image.naturalWidth : 0,
    hidden: image.hasAttribute("hidden"),
    requestMs: performance
      .getEntriesByType("resource")
      .filter((entry) => source !== null && entry.name.endsWith(source))
      .map((entry) => Math.round(entry.duration))
  })
}
