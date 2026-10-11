<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Application } from 'pixi.js'

declare global {
  interface Window {
    PIXI?: unknown
    Live2D?: unknown
  }
}

type Mood = 'gentle' | 'smile' | 'thinking' | 'sad' | 'surprised'
type ModelSettings = {
  url?: string
  motions?: Record<string, unknown>
  expressions?: Array<{ name: string; file: string }>
}

const props = defineProps<{ modelUrl: string; mood: Mood; speaking: boolean; responding: boolean }>()
const host = ref<HTMLDivElement | null>(null)
const loading = ref(true)
const status = ref('正在准备 Live2D 舞台')
const error = ref('')

let app: Application | null = null
let model: any = null
let modelSettings: ModelSettings | null = null
let resizeObserver: ResizeObserver | null = null
let loadTimeout = 0
let lastResponseMotion = ''
const forceMotionPriority = 3

const expressionForMood: Record<Mood, string> = {
  gentle: 'idle',
  smile: 'smile01',
  thinking: 'thinking01',
  sad: 'sad01',
  surprised: 'surprised01',
}

function fitModel() {
  if (!host.value || !app || !model) return
  const width = host.value.clientWidth
  const height = host.value.clientHeight
  const modelWidth = model.internalModel.width
  const modelHeight = model.internalModel.height
  if (!modelWidth || !modelHeight) return
  app.renderer.resize(width, height)
  const fit = Math.min((width * 0.98) / modelWidth, (height * 1.02) / modelHeight)
  model.scale.set(fit)
  model.x = width / 2
  model.y = height * 0.93
}

function clearModel() {
  if (!app) return
  app.stage.removeChildren()
  model?.destroy()
  model = null
  modelSettings = null
}

async function loadModel() {
  if (!host.value) return
  loading.value = true
  error.value = ''
  status.value = '正在读取角色与服装…'
  window.clearTimeout(loadTimeout)
  loadTimeout = window.setTimeout(() => {
    if (!loading.value) return
    status.value = '模型读取时间有些久'
    error.value = '请检查模型文件是否完整，再刷新页面重试。'
    loading.value = false
  }, 30000)

  try {
    if (!window.Live2D) throw new Error('MyGO 模型运行环境尚未就绪，请确认本地资源目录完整。')
    const PIXI = await import('pixi.js')
    window.PIXI = PIXI
    const { Live2DModel, MotionPreloadStrategy } = await import('pixi-live2d-display/cubism2')
    if (!app) {
      app = new PIXI.Application({
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        resizeTo: host.value,
      })
      host.value.appendChild(app.view as HTMLCanvasElement)
      resizeObserver = new ResizeObserver(fitModel)
      resizeObserver.observe(host.value)
    }

    clearModel()
    const response = await fetch(props.modelUrl)
    if (!response.ok) throw new Error(`模型清单读取失败（${response.status}）`)
    const settings = await response.json() as ModelSettings
    settings.url = props.modelUrl
    if (settings.motions && !settings.motions.idle && settings.motions.idle01) {
      settings.motions.idle = settings.motions.idle01
    }
    if (settings.expressions && !settings.expressions.some((expression) => expression.name === 'idle')) {
      const idle = settings.expressions.find((expression) => expression.name === 'idle01')
      if (idle) settings.expressions.push({ ...idle, name: 'idle' })
    }
    modelSettings = settings
    model = await Live2DModel.from(settings, { motionPreload: MotionPreloadStrategy.IDLE, autoInteract: true })
    app.stage.addChild(model)
    model.anchor.set(0.5, 1)
    fitModel()
    model.motion('idle', 0)
    applyMood(props.mood)
    if (props.responding || props.speaking) playResponseMotion()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '模型加载失败，请检查模型目录。'
    status.value = '模型暂时没有加载成功'
  } finally {
    window.clearTimeout(loadTimeout)
    loading.value = false
  }
}

function applyMood(mood: Mood) {
  if (!model || !modelSettings) return
  const preferred = expressionForMood[mood]
  const expression = modelSettings.expressions?.find((item) => item.name === preferred)
    ?? modelSettings.expressions?.find((item) => item.name === 'idle')
  if (expression) model.expression(expression.name)

  const motion = mood === 'thinking' ? 'thinking01'
      : mood === 'sad' ? 'sad01'
        : mood === 'surprised' ? 'surprised01' : ''
  if (motion && modelSettings.motions?.[motion]) void model.motion(motion, 0)
}

function playResponseMotion() {
  if (!model || !modelSettings?.motions) return
  // Each MyGO motion group contains one clip at index 0. Favor gestures over face-only smiles.
  const available = ['kandou01', 'kime01', 'kandou02', 'kime02', 'smile01']
    .filter((name) => modelSettings?.motions?.[name])
  if (!available.length) return
  const choices = available.length > 1
    ? available.filter((name) => name !== lastResponseMotion)
    : available
  const motion = choices[Math.floor(Math.random() * choices.length)]
  lastResponseMotion = motion
  model.expression(modelSettings.expressions?.some((item) => item.name === 'smile01') ? 'smile01' : 'idle')
  void model.motion(motion, 0, forceMotionPriority)
}

watch(() => props.modelUrl, () => void loadModel())
watch(() => props.mood, applyMood)
watch(() => props.responding, (responding) => { if (responding) playResponseMotion() })
watch(() => props.speaking, (speaking) => { if (speaking) playResponseMotion() })

onMounted(() => void loadModel())
onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  window.clearTimeout(loadTimeout)
  model?.destroy()
  app?.destroy(true, { children: true, texture: true, baseTexture: true })
})
</script>

<template>
  <div ref="host" class="live2d-stage" aria-label="Live2D 角色舞台">
    <div v-if="loading" class="model-status">{{ status }}</div>
    <div v-else-if="error" class="model-status model-status--notice">
      <span class="status-flower" aria-hidden="true">✿</span>
      <strong>{{ status }}</strong>
      <span>{{ error }}</span>
      <small>模型和运行文件只在本机读取，不会进入公开构建包。</small>
    </div>
  </div>
</template>
