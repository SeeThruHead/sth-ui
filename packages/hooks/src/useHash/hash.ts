export const withHash = (value: string): string => (value.startsWith("#") ? value : `#${value}`)
