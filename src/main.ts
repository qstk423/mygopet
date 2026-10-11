import { createApp } from 'vue'
const mode = new URLSearchParams(location.search).get('mode')
if (mode === 'pet' || mode === 'pet-preview') {
  const [{ default: PetApp }] = await Promise.all([import('./pet/PetApp.vue'), import('./pet/pet.css')])
  createApp(PetApp).mount('#app')
} else {
  const [{ default: App }] = await Promise.all([import('./App.vue'), import('./style.css'), import('./theme-mygo.css')])
  createApp(App).mount('#app')
}
