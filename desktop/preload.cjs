const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('desktopPet', {
  showPet: () => ipcRenderer.invoke('pet:show'),
  openMain: () => ipcRenderer.invoke('pet:main'),
  hidePet: () => ipcRenderer.invoke('pet:hide'),
  quit: () => ipcRenderer.invoke('pet:quit'),
  getFocusStatus: () => ipcRenderer.invoke('pet:focus-status'),
  setFocusPreferences: preferences => ipcRenderer.invoke('pet:focus-preferences', preferences),
  setHitRegions: regions => ipcRenderer.send('pet:regions', regions),
  setDragging: dragging => ipcRenderer.send('pet:dragging', dragging),
})
