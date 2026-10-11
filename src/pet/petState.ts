export const PET_IDS = ['anon', 'tomori', 'rana', 'soyo', 'taki'] as const
export type PetId = typeof PET_IDS[number]
export type FoodId = 'biscuit' | 'matcha' | 'rice'
export type PetPace = 'calm' | 'normal' | 'lively'
export type PetAction = 'idle' | 'walking' | 'working' | 'happy' | 'eating' | 'sleeping' | 'dragging' | 'landing'

export const pets = [
  { id: 'anon' as PetId, name: '千早爱音', short: '爱音', color: '#efabc9', row: 0, hello: '今天也一起闪闪发光吧！', pat: '嘿嘿，你也觉得我很可爱吧？', favorite: 'biscuit' as FoodId },
  { id: 'tomori' as PetId, name: '高松灯', short: '灯', color: '#a9bdca', row: 1, hello: '可以……和你一起待一会儿吗？', pat: '你的手，好温暖……', favorite: 'rice' as FoodId },
  { id: 'rana' as PetId, name: '要乐奈', short: '乐奈', color: '#d9d5f1', row: 2, hello: '有趣的人。一起玩。', pat: '嗯……再摸一下。', favorite: 'matcha' as FoodId },
  { id: 'soyo' as PetId, name: '长崎素世', short: '素世', color: '#d4bda0', row: 3, hello: '累的时候，回来歇一会儿吧。', pat: '这样啊……谢谢你。', favorite: 'matcha' as FoodId },
  { id: 'taki' as PetId, name: '椎名立希', short: '立希', color: '#b4a8d3', row: 4, hello: '……我会在这里。你忙你的。', pat: '别、别突然摸头啊……', favorite: 'rice' as FoodId },
]
export const foods: Array<{ id: FoodId; name: string; price: number; fullness: number; color: string }> = [
  { id: 'biscuit', name: '小饼干', price: 4, fullness: 15, color: '#e9bd7f' },
  { id: 'matcha', name: '抹茶蛋糕', price: 7, fullness: 25, color: '#8fbe91' },
  { id: 'rice', name: '饭团', price: 6, fullness: 22, color: '#e7edf2' },
]
export type PetStats = { xp: number; fullness: number; happiness: number; lastUpdated: number }
export type PetSave = {
  version: 1
  selected: PetId
  stars: number
  inventory: Record<FoodId, number>
  friends: Record<PetId, PetStats>
  daily: { day: string; pats: number; feeds: number; walkSeconds: number; claimed: string[] }
  settings: { roaming: boolean; pace: PetPace; scale: number; position: { x: number; y: number } | null }
  focus: { enabled: boolean; seconds: number; granted: number; sourceSeconds: number | null }
}
export const STORAGE_KEY = 'mitu-pixel-pet-v1'
export const clamp = (n: number, low: number, high: number) => Math.min(high, Math.max(low, n))
export function localDay(now = Date.now()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}
export function createPetSave(now = Date.now()): PetSave {
  return {
    version: 1, selected: 'anon', stars: 24,
    inventory: { biscuit: 3, matcha: 2, rice: 2 },
    friends: Object.fromEntries(PET_IDS.map(id => [id, { xp: 0, fullness: 65, happiness: 75, lastUpdated: now }])) as Record<PetId, PetStats>,
    daily: { day: localDay(now), pats: 0, feeds: 0, walkSeconds: 0, claimed: [] },
    settings: { roaming: true, pace: 'normal', scale: 1, position: null },
    focus: { enabled: true, seconds: 0, granted: 0, sourceSeconds: null },
  }
}
function finite(value: unknown, fallback: number, low: number, high: number) {
  return typeof value === 'number' && Number.isFinite(value) ? clamp(value, low, high) : fallback
}
export function parsePetSave(raw: string | null, now = Date.now()): PetSave {
  const result = createPetSave(now)
  if (!raw) return result
  try {
    const data = JSON.parse(raw)
    if (!data || data.version !== 1) return result
    if (PET_IDS.includes(data.selected)) result.selected = data.selected
    result.stars = Math.floor(finite(data.stars, 24, 0, 100000))
    for (const food of foods) result.inventory[food.id] = Math.floor(finite(data.inventory?.[food.id], result.inventory[food.id], 0, 99))
    for (const id of PET_IDS) {
      const source = data.friends?.[id]
      if (!source) continue
      result.friends[id] = {
        xp: Math.floor(finite(source.xp, 0, 0, 100000)),
        fullness: finite(source.fullness, 65, 0, 100),
        happiness: finite(source.happiness, 75, 0, 100),
        lastUpdated: finite(source.lastUpdated, now, 0, now),
      }
    }
    if (data.daily?.day === localDay(now)) {
      result.daily = {
        day: localDay(now), pats: Math.floor(finite(data.daily.pats, 0, 0, 10000)),
        feeds: Math.floor(finite(data.daily.feeds, 0, 0, 10000)),
        walkSeconds: finite(data.daily.walkSeconds, 0, 0, 86400),
        claimed: Array.isArray(data.daily.claimed) ? [...new Set<string>(data.daily.claimed.filter((id: unknown) => typeof id === 'string' && ['checkin', 'pat', 'feed', 'walk'].includes(id)))] : [],
      }
    }
    result.settings.roaming = typeof data.settings?.roaming === 'boolean' ? data.settings.roaming : true
    result.settings.pace = (['calm', 'normal', 'lively'] as const).includes(data.settings?.pace) ? data.settings.pace : 'normal'
    result.settings.scale = finite(data.settings?.scale, 1, 0.7, 1.6)
    const pos = data.settings?.position
    if (pos && Number.isFinite(pos.x) && Number.isFinite(pos.y)) result.settings.position = { x: pos.x, y: pos.y }
    result.focus.enabled = typeof data.focus?.enabled === 'boolean' ? data.focus.enabled : true
    result.focus.seconds = finite(data.focus?.seconds, 0, 0, 1e9)
    result.focus.granted = Math.floor(finite(data.focus?.granted, 0, 0, Math.floor(result.focus.seconds / 300)))
    result.focus.sourceSeconds = typeof data.focus?.sourceSeconds === 'number' && Number.isFinite(data.focus.sourceSeconds) ? Math.max(0, data.focus.sourceSeconds) : null
    refreshPetSave(result, now)
  } catch { /* A damaged save must never prevent opening the pet. */ }
  return result
}
export function refreshPetSave(save: PetSave, now = Date.now()) {
  if (save.daily.day !== localDay(now)) save.daily = { day: localDay(now), pats: 0, feeds: 0, walkSeconds: 0, claimed: [] }
  for (const stats of Object.values(save.friends)) {
    const hours = clamp((now - stats.lastUpdated) / 3600000, 0, 48)
    stats.fullness = clamp(stats.fullness - hours * 3, 0, 100)
    stats.happiness = clamp(stats.happiness - hours * 1.5, 25, 100)
    stats.lastUpdated = now
  }
}
export function affinity(xp: number) {
  const thresholds = [0, 20, 60, 120, 220, 360]
  const titles = ['初见', '熟悉', '亲近', '默契', '知心', '挚友']
  let index = 0
  thresholds.forEach((threshold, i) => { if (xp >= threshold) index = i })
  const next = thresholds[index + 1]
  return { level: index + 1, title: titles[index], current: xp - thresholds[index], needed: next ? next - thresholds[index] : null, progress: next ? (xp - thresholds[index]) / (next - thresholds[index]) : 1 }
}
export function patPet(save: PetSave) {
  refreshPetSave(save)
  const stats = save.friends[save.selected]
  save.daily.pats++
  const xp = save.daily.pats <= 20 ? 2 : 0
  stats.xp += xp
  stats.happiness = clamp(stats.happiness + 4, 0, 100)
  return xp
}
export function feedPet(save: PetSave, foodId: FoodId) {
  refreshPetSave(save)
  const stats = save.friends[save.selected]
  const food = foods.find(item => item.id === foodId)!
  if (save.inventory[foodId] < 1) return { ok: false, reason: '背包里没有了，去小铺补一点吧。', xp: 0 }
  if (stats.fullness >= 95) return { ok: false, reason: '已经吃饱啦，先留着下次吃。', xp: 0 }
  save.inventory[foodId]--
  stats.fullness = clamp(stats.fullness + food.fullness, 0, 100)
  stats.happiness = clamp(stats.happiness + 8, 0, 100)
  const favorite = pets.find(pet => pet.id === save.selected)!.favorite === foodId
  // Affinity rewards are bounded per day, while feeding remains available when hungry.
  const xp = save.daily.feeds < 5 ? (favorite ? 8 : 6) : 0
  stats.xp += xp
  save.daily.feeds++
  return { ok: true, reason: favorite ? '是我喜欢的！谢谢你。' : '好吃。下次也一起吃吧。', xp }
}
export function buyFood(save: PetSave, foodId: FoodId) {
  const food = foods.find(item => item.id === foodId)!
  if (save.stars < food.price) return false
  if (save.inventory[foodId] >= 99) return false
  save.stars -= food.price
  save.inventory[foodId]++
  return true
}
export function dailyTasks(save: PetSave) {
  return [
    { id: 'checkin', name: '今天也见面了', current: 1, target: 1, reward: 12 },
    { id: 'pat', name: '摸摸头', current: Math.min(save.daily.pats, 3), target: 3, reward: 8 },
    { id: 'feed', name: '一起吃点东西', current: Math.min(save.daily.feeds, 1), target: 1, reward: 10 },
    { id: 'walk', name: '散步一小会儿', current: Math.min(Math.floor(save.daily.walkSeconds), 20), target: 20, reward: 10 },
  ].map(task => ({ ...task, claimed: save.daily.claimed.includes(task.id) }))
}
export function claimReward(save: PetSave, id: string) {
  refreshPetSave(save)
  const task = dailyTasks(save).find(item => item.id === id)
  if (!task || task.claimed || task.current < task.target) return 0
  save.daily.claimed.push(id)
  save.stars += task.reward
  return task.reward
}

export const FOCUS_FOODS: FoodId[] = ['biscuit', 'matcha', 'rice']
export function focusProgress(save: PetSave) {
  return { seconds: save.focus.seconds % 300, next: FOCUS_FOODS[Math.floor(save.focus.seconds / 300) % 3]! }
}
export function creditFocusSource(save: PetSave, sourceSeconds: number) {
  if (!Number.isFinite(sourceSeconds) || sourceSeconds < 0) return []
  const previous = save.focus.sourceSeconds
  save.focus.sourceSeconds = sourceSeconds
  if (previous === null || sourceSeconds <= previous) return []
  // The native ledger accrues only qualifying time, not time while the app is closed.
  save.focus.seconds += sourceSeconds - previous
  const target = Math.floor(save.focus.seconds / 300)
  const earned: FoodId[] = []
  const first = save.focus.granted
  for (let offset = 0; offset < 3 && first + offset < target; offset++) {
    const food = FOCUS_FOODS[(first + offset) % 3]!
    const due = Math.floor((target - 1 - first - offset) / 3) + 1
    const quantity = Math.min(due, 99 - save.inventory[food])
    save.inventory[food] += quantity
    earned.push(...Array<FoodId>(quantity).fill(food))
  }
  save.focus.granted = target
  return earned
}
