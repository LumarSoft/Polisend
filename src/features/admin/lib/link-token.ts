/**
 * The token of the password-setup link this page was opened with. Kept only in memory, for this page load: the page
 * takes it out of the address bar, and a remount (a session ending) must still find it. A new link in the URL wins.
 */
let linkToken: string | null = null

export function readLinkToken(): string | null {
  const fromUrl = new URLSearchParams(window.location.search).get('token')
  if (fromUrl !== null) linkToken = fromUrl
  return linkToken
}

/** Takes the token out of the address bar, the history entry and any bookmark of this page. */
export function dropLinkTokenFromUrl(): void {
  if (window.location.search) window.history.replaceState(window.history.state, '', window.location.pathname)
}
