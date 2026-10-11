export type HitRegion = { x: number; y: number; width: number; height: number }
export type DesktopBridge = {
  getFocusStatus: () => Promise<{ mode: string; active: boolean; seconds: number; supported: boolean } | null>
  setFocusPreferences: (preferences: { enabled: boolean; study: boolean }) => Promise<void>
  showPet: () => Promise<void>
  openMain: () => Promise<void>
  hidePet: () => Promise<void>
  quit: () => Promise<void>
  setHitRegions: (regions: HitRegion[]) => void
  setDragging: (dragging: boolean) => void
}
declare global { interface Window { desktopPet?: DesktopBridge } }

export function openDesktopPet() {
  if (window.desktopPet) return window.desktopPet.showPet()
  const url = new URL(window.location.href)
  url.searchParams.set('mode', 'pet-preview')
  window.open(url, '_blank', 'noopener')
}
