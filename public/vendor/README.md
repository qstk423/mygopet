# Cubism Core（本机开发依赖）

浏览器 Live2D 渲染需要 `live2dcubismcore.min.js`。本项目不分发该运行库。
如舰长决定继续使用 Cubism SDK，请从 Live2D 官方 SDK 获取，并自行确认/接受其许可；仅把本地开发用文件放到此目录。

本机开发时，把文件放进 `work/local-runtime/live2dcubismcore.min.js`；Vite 开发服务器会从该处加载。生产构建不会复制该文件。
