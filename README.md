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

## 本地启用 Live2D

对话页的五位 MyGO 角色及衣装来自第三方项目 [panxuc/live2d-widget-mygo](https://github.com/panxuc/live2d-widget-mygo)，不包含在本仓库中。若要在自己的电脑上预览 Live2D，请先在项目根目录执行：

```sh
git clone --depth 1 https://github.com/panxuc/live2d-widget-mygo.git work/mygo-reference
npm ci
npm run desktop
```

项目的开发服务器会从 `work/mygo-reference/public/model` 读取角色与衣装，并使用同目录项目提供的 Cubism 2 运行脚本。无需把模型复制到 `public/models`。如果已经下载过该上游仓库，保留原目录即可，不要重复克隆。浏览器开发预览也可在准备好模型后运行 `npm run dev`。

目前这套接入只在**本地开发服务器**提供模型资源；`npm run build` 产物和公开仓库均不包含这些文件。直接运行构建预览或把前端产物部署到其他机器时，Live2D 不会自动出现。像素桌宠不依赖这套 Live2D 模型。

## 素材与功能边界

本仓库不包含 MyGO Live2D 模型、衣装、Cubism 运行库及其下载包。上游说明模型来自游戏数据，标注仅供学习交流、请勿商用；上游代码的 MIT 许可不能被视为游戏角色素材的再分发或商用授权。因此这些素材暂留本地，公开发布、比赛提交包含素材的安装包前都需要另行核实权利方要求。像素桌宠图与场景背景为本项目生成素材，来源记录在 `public/pets/*.prompt.json` 和 [ASSETS.md](ASSETS.md)。角色设定及相关名称归原权利方；本项目不是官方作品。

当前不包含可用的 LLM、TTS、YOLO 或 QQ 接入。桌宠玩法、专注检测及其限制详见 [桌宠说明](docs/desktop-pet.md)。
