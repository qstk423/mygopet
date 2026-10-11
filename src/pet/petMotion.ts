import type { PetPace } from './petState'

export type PetPoint = { x: number; y: number }
export type PetBounds = { minX: number; maxX: number; minY: number; maxY: number }
export type RoamState = { phase: 'rest' | 'walk'; target: PetPoint; traveled: number; nextAt: number }

export const WALK_SPEED: Record<PetPace, number> = { calm: 28, normal: 40, lively: 54 }
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export function createRoamState(now: number, at: PetPoint, random = Math.random): RoamState {
  return { phase: 'rest', target: { ...at }, traveled: 0, nextAt: now + 3500 + random() * 3500 }
}

export function pauseRoam(state: RoamState, at: PetPoint, now: number) {
  state.phase = 'rest'
  state.target = { ...at }
  state.traveled = 0
  state.nextAt = now + 2200
}

export function advanceRoam(state: RoamState, at: PetPoint, bounds: PetBounds, pace: PetPace, now: number, dt: number, random = Math.random) {
  const position = { x: clamp(at.x, bounds.minX, bounds.maxX), y: clamp(at.y, bounds.minY, bounds.maxY) }
  if (state.phase === 'rest') {
    if (now < state.nextAt) return { position, moving: false, frame: 0, facing: 0, walkSeconds: 0 }
    const distance = 72 + random() * 105
    const direction = random() < .5 ? -1 : 1
    let x = clamp(position.x + direction * distance, bounds.minX, bounds.maxX)
    if (Math.abs(x - position.x) < 35) x = clamp(position.x - direction * distance, bounds.minX, bounds.maxX)
    if (Math.abs(x - position.x) < 20) { state.nextAt = now + 5000; return { position, moving: false, frame: 0, facing: 0, walkSeconds: 0 } }
    state.target = { x, y: clamp(position.y + (random() - .5) * 28, bounds.minY, bounds.maxY) }
    state.traveled = 0
    state.phase = 'walk'
  }
  state.target.x = clamp(state.target.x, bounds.minX, bounds.maxX)
  state.target.y = clamp(state.target.y, bounds.minY, bounds.maxY)
  const dx = state.target.x - position.x, dy = state.target.y - position.y
  const remaining = Math.hypot(dx, dy)
  if (remaining < 1) {
    pauseRoam(state, position, now)
    state.nextAt = now + 6500 + random() * 7500
    return { position, moving: false, frame: 0, facing: 0, walkSeconds: 0 }
  }
  const speed = Math.max(WALK_SPEED[pace] * .48, WALK_SPEED[pace] * Math.min(1, state.traveled / 24, remaining / 24))
  const step = Math.min(remaining, speed * Math.max(0, dt))
  position.x += dx / remaining * step
  position.y += dy / remaining * step
  state.traveled += step
  const facing = dx < 0 ? -1 : 1
  const frame = Math.floor(state.traveled / 9) % 2
  if (remaining - step < 1) {
    pauseRoam(state, position, now)
    state.nextAt = now + 6500 + random() * 7500
  }
  return { position, moving: step > 0, frame, facing, walkSeconds: speed > 0 ? step / speed : 0 }
}
