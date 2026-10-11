<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Live2DStage from './components/Live2DStage.vue'
import { createGreetingSequence } from './greetings'
import { openDesktopPet } from './pet/desktopBridge'

type Character = { id: string; name: string; initial: string; role: string; color: string; tint: string; line: string }
type Message = { id: number; from: string; text: string }
type Outfit = { character: string; outfit: string; thumbnail?: boolean }
const characters: Character[] = [
  { id: 'tomori', name: '高松灯', initial: '燈', role: '主唱 · 把心情写成诗', color: '#788c9b', tint: '#e5edf1', line: '我把今天的心情写进诗里了。' },
  { id: 'anon', name: '千早爱音', initial: '愛', role: '吉他 · 明亮又努力', color: '#bd777c', tint: '#f4e0dd', line: '今天也要闪闪发光哦！' },
  { id: 'rana', name: '要乐奈', initial: '楽', role: '吉他 · 随心所欲的猫', color: '#9a83a8', tint: '#eee8f2', line: '有趣的女人，要一起去吃抹茶吗？' },
  { id: 'soyo', name: '长崎素世', initial: 'そ', role: '贝斯 · 温柔而细腻', color: '#79918a', tint: '#e5eee9', line: '别着急，我们慢慢来。' },
  { id: 'taki', name: '椎名立希', initial: '希', role: '鼓手 · 认真可靠', color: '#887d95', tint: '#ece8f0', line: '……有什么事就直说，我会听着。' },
]

const participants = ref<string[]>(['anon', 'tomori'])
const costumeCatalog = ref<Record<string, Outfit[]>>({})
const selectedCostumes = ref<Record<string, string>>({
  anon: 'anon/037_casual-2023',
  tomori: 'tomori/036_casual-2023',
  rana: 'rana/038_casual-2023',
  soyo: 'soyo/039_casual-2023',
  taki: 'taki/040_casual-2023',
})
const costumeCatalogReady = ref(false)
const openWardrobeFor = ref<string | null>(null)
const activeSpeaker = ref('tomori')
const input = ref('')
const speaking = ref(false)
const busy = ref(false)
const responseActor = ref('')
const messages = ref<Message[]>([])
const pendingReplies = ref<Array<{ from: string; text: string }>>([])
let responseTimer = 0
let clearResponseTimer = 0
let conversationStarted = false

const activeCharacters = computed(() => participants.value.map(id => characters.find(character => character.id === id)!).filter(Boolean))
const latestMessage = computed(() => messages.value[messages.value.length - 1])
const lineSpeaker = computed(() => latestMessage.value?.from === 'you'
  ? { name: '舰长', initial: '舰', color: '#9a7866', tint: '#eee2d8' }
  : characters.find(character => character.id === latestMessage.value?.from) ?? characters[0])
const canInvite = computed(() => participants.value.length < 2)

function outfitLabel(outfit: string) {
  const label: Record<string, string> = {
    'casual-2023': '春季休闲', 'school_winter-2023': '冬季校服', 'school_summer-2023': '夏季校服',
    live_default: '乐队演出服', live_sr_01: '特别演出服', birthday_2024_ssr: '生日服饰 · 2024',
    dream_festival_3_ur: '梦幻祭典', collabo_a_ur: '联动服饰 · A', collabo_d_3_ur: '联动服饰 · D3',
    '2024_furisode': '新春和服', arbeit: '打工服', event_277_story_01: '故事服饰 · 277',
    live_event_235_ur: '活动服饰 · 235', live_event_235_sr: '活动服饰 · 235',
    live_event_240_ur: '活动服饰 · 240', live_event_240_ssr: '活动服饰 · 240', live_event_240_sr: '活动服饰 · 240', live_event_240_r: '活动服饰 · 240',
    live_event_250_ur: '活动服饰 · 250', live_event_250_ssr: '活动服饰 · 250', live_event_250_sr: '活动服饰 · 250', live_event_250_r: '活动服饰 · 250',
    live_event_253_ur: '活动服饰 · 253', live_event_277_ur: '活动服饰 · 277', live_event_277_sr: '活动服饰 · 277',
    live_event_286_ur: '活动服饰 · 286', live_event_286_ssr: '活动服饰 · 286', live_event_286_sr: '活动服饰 · 286', live_event_286_r: '活动服饰 · 286',
    live_event_289_ur: '活动服饰 · 289', live_event_297_ur: '活动服饰 · 297', live_event_297_sr: '活动服饰 · 297',
  }
  const key = outfit.replace(/^\d+_/, '')
  return label[key] ?? key.replaceAll('_', ' ')
}

function modelUrlFor(characterId: string) {
  const outfit = selectedCostumes.value[characterId]
  return outfit ? `/models/mygo/${outfit}/index.json` : ''
}

function chooseOutfit(characterId: string, outfit: Outfit) {
  selectedCostumes.value[characterId] = `${outfit.character}/${outfit.outfit}`
  openWardrobeFor.value = null
}

function hideBrokenThumbnail(event: Event) {
  const image = event.currentTarget as HTMLImageElement
  image.style.display = 'none'
  image.parentElement?.classList.add('missing-thumb')
}

onMounted(async () => {
  try {
    const response = await fetch('/mygo-model-catalog.json')
    if (!response.ok) throw new Error('模型目录暂不可用')
    const outfits = await response.json() as Outfit[]
    costumeCatalog.value = outfits.reduce<Record<string, Outfit[]>>((grouped, outfit) => {
      (grouped[outfit.character] ??= []).push(outfit)
      return grouped
    }, {})
    costumeCatalogReady.value = true
  } catch {
    costumeCatalogReady.value = false
  }
})

function toggleParticipant(id: string) {
  if (participants.value.includes(id)) {
    if (participants.value.length === 1) return
    participants.value = participants.value.filter(item => item !== id)
    if (activeSpeaker.value === id) activeSpeaker.value = participants.value[0]
  } else if (canInvite.value) {
    participants.value = [...participants.value, id]
  }
  if (!conversationStarted) resetOpeningDialogue(participants.value)
}

function addMessage(from: string, text: string) {
  messages.value.push({ id: Date.now() + Math.random(), from, text })
}

function resetOpeningDialogue(cast: readonly string[]) {
  const [first, ...rest] = createGreetingSequence(cast)
  if (!first) return
  messages.value = [{ id: Date.now() + Math.random(), ...first }]
  pendingReplies.value = rest
  activeSpeaker.value = first.from
  responseActor.value = first.from
  window.clearTimeout(clearResponseTimer)
  clearResponseTimer = window.setTimeout(() => { responseActor.value = '' }, 2200)
}

resetOpeningDialogue(participants.value)

function advanceDialogue() {
  if (busy.value || !pendingReplies.value.length) return
  window.clearTimeout(clearResponseTimer)
  const next = pendingReplies.value.shift()!
  activeSpeaker.value = next.from
  responseActor.value = next.from
  addMessage(next.from, next.text)
  clearResponseTimer = window.setTimeout(() => { responseActor.value = '' }, 2200)
}

function sendMessage(text = input.value) {
  const clean = text.trim()
  if (!clean || busy.value || pendingReplies.value.length) return
  addMessage('you', clean)
  conversationStarted = true
  activeSpeaker.value = 'you'
  input.value = ''
  busy.value = true
  window.clearTimeout(responseTimer)
  window.clearTimeout(clearResponseTimer)
  responseActor.value = ''
  pendingReplies.value = []
  const first = activeCharacters.value[0]
  const second = activeCharacters.value[1]
  responseTimer = window.setTimeout(() => {
    pendingReplies.value = [{
      from: first.id,
      text: clean.includes('累') || clean.includes('压力')
        ? '谢谢你愿意告诉我们。先别急着责怪自己，今天的你已经很努力了。'
        : '我有在认真听哦。你愿意继续说说看吗？',
    }]
    if (second) pendingReplies.value.push({
      from: second.id,
      text: '我也在这里陪着你。我们可以一起想办法，也可以什么都不做，只安静待一会儿。',
    })
    busy.value = false
    advanceDialogue()
  }, 600)
}

function toggleSpeech() {
  speaking.value = !speaking.value
  if (speaking.value) activeSpeaker.value = activeCharacters.value[0].id
}

</script>

<template>
  <main class="app-shell">
    <aside class="sidebar">
      <a class="brand" href="#top" aria-label="迷途之子首页"><span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 36 36"><path d="M4 28 15 17l6 6 11-15M24 8h8v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg></span><strong>迷途之子</strong></a>
      <div class="roster-heading"><span>同行的人</span><span>{{ participants.length }} / 2</span></div>
      <div class="roster-list">
        <button v-for="character in characters" :key="character.id" class="roster-person" :class="{ selected: participants.includes(character.id), disabled: !participants.includes(character.id) && !canInvite }" :aria-pressed="participants.includes(character.id)" :disabled="!participants.includes(character.id) && !canInvite" @click="toggleParticipant(character.id)">
          <span class="roster-avatar" :style="{ '--person-color': character.color, '--person-tint': character.tint }">{{ character.initial }}</span>
          <span class="roster-copy"><strong>{{ character.name }}</strong></span>
          <span class="roster-check">{{ participants.includes(character.id) ? '✓' : '+' }}</span>
        </button>
      </div>
      <div class="sidebar-note"><p>迷路也没关系。<br>今晚，我们一起走。</p></div>
      <div class="profile-button"><span class="profile-avatar">舰</span><strong>舰长</strong></div>
    </aside>

    <section class="story-screen" id="top">
      <header class="story-header">
        <div><h1>雨停之后</h1></div>
        <div class="story-tools"><button class="scene-chip" @click="openDesktopPet">桌宠</button><span class="scene-chip"><i></i> 今夜 · 天桥</span></div>
      </header>

      <div class="stage-scene" :class="`cast-${activeCharacters.length}`">
        <div class="scene-haze" aria-hidden="true"></div>
        <div class="wardrobe-picker" aria-label="切换角色服装">
          <label v-for="character in activeCharacters" :key="character.id">
            <span>{{ character.name }}的衣装</span>
            <button class="wardrobe-trigger" :aria-label="`为${character.name}更换衣装`" :disabled="!costumeCatalogReady" @click="openWardrobeFor = openWardrobeFor === character.id ? null : character.id">
              <span>{{ outfitLabel(selectedCostumes[character.id]?.split('/').at(-1) ?? '') }}</span><i>⌄</i>
            </button>
          </label>
        </div>
        <div v-if="openWardrobeFor" class="wardrobe-popover" role="dialog" aria-label="选择角色衣装">
          <div class="wardrobe-popover-heading"><div><strong>{{ characters.find((character) => character.id === openWardrobeFor)?.name }}的衣装</strong></div><button aria-label="关闭衣装选择" @click="openWardrobeFor = null">×</button></div>
          <div class="wardrobe-grid">
            <button v-for="outfit in costumeCatalog[openWardrobeFor] ?? []" :key="outfit.outfit" class="wardrobe-option" :class="{ selected: selectedCostumes[openWardrobeFor] === `${outfit.character}/${outfit.outfit}` }" @click="chooseOutfit(openWardrobeFor!, outfit)">
              <span class="wardrobe-thumb" :class="{ 'missing-thumb': !outfit.thumbnail }"><img v-if="outfit.thumbnail" :src="`/mygo-assets/${outfit.outfit}.png`" :alt="`${outfitLabel(outfit.outfit)}预览`" loading="lazy" @error="hideBrokenThumbnail"><i aria-hidden="true">◇</i></span>
              <span>{{ outfitLabel(outfit.outfit) }}</span><b v-if="selectedCostumes[openWardrobeFor] === `${outfit.character}/${outfit.outfit}`">✓</b>
            </button>
          </div>
        </div>
        <div class="stage-characters" :class="{ solo: activeCharacters.length === 1 }">
          <div v-for="(character, index) in activeCharacters" :key="character.id" class="character-stage" :class="[`person-${index + 1}`, { talking: activeSpeaker === character.id }]" :style="{ '--person-color': character.color, '--person-tint': character.tint }">
            <div class="character-glow"></div>
            <div class="character-live2d">
              <Live2DStage :key="selectedCostumes[character.id]" :model-url="modelUrlFor(character.id)" :mood="(responseActor === character.id || (speaking && activeSpeaker === character.id)) ? 'smile' : (busy && activeSpeaker === 'you' && character.id === activeCharacters[0]?.id ? 'thinking' : 'gentle')" :speaking="speaking && activeSpeaker === character.id" :responding="responseActor === character.id" />
            </div>
          </div>
          <div v-if="activeCharacters.length === 1" class="empty-stage-slot"><span>＋</span><small>再邀请一位同行的人</small></div>
        </div>
        <div class="stage-floor"></div>
        <section class="dialogue-panel" :class="{ 'can-advance': !busy && pendingReplies.length > 0 }" aria-label="剧情对话" aria-live="polite" @click="advanceDialogue">
          <div class="dialogue-speaker" :style="{ '--person-color': lineSpeaker.color, '--person-tint': lineSpeaker.tint }">
            <span class="speaker-mark">{{ lineSpeaker.initial }}</span><strong>{{ lineSpeaker.name }}</strong>
          </div>
          <div class="dialogue-content">
            <p>{{ latestMessage?.text }}</p>
          </div>
          <button v-if="!busy && pendingReplies.length" class="advance-button" type="button" aria-label="显示下一句" @click.stop="advanceDialogue">
            <svg viewBox="0 0 16 12" aria-hidden="true" focusable="false"><path d="M1 1.5h14L8 10.5z" fill="currentColor" /></svg>
          </button>
        </section>
      </div>
      <form class="composer composer-dock" @submit.prevent="sendMessage()"><input v-model="input" :disabled="busy || pendingReplies.length > 0" placeholder="把今晚想说的话告诉她们…" aria-label="输入消息"><button type="button" class="voice-button" :class="{ playing: speaking }" aria-label="切换语音朗读" @click="toggleSpeech">{{ speaking ? 'Ⅱ' : '♫' }}</button><button type="submit" class="send-button" :disabled="busy || pendingReplies.length > 0 || !input.trim()">发送 <span>↗</span></button></form>
    </section>
  </main>
</template>
