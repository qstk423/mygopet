# 迷途之子 · MyGO 桌宠原型

Vue + Electron 制作的 Galgame 对话页和像素桌宠原型。当前可选择五位角色、投喂互动、拖动与短途散步；走路有悠闲／自然／活泼三档步速，走一段会停下来休息。桌面版可在代码软件前台时累计专注零食，并切换到第一套编程陪伴待机动作。

## 本地运行

需要 Node.js 和 npm。在项目目录执行：

```sh
npm ci
npm run desktop
```

只看网页端可运行 `npm run dev`，打开终端显示的本地地址。桌宠浏览器预览使用 `?mode=pet-preview`；加上 `&demo=coding` 可以只查看编程动作，不会模拟软件检测或发放零食。

验证命令：`npm run test:pet`、`npm run build`。目前主要在 macOS 开发；Windows、安装包和正式发布尚未验证。

## 素材与功能边界

本仓库不包含 MyGO Live2D 模型、衣装、Cubism 运行库及其下载包；它们只用于本地研究，权利与再分发许可需另行核实。没有这些本地素材时，对话页的 Live2D 角色不会显示，像素桌宠仍可运行。像素桌宠图与场景背景为本项目生成素材，来源记录在 `public/pets/*.prompt.json` 和 [ASSETS.md](ASSETS.md)。角色设定及相关名称归原权利方；本项目不是官方作品，请勿将此仓库视为角色素材的商用许可。

当前不包含可用的 LLM、TTS、YOLO 或 QQ 接入。桌宠玩法、专注检测及其限制详见 [桌宠说明](docs/desktop-pet.md)。
