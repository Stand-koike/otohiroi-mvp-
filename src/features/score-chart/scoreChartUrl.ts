/** Vite `base: './'` と Electron file:// でも public 配下を解決する */
export function resolveScoreChartUrl(relativePath: string): string {
  const relative = relativePath.replace(/^\//, '')
  const base = import.meta.env.BASE_URL || './'
  return new URL(relative, new URL(base, window.location.href)).href
}
