---
name: 迷途之子 — 像素桌宠局部扩展
description: MyGO 五人像素同行者、夜蓝互动背包与专注零食进度
colors:
  pet-ink: "#eaf3ff"
  pet-muted: "#aec3da"
  pet-night: "#142a43"
  pet-cyan: "#a6dbef"
  feed-surface: "#abd7e6"
  feed-ink: "#18344a"
  star-gold: "#f2d18c"
  footer-night: "#102239"
  speech-surface: "#eef6ff"
  speech-ink: "#17314b"
  focus-active-ink: "#bfe8d0"
  focus-active-dot: "#a2d2b7"
  focus-waiting-dot: "#829ab3"
  focus-control: "#23435e"
  progress-track: "#2c4660"
typography:
  body:
    fontFamily: "Noto Sans SC, PingFang SC, sans-serif"
  title:
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-.02em"
  item:
    fontSize: "14px"
    fontWeight: 500
  label:
    fontSize: "12px"
rounded:
  panel: "16px"
  speech: "14px"
  friend: "10px"
  quick: "8px"
  action: "7px"
  focus-control: "6px"
  focus-progress: "2px"
spacing:
  panel-inset: "24px"
  row-gap: "10px"
  compact-gap: "6px"
components:
  panel:
    backgroundColor: "{colors.pet-night}"
    textColor: "{colors.pet-ink}"
    rounded: "{rounded.panel}"
    width: "min(368px, calc(100vw - 24px))"
  feed-button:
    backgroundColor: "{colors.feed-surface}"
    textColor: "{colors.feed-ink}"
    rounded: "{rounded.action}"
    padding: "8px 13px"
  focus-control:
    backgroundColor: "{colors.focus-control}"
    textColor: "{colors.pet-ink}"
    rounded: "{rounded.focus-control}"
    padding: "6px 8px"
  focus-control-selected:
    backgroundColor: "{colors.feed-surface}"
    textColor: "{colors.feed-ink}"
    rounded: "{rounded.focus-control}"
    padding: "6px 8px"
---

# 像素桌宠设计记录

## Overview

「夜色小背包」：五位像素同行者悬浮在桌面，浅青动作与温暖星星让互动轻巧可读。本记录仅约束 `src/pet/` 的局部扩展；项目根目录 `DESIGN.md` 继续定义原有 Galgame 对话界面。

用户已接受五人像素素材与夜蓝方向。桌宠入口之外，原有 Galgame 的布局、Live2D 与视觉身份保留。目标设备是桌面；狭窄桌面侧栏属于布局适配，不代表移动端产品承诺。

## Colors

夜蓝面板、淡蓝白文字、雨蓝次级标签与浅青选中线延续既有世界。星星金额、奖励与可领取提示使用金色；食物图标分别采用饼干暖黄、抹茶绿与饭团灰白。浅色对白气泡在角色头上提供清楚反馈，不承载操作。

专注区继续使用雨蓝说明文字与浅青进度；只有「编程中」「学习中」使用柔绿文字和状态点。未开始、暂停、离开与不可用状态保留冷灰蓝点，并通过文字说明区别，不能仅依靠颜色辨认。

## Typography

使用 `Noto Sans SC`、`PingFang SC` 与系统无衬线回退。角色标题为 26px / 700，行高 1.3；栏目为 15px；食物和任务标题为 14px / 500；状态说明为 12–13px。对白气泡为 14px、行高 1.65。金额与亲密度采用等宽数字。

## Layout

角色容器基础尺寸为 144px，大小选择提供 0.8 / 1 / 1.3 倍，底部另留 36px 放置快捷按钮。面板最大宽 368px，视口两侧至少留 12px；常规布局在角色侧面展开，间距 18px。

当视口宽度小于「角色尺寸 + 368px + 60px」时，角色居中置于面板上方，避免角色与操作重叠。浏览器预览角色顶边为 160px，原生透明视窗为 110px；面板顶边位于角色顶边 + 角色尺寸 + 48px，剩余高度内滚动。此布局覆盖 319 × 827 的狭窄桌面侧栏。气泡最大宽 240px，其水平中心按视口边界限制；角色层位于面板之上。

面板侧展和上下堆叠均按实际顶边计算可用高度：视口高度减去面板顶边与底部 12px 留白，最小高度 130px，超出内容由面板滚动。不要只依靠固定最大高度，否则角色靠近下方时会裁掉底栏。

面板使用 24px 水平内距、70px 食物行、三列角色选择与固定内容顺序：角色与钱包、亲密度、饱腹与心情、专注区、背包／同行／奖励标签、当前内容、通知、底栏。专注区始终可见，不随标签切换隐藏；左右内距与正文对齐，底部间隔 20px。状态、学习按钮与暂停按钮占一行，下一份食物和 `mm:ss / 05:00` 占下一行，下面是细进度条。高度不超过 660px 时压缩头部、状态区和食物行。原生模式背景透明；浏览器预览保留夜间高架背景与返回对话入口。

## Elevation & Depth

面板以 `0 16px 56px #07162970` 提供独立浮窗深度；气泡使用 `0 6px 18px #07162930`，快捷操作使用 `0 3px 8px #07162930`。正文分区依靠细冷蓝分隔线，底栏使用更深夜蓝，避免给每条内容再套卡片。

## Shapes

面板圆角 16px、气泡 14px、角色选择 10px、快捷按钮 8px、投喂与奖励按钮 7px。专注开关使用 6px 圆角；进度条高 4px、圆角 2px，状态点为 5px 圆点。气泡以小三角指向角色。像素角色使用 `image-rendering: pixelated`，保留轮廓、校服差异和五人的辨识特征。

## Components

- **角色与快捷操作：** 点击摸头、拖动移动，右键开关面板；下方提供背包与休息按钮。Enter / Space 可摸头，Escape 收起面板。游走仅在面板关闭、未拖动、未休息且无互动动画时发生。
- **背包：** 三种食物在同一行呈现库存、投喂与星星购买；无库存、休息或饱腹达到 95 时禁用投喂。购买入口明确显示价格。
- **专注零食：** 使用当前图标系统的暂停／开启图标与原生 `progress` 元素，没有新增栅格图或独立视觉身份。「学习模式」为可切换按钮，以 `aria-pressed` 表达选中，选中时沿用投喂按钮的浅青底与深色字。计时按钮具有「暂停专注计时」／「开启专注计时」可访问名称；进度条标记为「下一份专注零食的进度」。每累计五分钟有效时间自动增加一份食物，按饼干、抹茶、饭团循环；下一份名称和已完成时间保持可见，奖励以面板通知和角色气泡反馈。单种库存上限为 99。
- **专注状态：** 原生桌面版显示「编程中」「学习中」「等待代码软件」或学习模式下的「等待浏览器或播放器」，以及「已暂停」「暂时离开」「锁屏或休眠中」「识别暂不可用」「计时保存失败」「请重新启动桌宠」。浏览器预览明确显示「桌面版可自动积攒零食」，学习和暂停按钮禁用，不模拟真实检测。
- **计时边界：** 当前实现通过 macOS 前台应用标识自动识别代码软件；代码软件连续无操作达到 120 秒停止积累，锁屏／休眠停止积累。用户手动开启学习模式后，支持的浏览器或播放器处于前台可积累时间，不要求观看时持续输入，也不判断视频内容是否属于学习。只读取前台应用标识和系统空闲时长，不读取窗口标题、屏幕或按键内容。应用关闭的时间不计入奖励。
- **同行：** 爱音、灯、乐奈、素世、立希共用三列选择网格；当前角色以蓝色底、细边与勾选标识共同区分。
- **奖励：** 每日见面、摸头、投喂与散步任务显示进度和星星奖励；未完成或已领取时禁用领取。可领取任务在栏目标签旁显示金色点。
- **底栏：** 自由散步 / 留在身边、悠闲 / 自然 / 活泼三档步速、三档大小、打开对话窗口。窄面板中采用两行网格，避免房屋按钮单独挤到下一行。亲密度、饱腹、心情和星星信息在面板上部集中呈现。
- **反馈与状态：** 气泡和面板通知使用 `role="status"`；持久化失败在通知区说明。可见焦点为 2px 浅青轮廓，偏移 3px；可用按钮悬停提亮至 1.16，禁用透明度为 0.42。
- **像素动画：** 保留已接受的 `/pets/mygo-pixel-atlas.png`，按实际不等高行裁切五人。短途散步每次横向移动约 72～177px、纵向仅轻微偏移，走完停留约 6.5～14 秒；三档巡航上限为 28 / 40 / 54px/s，起步与停步减速，临近屏幕边缘反向。两幅步行姿势和 3px 的起伏均按实际位移同步，不再出现角色原地滑步；进食使用第四列。拖动复用两幅步行姿势（每 180ms 换帧），按水平拖速倾斜、限制在 ±18°，辅以 360ms 的悬垂摆动；松手以 420ms 的落地回弹反馈，停止当前散步并短暂停留。呼吸、开心与进食延续 CSS 状态动画。另用 `/pets/mygo-coding-atlas.png` 的五人双帧图集承载第一种「编程陪伴待机」：原生专注识别进入编程状态时停止散步，每 1.4 秒换帧；休息、投喂、拖拽等互动优先于该状态，退出编程自动回到普通动作。减少动态效果偏好在启动及偏好变更时生效：停止自主游走、固定帧索引为 0，停用 CSS 动画与过渡，保留直接拖动并以静态提亮反馈拖动状态。原生悬浮窗使用 floating 层级，并设置跨工作区及全屏空间可见；实际全屏覆盖效果仍需原生验证。

## Do's and Don'ts

- Do 延续已确认的夜蓝、雨蓝、浅青与星星暖色，让人物素材先被看见。
- Do 以实际图集行带裁切素材，保留像素边缘；后续动作素材替换须核对五人辨识与校服差异。
- Do 在狭窄桌面窗口把人物放到面板上方，并保留面板滚动和气泡可读性。
- Do 保留专注状态文字、下一份零食与五分钟进度的连续阅读顺序；学习模式必须由用户主动开启。
- Don't 将浏览器／播放器识别描述成视频内容分析，或让网页预览宣称已检测到专注。
- Don't 将此局部记录升级为原 Galgame 的全局设计规则，或更换根目录设计规范。
- Don't 把生成同人栅格图称作官方动作资产或 Live2D 模型。当前桌宠存档使用独立的 `mitu-pixel-pet-v1`，不能宣称已与对话共享状态。
- Don't 将浏览器布局检查视为原生透明窗口全部验证：原生指针行为仅部分验证，Windows 安装包尚未产出。

本轮专注区的桌面与窄窗浏览器布局截图位于 `.impeccable/review/pet-focus/desktop.jpg` 与 `.impeccable/review/pet-focus/narrow.jpg`，局部 UI 审阅结论为可交付；25 项测试及构建通过。此证据覆盖实现逻辑和浏览器布局，原生点击穿透及前台应用检测的运行时行为仍未完整验证，不能称为已通过原生验收。

本轮动作检查截图位于 `.impeccable/review/pet-motion/wide.jpg`、`walking.jpg` 与 `narrow.jpg`；浏览器拖动操作验证了松手后进入落地状态。最终审阅要求修复减少动态效果仍会自主游走和换帧的问题，修复后结论为可交付；现有 25 项状态测试及构建通过。浏览器证据不覆盖原生全屏应用上方显示、原生拖动或点击穿透行为，这些运行时行为尚未完成验收。

来源：`src/pet/PetApp.vue`、`src/pet/pet.css`、`src/pet/PetSprite.vue`、`src/pet/petState.ts`、`desktop/focus.cjs`、`desktop/main.cjs`、`desktop/preload.cjs` 与 `docs/pet-surface.md`。本记录描述当前实现，不扩大功能或平台承诺；根目录 `DESIGN.md` 和 `.impeccable/design.json` 保留。
