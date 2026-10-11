<script setup lang="ts">
import { computed } from 'vue'
import { pets, type PetId, type PetAction } from './petState'
const props = withDefaults(defineProps<{ character: PetId; action?: PetAction; direction?: number; frame?: number; tilt?: number }>(), { action: 'idle', direction: 1, frame: 0, tilt: 0 })
const pet = computed(() => pets.find(item => item.id === props.character)!)
const working = computed(() => props.action === 'working')
const column = computed(() => props.action === 'eating' ? 3 : ['walking', 'dragging'].includes(props.action) ? 1 + props.frame % 2 : 0)
// The approved raster has uneven vertical row bands; crop those actual bands.
const bands = [{ top: 0, height: 308 }, { top: 308, height: 279 }, { top: 587, height: 281 }, { top: 868, height: 280 }, { top: 1148, height: 254 }]
const crop = computed(() => bands[pet.value.row]!)
</script>

<template>
  <div class="pet-sprite" :class="`pet-sprite--${action}`" :style="{ '--sprite-sheet': working ? `url('/pets/mygo-coding-atlas.png')` : `url('/pets/mygo-pixel-atlas.png')`, '--sprite-x': working ? `${frame % 2 ? 67 : 28}%` : `${column * 100 / 3}%`, '--sprite-y': working ? `${pet.row * 25}%` : `${crop.top / (1402 - crop.height) * 100}%`, '--sprite-size': working ? '400% 500%' : `400% ${1402 / crop.height * 100}%`, '--pet-facing': direction < 0 ? '-1' : '1', '--drag-tilt': `${tilt}deg` }" role="img" :aria-label="`${pet.name}的像素桌宠`"></div>
</template>

<style scoped>
.pet-sprite { width: 100%; height: 100%; background-image: var(--sprite-sheet); background-size: var(--sprite-size); background-position: var(--sprite-x) var(--sprite-y); background-repeat: no-repeat; image-rendering: pixelated; transform: scaleX(var(--pet-facing)); transform-origin: center 90%; }
.pet-sprite--working { transform: scaleX(var(--pet-facing)) scale(.95); animation: pet-work-breathe 2.8s steps(2, end) infinite; }
@keyframes pet-work-breathe { 50% { transform: scaleX(var(--pet-facing)) scale(.95) translateY(-1px); } }
.pet-sprite--happy { animation: pet-celebrate .5s steps(3, end) 3; }
.pet-sprite--eating { animation: pet-munch .45s steps(2, end) infinite; }
.pet-sprite--idle { animation: pet-breathe 3s steps(2, end) infinite; }
.pet-sprite--sleeping { animation: pet-breathe 5s steps(2, end) infinite; filter: brightness(.85); }
.pet-sprite--walking { animation: pet-step .38s steps(2, end) infinite; }
.pet-sprite--dragging { transform-origin: center 25%; transform: rotate(var(--drag-tilt)) scaleX(var(--pet-facing)); animation: pet-dangle .36s steps(2, end) infinite; }
.pet-sprite--landing { animation: pet-land .42s ease-out both; }
@keyframes pet-step { 50% { transform: scaleX(var(--pet-facing)) translateY(-4px) rotate(2deg); } }
@keyframes pet-dangle { 50% { transform: rotate(var(--drag-tilt)) scaleX(var(--pet-facing)) translateY(3px) rotate(-5deg); } }
@keyframes pet-land { 0% { transform: scaleX(var(--pet-facing)) translateY(-5px); } 35% { transform: scaleX(var(--pet-facing)) scaleY(.92) scaleX(1.04); } 70% { transform: scaleX(var(--pet-facing)) translateY(-3px); } }
@keyframes pet-breathe { 50% { transform: scaleX(var(--pet-facing)) translateY(-2px); } }
@keyframes pet-celebrate { 50% { transform: scaleX(var(--pet-facing)) translateY(-9px); } }
@keyframes pet-munch { 50% { transform: scaleX(var(--pet-facing)) translateY(2px); } }
@media (prefers-reduced-motion: reduce) { .pet-sprite { animation: none; } .pet-sprite--dragging { transform: scaleX(var(--pet-facing)); filter: brightness(1.08); } }
</style>
