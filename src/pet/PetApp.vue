<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import PetSprite from './PetSprite.vue'
import PetIcon from './PetIcon.vue'
import { affinity, buyFood, claimReward, clamp, creditFocusSource, dailyTasks, feedPet, focusProgress, foods, parsePetSave, patPet, pets, refreshPetSave, STORAGE_KEY, type FoodId, type PetAction, type PetId } from './petState'
import { advanceRoam, createRoamState, pauseRoam } from './petMotion'
import './desktopBridge'

const native = new URLSearchParams(location.search).get('mode') === 'pet' && !!window.desktopPet
let raw: string | null = null
try { raw = localStorage.getItem(STORAGE_KEY) } catch { /* Persistence may be blocked. */ }
const save = reactive(parsePetSave(raw))
const pet = computed(() => pets.find(p => p.id === save.selected)!)
const stats = computed(() => save.friends[save.selected])
const bond = computed(() => affinity(stats.value.xp))
const tasks = computed(() => dailyTasks(save))
const panel = ref(!native)
const tab = ref<'bag' | 'friends' | 'rewards'>('bag')
const sleeping = ref(false)
const moving = ref(false)
const dragging = ref(false)
const effect = ref<PetAction>('idle')
const frame = ref(0)
const facing = ref(1)
const dragTilt = ref(0)
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
const reducedMotion = ref(motionPreference.matches)
function motionChanged(event: MediaQueryListEvent) { reducedMotion.value = event.matches; moving.value = false; pauseRoam(roam, pos, Date.now()) }
const speech = ref(pet.value.hello)
const notice = ref('')
const storageError = ref(false)
const study = ref(false)
const focusMode = ref(native ? 'waiting' : 'preview')
// A browser-only pose preview; focus detection remains native-only.
const previewCoding = !native && new URLSearchParams(location.search).get('demo') === 'coding'
const focus = computed(() => focusProgress(save))
const focusTime = computed(() => `${String(Math.floor(focus.value.seconds / 60)).padStart(2, '0')}:${String(Math.floor(focus.value.seconds % 60)).padStart(2, '0')}`)
const nextFood = computed(() => foods.find(food => food.id === focus.value.next)!.name)
const focusLabel = computed(() => ({ coding: '编程中', study: '学习中', waiting: study.value ? '等待浏览器或播放器' : '等待代码软件', paused: '已暂停', idle: '暂时离开', away: '锁屏或休眠中', unavailable: '识别暂不可用', 'save-error': '计时保存失败', preview: '桌面版可自动积攒零食', restart: '请重新启动桌宠' })[focusMode.value] ?? '等待代码软件')
const viewport = reactive({ w: innerWidth, h: innerHeight })
const size = computed(() => 144 * save.settings.scale)
const pos = reactive({ x: 0, y: 0 })
let roam = createRoamState(Date.now(), pos)
let wasRoaming = false, lastRegionUpdate = 0
let lastTick = 0, lastPat = 0, speechUntil = Date.now() + 5000, effectUntil = 0
let pointer: { id: number; x: number; y: number; startX: number; startY: number; moved: boolean } | null = null
let dragLastX = 0, dragLastTime = 0
let timer: ReturnType<typeof setInterval> | undefined
let persistTimer: ReturnType<typeof setInterval> | undefined
let refreshTimer: ReturnType<typeof setInterval> | undefined
let focusTimer: ReturnType<typeof setInterval> | undefined
let focusBusy = false
async function focusPreferences() {
  if (!native) return
  if (!window.desktopPet?.setFocusPreferences) { focusMode.value = 'restart'; return }
  try { await window.desktopPet.setFocusPreferences({ enabled: save.focus.enabled, study: study.value }); await pollFocus() } catch { focusMode.value = 'unavailable' }
  persist()
}
async function pollFocus() {
  if (!native || focusBusy || !window.desktopPet?.getFocusStatus) return
  focusBusy = true
  try {
    const result = await window.desktopPet.getFocusStatus()
    if (!result) return
    focusMode.value = result.supported ? result.mode : 'unavailable'
    const earned = creditFocusSource(save, result.seconds)
    if (earned.length) {
      const summary = foods.map(food => { const count = earned.filter(id => id === food.id).length; return count ? `${food.name} ×${count}` : '' }).filter(Boolean).join('、')
      notice.value = `专注奖励：${summary}`; say('认真努力的时间，变成小小的奖励啦。'); persist()
    }
  } catch { focusMode.value = 'unavailable' }
  finally { focusBusy = false }
}
const codingCompanion = computed(() => previewCoding || (native && focusMode.value === 'coding'))
const action = computed<PetAction>(() => dragging.value ? 'dragging' : sleeping.value ? 'sleeping' : effect.value !== 'idle' ? effect.value : codingCompanion.value ? 'working' : moving.value ? 'walking' : 'idle')
const stacked = computed(() => panel.value && viewport.w < size.value + 368 + 60)
const displayedPos = computed(() => stacked.value ? { x: (viewport.w - size.value) / 2, y: native ? 110 : 160 } : pos)
const actorStyle = computed(() => ({ left: `${displayedPos.value.x}px`, top: `${displayedPos.value.y}px`, width: `${size.value}px`, height: `${size.value + 36}px` }))
const speechStyle = computed(() => ({ left: `${clamp(size.value / 2, 124 - displayedPos.value.x, viewport.w - 124 - displayedPos.value.x)}px` }))
const panelStyle = computed(() => {
  const width = Math.min(368, viewport.w - 24)
  if (stacked.value) {
    const top = displayedPos.value.y + size.value + 48
    return { left: `${(viewport.w - width) / 2}px`, top: `${top}px`, maxHeight: `${Math.max(130, viewport.h - top - 12)}px` }
  }
  const beside = pos.x + size.value + 18 + width < viewport.w ? pos.x + size.value + 18 : pos.x - width - 18
  const top = clamp(pos.y - 180, native ? 12 : 94, Math.max(native ? 12 : 94, viewport.h - 650))
  return { left: `${clamp(beside, 12, viewport.w - width - 12)}px`, top: `${top}px`, maxHeight: `${Math.max(130, viewport.h - top - 12)}px` }
})
function constrain() {
  viewport.w = innerWidth; viewport.h = innerHeight
  pos.x = clamp(pos.x, 8, Math.max(8, viewport.w - size.value - 8))
  const ceiling = native ? 52 : 140
  pos.y = clamp(pos.y, ceiling, Math.max(ceiling, viewport.h - size.value - 44))
}
function persist() {
  save.settings.position = { ...pos }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(save)); storageError.value = false } catch { storageError.value = true }
}
function say(text: string, animate: PetAction = 'happy') {
  speech.value = text; speechUntil = Date.now() + 4500
  effect.value = animate; effectUntil = Date.now() + (animate === 'eating' ? 2500 : 1500)
}
function pat() {
  if (sleeping.value) { sleeping.value = false; say('醒啦……你来了。'); return }
  if (Date.now() - lastPat < 1200) return
  lastPat = Date.now(); const xp = patPet(save)
  say(pet.value.pat); notice.value = xp ? `亲密度 +${xp}` : '今天已经很亲近啦'; persist()
}
function feed(id: FoodId) {
  if (sleeping.value) return
  const result = feedPet(save, id)
  notice.value = result.ok ? `亲密度 +${result.xp}` : result.reason
  say(result.reason, result.ok ? 'eating' : 'idle'); persist()
}
function buy(id: FoodId) {
  notice.value = buyFood(save, id) ? '零食放进背包了' : '星星不够，去奖励页领取吧'; persist()
}
function choose(id: PetId) {
  save.selected = id; sleeping.value = false; say(pet.value.hello); persist()
}
function reward(id: string) {
  const stars = claimReward(save, id)
  if (stars) { notice.value = `获得 ${stars} 颗星星`; say('今天也一起积攒了小小的快乐。') }
  persist()
}
function startDrag(event: PointerEvent) {
  if (event.button !== 0) return
  Object.assign(pos, displayedPos.value)
  pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: pos.x, startY: pos.y, moved: false }
  dragLastX = event.clientX; dragLastTime = performance.now(); dragTilt.value = 0
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}
function drag(event: PointerEvent) {
  if (!pointer || event.pointerId !== pointer.id) return
  const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y
  if (!pointer.moved && Math.hypot(dx, dy) > 5) {
    pointer.moved = true; panel.value = false; moving.value = false; dragging.value = true
    effect.value = 'idle'; speech.value = ''; window.desktopPet?.setDragging(true)
  }
  if (pointer.moved) {
    const now = performance.now()
    dragTilt.value = clamp((event.clientX - dragLastX) / Math.max(16, now - dragLastTime) * 16, -18, 18)
    dragLastX = event.clientX; dragLastTime = now
    pos.x = pointer.startX + dx; pos.y = pointer.startY + dy; constrain()
  }
}
function endDrag(event: PointerEvent) {
  if (!pointer || event.pointerId !== pointer.id) return
  const click = !pointer.moved && event.type !== 'pointercancel'
  const dropped = pointer.moved
  pointer = null; dragging.value = false; window.desktopPet?.setDragging(false)
  pauseRoam(roam, pos, Date.now()); moving.value = false; dragTilt.value = 0
  if (dropped && !sleeping.value) { effect.value = 'landing'; effectUntil = Date.now() + 420 }
  persist(); if (click) pat()
}
function openMain() {
  if (window.desktopPet) void window.desktopPet.openMain()
  else location.href = location.pathname
}
function key(event: KeyboardEvent) { if (event.key === 'Escape') panel.value = false }
function updateRegions() {
  if (!native) return
  const regions = Array.from(document.querySelectorAll<HTMLElement>('[data-pet-hit]')).map(el => {
    const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }
  })
  window.desktopPet?.setHitRegions(regions)
}
watch([panel, size, stacked], async () => { await nextTick(); updateRegions() })
onMounted(async () => {
  document.body.classList.toggle('native-pet', native)
  const initial = save.settings.position ?? { x: native ? viewport.w - 210 : Math.max(40, viewport.w / 2 - 240), y: native ? viewport.h - 240 : viewport.h / 2 - 30 }
  Object.assign(pos, initial); constrain(); roam = createRoamState(Date.now(), pos); await nextTick(); updateRegions()
  await focusPreferences()
  focusTimer = setInterval(() => void pollFocus(), 2000)
  timer = setInterval(() => {
    const now = Date.now(), dt = Math.min((now - (lastTick || now)) / 1000, .1); lastTick = now
    if (now > speechUntil) speech.value = ''
    if (now > effectUntil) effect.value = 'idle'
    const canWalk = !reducedMotion.value && !document.hidden && save.settings.roaming && !panel.value && !pointer && !sleeping.value && !codingCompanion.value && effect.value === 'idle'
    moving.value = false
    if (canWalk) {
      const ceiling = native ? 52 : 140
      const result = advanceRoam(roam, pos, { minX: 8, maxX: Math.max(8, viewport.w - size.value - 8), minY: ceiling, maxY: Math.max(ceiling, viewport.h - size.value - 44) }, save.settings.pace, now, dt)
      pos.x = result.position.x; pos.y = result.position.y
      moving.value = result.moving
      if (result.facing) facing.value = result.facing
      save.daily.walkSeconds += result.walkSeconds
      frame.value = result.frame
    } else if (wasRoaming) {
      pauseRoam(roam, pos, now)
    }
    wasRoaming = canWalk
    if (reducedMotion.value) frame.value = 0
    else if (codingCompanion.value) frame.value = Math.floor(now / 1400) % 2
    else if (!moving.value) frame.value = Math.floor(now / 180) % 2
    dragTilt.value *= .82
    if (native && (now - lastRegionUpdate >= (moving.value || dragging.value ? 100 : 500))) { updateRegions(); lastRegionUpdate = now }
  }, 50)
  persistTimer = setInterval(persist, 1500)
  refreshTimer = setInterval(() => refreshPetSave(save), 60000)
  window.addEventListener('resize', constrain); window.addEventListener('pagehide', persist); window.addEventListener('keydown', key)
  motionPreference.addEventListener('change', motionChanged)
})
onUnmounted(() => {
  clearInterval(timer); clearInterval(persistTimer); clearInterval(refreshTimer); clearInterval(focusTimer); persist()
  window.removeEventListener('resize', constrain); window.removeEventListener('pagehide', persist); window.removeEventListener('keydown', key)
  motionPreference.removeEventListener('change', motionChanged)
  window.desktopPet?.setDragging(false)
})
</script>

<template>
  <main class="pet-world" :class="{ 'pet-world--native': native }">
    <header v-if="!native" class="pet-preview-header"><a href="/" aria-label="返回迷途之子">迷途之子<span>桌宠</span></a><button @click="openMain"><PetIcon name="home" />回到对话</button></header>
    <section class="pet-actor" :style="actorStyle">
      <div v-if="speech" class="pet-speech" :style="speechStyle" role="status">{{ speech }}</div>
      <button class="pet-body" data-pet-hit :aria-label="`${pet.name}，点击摸头，拖动移动`" @pointerdown="startDrag" @pointermove="drag" @pointerup="endDrag" @pointercancel="endDrag" @keydown.enter.prevent="pat" @keydown.space.prevent="pat" @contextmenu.prevent="panel = !panel">
      <PetSprite :character="save.selected" :action="action" :direction="facing" :frame="frame" :tilt="dragTilt" />
      </button>
      <div class="pet-quick" data-pet-hit><button :aria-label="panel ? '收起背包' : '打开背包'" :aria-expanded="panel" @click="panel = !panel"><PetIcon :name="panel ? 'close' : 'bag'" /></button><button :aria-label="sleeping ? '叫醒角色' : '让角色休息'" :aria-pressed="sleeping" @click="sleeping = !sleeping"><PetIcon name="moon" /></button></div>
    </section>
    <section v-if="panel" class="pet-panel" :style="panelStyle" data-pet-hit aria-label="桌宠互动面板">
      <header class="pet-panel-head"><div><h1>{{ pet.short }}</h1><span>{{ bond.title }} · Lv.{{ bond.level }}</span></div><div class="pet-wallet"><PetIcon name="star" />{{ save.stars }}</div><button class="pet-icon-button" aria-label="收起面板" @click="panel = false"><PetIcon name="close" /></button></header>
      <div class="pet-bond"><span>亲密度</span><progress :value="bond.progress" max="1" :aria-label="`亲密度等级${bond.level}`"></progress><span>{{ bond.needed ? `${bond.current}/${bond.needed}` : '满级' }}</span></div>
      <div class="pet-vitals"><span><PetIcon name="biscuit" />饱腹 {{ Math.round(stats.fullness) }}</span><span><PetIcon name="heart" />心情 {{ Math.round(stats.happiness) }}</span></div>
      <div class="pet-focus"><div class="pet-focus-status"><span :class="{ 'is-active': focusMode === 'coding' || focusMode === 'study' }"><i></i>{{ focusLabel }}</span><button :disabled="!native" :aria-pressed="study" @click="study = !study; focusPreferences()">学习模式</button><button class="pet-icon-button" :disabled="!native" :aria-label="save.focus.enabled ? '暂停专注计时' : '开启专注计时'" @click="save.focus.enabled = !save.focus.enabled; focusPreferences()"><PetIcon :name="save.focus.enabled ? 'pause' : 'walk'" /></button></div><div class="pet-focus-next"><span>{{ nextFood }}</span><span>{{ focusTime }} / 05:00</span></div><progress :value="focus.seconds" max="300" aria-label="下一份专注零食的进度"></progress></div>
      <nav class="pet-tabs" aria-label="互动分类"><button v-for="item in ([['bag','背包'],['friends','同行'],['rewards','奖励']] as const)" :key="item[0]" :aria-pressed="tab === item[0]" @click="tab = item[0]; notice = ''">{{ item[1] }}<span v-if="item[0] === 'rewards' && tasks.some(t => !t.claimed && t.current >= t.target)" class="pet-dot"></span></button></nav>
      <div class="pet-panel-content">
        <div v-if="tab === 'bag'" class="pet-foods"><div v-for="food in foods" :key="food.id" class="pet-food-row"><div class="pet-food-icon" :style="{ color: food.color }"><PetIcon :name="food.id" /></div><div class="pet-food-name"><strong>{{ food.name }}</strong><span>剩余 {{ save.inventory[food.id] }} 份</span></div><button class="pet-feed" :disabled="!save.inventory[food.id] || sleeping || stats.fullness >= 95" @click="feed(food.id)">投喂</button><button class="pet-buy" :aria-label="`购买${food.name}，${food.price}颗星星`" :disabled="save.stars < food.price || save.inventory[food.id] >= 99" @click="buy(food.id)"><PetIcon name="plus" /><span>{{ food.price }}<PetIcon name="star" /></span></button></div><p v-if="sleeping" class="pet-inline-note">她睡着了，叫醒后再一起吃吧。</p></div>
        <div v-else-if="tab === 'friends'" class="pet-friends"><button v-for="friend in pets" :key="friend.id" :aria-pressed="save.selected === friend.id" @click="choose(friend.id)"><div class="pet-friend-portrait"><PetSprite :character="friend.id" /></div><span>{{ friend.short }}</span><PetIcon v-if="save.selected === friend.id" name="check" /></button></div>
        <div v-else class="pet-rewards"><div v-for="task in tasks" :key="task.id" class="pet-reward-row"><div><strong>{{ task.name }}</strong><span>{{ task.current }}/{{ task.target }}</span></div><button :disabled="task.claimed || task.current < task.target" @click="reward(task.id)"><template v-if="task.claimed"><PetIcon name="check" />已领取</template><template v-else><PetIcon name="star" />{{ task.reward }}</template></button></div></div>
      </div>
      <p class="pet-notice" role="status">{{ storageError ? '保存失败，请检查浏览器存储权限。' : notice }}</p>
      <footer class="pet-panel-foot"><button :aria-pressed="save.settings.roaming" @click="save.settings.roaming = !save.settings.roaming; persist()"><PetIcon :name="save.settings.roaming ? 'walk' : 'pause'" />{{ save.settings.roaming ? '自由散步' : '留在身边' }}</button><label>步速<select v-model="save.settings.pace" @change="persist()"><option value="calm">悠闲</option><option value="normal">自然</option><option value="lively">活泼</option></select></label><label>大小<select v-model.number="save.settings.scale" @change="constrain(); persist()"><option :value=".8">小</option><option :value="1">中</option><option :value="1.3">大</option></select></label><button class="pet-icon-button" aria-label="打开对话窗口" @click="openMain"><PetIcon name="home" /></button></footer>
    </section>
  </main>
</template>
