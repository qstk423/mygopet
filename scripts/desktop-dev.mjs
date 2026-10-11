import { createServer } from 'vite'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const server = await createServer({ server: { host: '127.0.0.1', port: 5183, strictPort: false } })
await server.listen()
const url = server.resolvedUrls.local[0]
const env = { ...process.env, MITU_APP_URL: url }
delete env.ELECTRON_RUN_AS_NODE
const child = spawn(require('electron'), ['desktop/main.cjs'], { stdio: 'inherit', env })
console.log(`迷途之子桌宠已启动，网页预览：${url}?mode=pet-preview`)
let stopping = false
async function stop(code = 0) { if (stopping) return; stopping = true; child.kill(); await server.close(); process.exit(code) }
child.on('error', error => { console.error(error.message); void stop(1) })
child.on('exit', code => void stop(code ?? 0))
process.on('SIGINT', () => void stop()); process.on('SIGTERM', () => void stop())
