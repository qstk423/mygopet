const { app, BrowserWindow, ipcMain, Menu, screen, powerMonitor } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const { classifyFocus, frontmostApplication } = require('./focus.cjs')
const base = process.env.MITU_APP_URL || 'http://127.0.0.1:5183/'
const origin = new URL(base).origin
let petWindow, mainWindow, cursorTimer, regions = [], dragging = false, ignoring = true
let focusTimer, ledgerTimer, focusFile, focusSeconds = 0, focusBusy = false, lastFocusTick = 0
let locked = false, suspended = false, preferencesReady = false
let focusPreferences = { enabled: true, study: false }
let focusState = { mode: 'waiting', active: false }
function writeFocusLedger() {
  if (!focusFile) return
  try { fs.writeFileSync(focusFile + '.tmp', JSON.stringify({ version: 1, seconds: focusSeconds })); fs.renameSync(focusFile + '.tmp', focusFile) } catch { focusState = { mode: 'save-error', active: false } }
}
const preferences = { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true }
function protect(win) {
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  win.webContents.on('will-navigate', (event, url) => { if (new URL(url).origin !== origin) event.preventDefault() })
}
function openMain() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    mainWindow = new BrowserWindow({ width: 1280, height: 820, minWidth: 960, minHeight: 600, title: '迷途之子', backgroundColor: '#142a43', webPreferences: preferences })
    protect(mainWindow); mainWindow.loadURL(base)
    mainWindow.on('closed', () => { mainWindow = null })
  } else { mainWindow.show(); mainWindow.focus() }
}
function known(event) { return [petWindow, mainWindow].some(win => win && !win.isDestroyed() && event.sender === win.webContents) }
app.whenReady().then(() => {
  focusFile = path.join(app.getPath('userData'), 'mitu-focus-progress.json')
  try { const data = JSON.parse(fs.readFileSync(focusFile, 'utf8')); if (data.version === 1 && Number.isFinite(data.seconds) && data.seconds >= 0) focusSeconds = data.seconds } catch { /* First run. */ }
  powerMonitor.on('lock-screen', () => { locked = true; lastFocusTick = 0; writeFocusLedger() })
  powerMonitor.on('unlock-screen', () => { locked = false; lastFocusTick = 0 })
  powerMonitor.on('suspend', () => { suspended = true; lastFocusTick = 0; writeFocusLedger() })
  powerMonitor.on('resume', () => { suspended = false; lastFocusTick = 0 })
  focusTimer = setInterval(async () => {
    if (focusBusy) return
    focusBusy = true
    const now = performance.now(), elapsed = lastFocusTick ? Math.min((now - lastFocusTick) / 1000, 3) : 0
    lastFocusTick = now
    try {
      const info = await frontmostApplication()
      const state = classifyFocus({ ...info, ...focusPreferences, locked, suspended, idleSeconds: powerMonitor.getSystemIdleTime() })
      // Both interval endpoints must qualify; app switches do not earn retroactive time.
      if (preferencesReady && state.active && focusState.active) focusSeconds += elapsed
      focusState = state
    } catch { focusState = { mode: 'unavailable', active: false } }
    finally { focusBusy = false }
  }, 2000)
  ledgerTimer = setInterval(writeFocusLedger, 15000)
  const area = screen.getPrimaryDisplay().workArea
  petWindow = new BrowserWindow({ ...area, transparent: true, frame: false, resizable: false, hasShadow: false, alwaysOnTop: true, skipTaskbar: true, show: false, backgroundColor: '#00000000', title: '迷途之子 · 桌宠', webPreferences: preferences })
  protect(petWindow)
  petWindow.setIgnoreMouseEvents(true, { forward: true })
  // Join macOS fullscreen Spaces without promoting the pet above system UI.
  petWindow.setAlwaysOnTop(true, 'floating')
  petWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  const url = new URL(base); url.searchParams.set('mode', 'pet')
  petWindow.loadURL(url.href)
  petWindow.once('ready-to-show', () => petWindow.showInactive())
  screen.on('display-metrics-changed', () => { if (petWindow && !petWindow.isDestroyed()) petWindow.setBounds(screen.getPrimaryDisplay().workArea) })
  cursorTimer = setInterval(() => {
    if (!petWindow || petWindow.isDestroyed() || !petWindow.isVisible()) return
    const cursor = screen.getCursorScreenPoint(), bounds = petWindow.getBounds()
    const x = cursor.x - bounds.x, y = cursor.y - bounds.y
    const next = !dragging && !regions.some(r => x >= r.x && y >= r.y && x <= r.x + r.width && y <= r.y + r.height)
    if (next !== ignoring) { ignoring = next; petWindow.setIgnoreMouseEvents(next, { forward: true }) }
  }, 16)
  Menu.setApplicationMenu(Menu.buildFromTemplate([{ label: '迷途之子', submenu: [
    { label: '显示桌宠', click: () => petWindow.showInactive() }, { label: '打开对话', click: openMain },
    { label: '隐藏桌宠', click: () => petWindow.hide() }, { type: 'separator' }, { role: 'quit', label: '退出' },
  ] }, { role: 'editMenu' }]))
  ipcMain.handle('pet:show', event => { if (known(event)) petWindow.showInactive() })
  ipcMain.handle('pet:main', event => { if (known(event)) openMain() })
  ipcMain.handle('pet:hide', event => { if (known(event)) petWindow.hide() })
  ipcMain.handle('pet:quit', event => { if (known(event)) app.quit() })
  ipcMain.handle('pet:focus-status', event => {
    if (event.sender !== petWindow.webContents) return null
    return { ...focusState, seconds: Math.floor(focusSeconds), supported: process.platform === 'darwin' }
  })
  ipcMain.handle('pet:focus-preferences', (event, value) => {
    if (event.sender !== petWindow.webContents || !value || typeof value.enabled !== 'boolean' || typeof value.study !== 'boolean') return
    focusPreferences = { enabled: value.enabled, study: value.study }; preferencesReady = true
    focusState = { mode: 'waiting', active: false }; lastFocusTick = 0
  })
  ipcMain.on('pet:regions', (event, value) => {
    if (event.sender !== petWindow.webContents || !Array.isArray(value)) return
    regions = value.slice(0, 12).filter(r => r && ['x','y','width','height'].every(k => Number.isFinite(r[k])) && r.width > 0 && r.height > 0).map(r => ({ x: r.x, y: r.y, width: Math.min(r.width, 2000), height: Math.min(r.height, 2000) }))
  })
  ipcMain.on('pet:dragging', (event, value) => { if (event.sender === petWindow.webContents) dragging = value === true })
  petWindow.webContents.on('render-process-gone', () => { dragging = false; regions = [] })
  app.on('activate', () => { if (petWindow && !petWindow.isDestroyed()) petWindow.showInactive() })
})
app.on('will-quit', () => { clearInterval(cursorTimer); clearInterval(focusTimer); clearInterval(ledgerTimer); writeFocusLedger() })
app.on('window-all-closed', () => app.quit())
