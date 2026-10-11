const { execFile } = require('node:child_process')
const CODING = /^(com\.microsoft\.VSCode(?:Insiders)?|com\.todesktop\.230313mzl4w4u92|com\.apple\.dt\.Xcode|com\.jetbrains\..+|com\.visualstudio\..+|com\.trae\..+|com\.zed\.Zed|com\.sublimetext\..+|dev\.zed\.Zed)$/i
const MEDIA = /^(com\.google\.Chrome(?:\..+)?|com\.apple\.Safari|org\.mozilla\.firefox|com\.microsoft\.edgemac|company\.thebrowser\.Browser|com\.bilibili\.bilibiliPC|com\.apple\.QuickTimePlayerX|com\.colliderli\.iina|org\.videolan\.vlc)$/i
function classifyFocus({ bundle = '', idleSeconds = 0, locked = false, suspended = false, enabled = true, study = false, error = false }) {
  if (!enabled) return { mode: 'paused', active: false }
  if (locked || suspended) return { mode: 'away', active: false }
  if (error) return { mode: 'unavailable', active: false }
  if (CODING.test(bundle)) return idleSeconds < 120 ? { mode: 'coding', active: true } : { mode: 'idle', active: false }
  // Explicit learning mode: passive video watching does not require typing.
  if (study && MEDIA.test(bundle)) return { mode: 'study', active: true }
  return { mode: 'waiting', active: false }
}
function frontmostApplication() {
  if (process.platform !== 'darwin') return Promise.reject(new Error('Unsupported platform'))
  // NSWorkspace metadata only: no AX permission, window title, screen or keystrokes.
  const script = "ObjC.import('AppKit'); var a = $.NSWorkspace.sharedWorkspace.frontmostApplication; JSON.stringify({bundle: a.bundleIdentifier ? a.bundleIdentifier.js : ''});"
  return new Promise((resolve, reject) => execFile('/usr/bin/osascript', ['-l', 'JavaScript', '-e', script], { timeout: 1800, maxBuffer: 4096 }, (error, stdout) => {
    if (error) return reject(error)
    try { const data = JSON.parse(stdout); resolve({ bundle: typeof data.bundle === 'string' ? data.bundle : '' }) } catch (e) { reject(e) }
  }))
}
module.exports = { classifyFocus, frontmostApplication }
