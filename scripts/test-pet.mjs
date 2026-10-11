import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { createRequire } from 'node:module'
const { classifyFocus } = createRequire(import.meta.url)('../desktop/focus.cjs')
const source = ts.transpileModule(readFileSync('src/pet/petState.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const p = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
const motionSource = ts.transpileModule(readFileSync('src/pet/petMotion.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const m = await import(`data:text/javascript;base64,${Buffer.from(motionSource).toString('base64')}`)
let passed = 0
function test(name, run) { run(); passed++; console.log(`通过：${name}`) }
test('损坏存档安全恢复', () => assert.equal(p.parsePetSave('{').selected, 'anon'))
test('异常数值被限制', () => { const s = p.createPetSave(); s.stars = -100; s.settings.scale = 99; const r = p.parsePetSave(JSON.stringify(s)); assert.equal(r.stars, 0); assert.equal(r.settings.scale, 1.6) })
test('旧存档与未知步速回退自然档', () => { const s = p.createPetSave(); delete s.settings.pace; assert.equal(p.parsePetSave(JSON.stringify(s)).settings.pace, 'normal'); s.settings.pace = 'warp'; assert.equal(p.parsePetSave(JSON.stringify(s)).settings.pace, 'normal') })
test('喜欢的食物消费一份并增加八点亲密度', () => { const s = p.createPetSave(); assert.equal(p.feedPet(s, 'biscuit').xp, 8); assert.equal(s.inventory.biscuit, 2); assert.equal(s.friends.anon.xp, 8) })
test('无库存不可投喂', () => { const s = p.createPetSave(); s.inventory.rice = 0; assert.equal(p.feedPet(s, 'rice').ok, false); assert.equal(s.daily.feeds, 0) })
test('饱腹不扣库存', () => { const s = p.createPetSave(); s.friends.anon.fullness = 100; assert.equal(p.feedPet(s, 'biscuit').ok, false); assert.equal(s.inventory.biscuit, 3) })
test('购买正确扣费', () => { const s = p.createPetSave(); assert.equal(p.buyFood(s, 'rice'), true); assert.equal(s.stars, 18); assert.equal(s.inventory.rice, 3) })
test('余额不足不扣费', () => { const s = p.createPetSave(); s.stars = 0; assert.equal(p.buyFood(s, 'rice'), false); assert.equal(s.inventory.rice, 2) })
test('奖励不可重复领取', () => { const s = p.createPetSave(); assert.equal(p.claimReward(s, 'checkin'), 12); assert.equal(p.claimReward(s, 'checkin'), 0); assert.equal(s.stars, 36) })
test('未完成任务不能领取', () => assert.equal(p.claimReward(p.createPetSave(), 'walk'), 0))
test('新的一天重置任务但保留资产', () => { const s = p.createPetSave(); s.daily.day = 'old'; s.daily.pats = 100; p.refreshPetSave(s); assert.equal(s.daily.pats, 0); assert.equal(s.stars, 24) })
test('切换角色亲密度独立', () => { const s = p.createPetSave(); p.patPet(s); s.selected = 'soyo'; assert.equal(s.friends.soyo.xp, 0); assert.equal(s.friends.anon.xp, 2) })
test('亲密等级边界', () => { assert.equal(p.affinity(19).level, 1); assert.equal(p.affinity(20).level, 2); assert.equal(p.affinity(360).progress, 1) })
test('旧存档升级保留库存并初始化专注', () => { const s = p.createPetSave(); delete s.focus; const r = p.parsePetSave(JSON.stringify(s)); assert.equal(r.inventory.biscuit, 3); assert.equal(r.focus.seconds, 0) })
test('首次连接不补发历史原生时间', () => { const s = p.createPetSave(); assert.deepEqual(p.creditFocusSource(s, 1000), []); assert.equal(s.focus.seconds, 0) })
test('五分钟前无奖励，满五分钟得饼干', () => { const s = p.createPetSave(); p.creditFocusSource(s, 0); p.creditFocusSource(s, 299); assert.equal(s.inventory.biscuit, 3); assert.deepEqual(p.creditFocusSource(s, 300), ['biscuit']); assert.equal(s.inventory.biscuit, 4) })
test('十五分钟三种食物轮流发放', () => { const s = p.createPetSave(); p.creditFocusSource(s, 0); assert.deepEqual(p.creditFocusSource(s, 900), ['biscuit', 'matcha', 'rice']); assert.equal(p.focusProgress(s).next, 'biscuit') })
test('重复轮询和恢复不重复发放', () => { const s = p.createPetSave(); p.creditFocusSource(s, 0); p.creditFocusSource(s, 300); const r = p.parsePetSave(JSON.stringify(s)); assert.deepEqual(p.creditFocusSource(r, 300), []); assert.equal(r.inventory.biscuit, 4) })
test('计时器重置不会制造奖励', () => { const s = p.createPetSave(); p.creditFocusSource(s, 900); p.creditFocusSource(s, 0); assert.equal(s.focus.seconds, 0) })
test('满背包不溢出，大间隔有界处理', () => { const s = p.createPetSave(); s.inventory = {biscuit:99,matcha:99,rice:99}; p.creditFocusSource(s, 0); assert.deepEqual(p.creditFocusSource(s, 1e9), []); assert.equal(s.inventory.rice, 99) })
test('非代码应用不开启计时', () => assert.equal(classifyFocus({bundle:'com.apple.finder'}).active, false))
test('代码软件识别与闲置暂停', () => { assert.equal(classifyFocus({bundle:'com.microsoft.VSCode'}).mode, 'coding'); assert.equal(classifyFocus({bundle:'com.microsoft.VSCode',idleSeconds:120}).active, false) })
test('普通浏览器不自动当学习', () => assert.equal(classifyFocus({bundle:'com.apple.Safari'}).active, false))
test('显式学习模式允许无操作看视频', () => assert.equal(classifyFocus({bundle:'com.apple.Safari',study:true,idleSeconds:600}).mode, 'study'))
test('学习模式切换到其他应用暂停', () => assert.equal(classifyFocus({bundle:'com.apple.finder',study:true}).active, false))
test('锁屏、休眠、识别失败和用户暂停均不计时', () => { for (const override of [{locked:true},{suspended:true},{error:true},{enabled:false}]) assert.equal(classifyFocus({bundle:'com.microsoft.VSCode', ...override}).active, false) })
test('散步先停留，出发距离有限且贴近原位', () => { const state = m.createRoamState(0, { x: 200, y: 200 }, () => 0); const bounds = { minX: 8, maxX: 900, minY: 140, maxY: 700 }; assert.equal(m.advanceRoam(state, { x: 200, y: 200 }, bounds, 'normal', 2000, .05, () => 0).moving, false); const step = m.advanceRoam(state, { x: 200, y: 200 }, bounds, 'normal', 3500, .05, () => 0); assert.equal(step.moving, true); assert.ok(Math.abs(state.target.x - 200) <= 177); assert.ok(Math.abs(state.target.y - 200) <= 14) })
test('靠近屏幕边缘时反向，不会卡着边界踏步', () => { const state = m.createRoamState(0, { x: 198, y: 200 }, () => 0); const bounds = { minX: 8, maxX: 200, minY: 140, maxY: 700 }; const result = m.advanceRoam(state, { x: 198, y: 200 }, bounds, 'normal', 3500, .05, () => .7); assert.equal(result.facing, -1); assert.ok(state.target.x < 198) })
test('活泼档比悠闲档走得快，步伐帧跟随实际位移', () => { const bounds = { minX: 8, maxX: 500, minY: 140, maxY: 700 }; const slow = { phase: 'walk', target: { x: 300, y: 200 }, traveled: 40, nextAt: 0 }; const fast = structuredClone(slow); const a = m.advanceRoam(slow, { x: 100, y: 200 }, bounds, 'calm', 1000, .3); const b = m.advanceRoam(fast, { x: 100, y: 200 }, bounds, 'lively', 1000, .3); assert.ok(b.position.x > a.position.x); assert.equal(a.frame, Math.floor(slow.traveled / 9) % 2); assert.equal(b.frame, Math.floor(fast.traveled / 9) % 2) })
test('到达后真正休息，暂停后也不会立即重启散步', () => { const state = { phase: 'walk', target: { x: 110, y: 200 }, traveled: 50, nextAt: 0 }; const bounds = { minX: 8, maxX: 500, minY: 140, maxY: 700 }; const result = m.advanceRoam(state, { x: 100, y: 200 }, bounds, 'normal', 1000, 1, () => 0); assert.equal(state.phase, 'rest'); assert.ok(result.walkSeconds > 0); assert.equal(m.advanceRoam(state, result.position, bounds, 'normal', 1100, .05).moving, false); m.pauseRoam(state, result.position, 2000); assert.equal(m.advanceRoam(state, result.position, bounds, 'normal', 3000, .05).moving, false) })
console.log(`${passed} 项全部通过`)
