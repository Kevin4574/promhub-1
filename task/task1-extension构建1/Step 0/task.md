## 目标和效果
### 目标
工程与壳就位；三处入口能“出现对的位置”；内部可空，仅标注身份。

### 效果 - 用户直观体验
- 浏览器工具栏 → 点击扩展图标
  - 弹出一个小窗，只显示一句话：这是 Auth（登录/注册/已登录）区域。
  - 无任何可操作表单；可关闭。

- 网页右键菜单
  - 有选中文本时：出现“Notepad 占位”“快速保存 占位”两项。空白区域点击出现“Notepad 占位。
    - 点“Notepad 占位”：页面中间弹出一个覆盖层窗口，显示“这是 Notepad 占位”，可关闭。
    - 点“快速保存 占位”：弹出一个覆盖层窗口，显示“这是快速保存占位”，可关闭。
  - 无选中文本时：只出现“Notepad 占位”，点击后同上。

- 页面右下角
  - 固定出现一个圆形按钮“FAB 占位”（不可拖拽/吸附）。
  - 点击后，右侧会平滑滑出一个固定在右侧的 Extension Panel（Home/Find/C-0）占位面板：
    - 每次打开都会从一套相对克制的默认起始宽度开始（偏窄但不局促，不记忆上一次的拖拽结果），大多数网页在这个宽度下依然可以正常阅读、点击按钮、填写表单，不会有被压成“一条细缝”的感觉。
    - 当浏览器窗口足够宽、且继续挤压不会让宿主页面变得过窄时，面板以“挤压模式”存在：面板贴在右侧，原页面主体自然向左略微缩小，为右侧让出一条工作区，而不是整块被盖住。
    - 当窗口本身比较窄（例如浏览器半屏）或检测到再挤压会明显破坏阅读体验时，面板会更倾向于以“覆盖模式”出现，你能明显感觉到它是一个悬浮在上面的侧边工作区，而不是页面结构被硬生生挤坏。
    - 面板左缘提供一个 8～12px 的竖向“拉手”，用户可以在约 420px～1200px 区间拖拽调宽；拖拽时面板宽度和宿主内容的挤压/释放会通过平滑动画实时响应，手感接近“拖到哪儿就变到哪儿”。
  - 再次点击 FAB 或在面板内点击关闭：面板收回，宿主页面宽度恢复到原始状态。

- 说明
  - 仅位置与入口连通：看得到、点得到、弹得出、关得上。
  - 像素与逻辑范围：
    - Panel 部分：壳层（右侧挤压式布局）要基本对齐 `docs/原型图/extension-panel.html` 的尺寸和结构，包括右侧贴边、宽度区间、BrandBar / Content / Footer / Tabbar 等基础骨架。
    - 内部功能：不实现搜索/复制/收藏/编辑等业务逻辑，不读写任何业务数据；卡片列表、搜索框、分页器等均可作为静态占位 UI。

- 工程侧
  - 运行开发命令后，这三处入口（popup / background 右键 / content 融合的 FAB+Panel、E-0、C-1）都能按上面描述出现对应占位视图。


## 目录结构和目录启用总结

E:\solo dev\prompt manna - nnn\P2\extension
├── .plasmo                  # 工具生成的中间产物与模板（自动生成，不计入“启用源码”，不展开）
├── assets                   # 图标等静态资源（手动维护，不展开）
├── build                    # 构建产物输出（自动生成，不展开）
├── node_modules             # 依赖目录（自动生成，不展开）
├── src
│   ├── background
│   │   └── index.ts          # 为 MV3 Service Worker 入口（负责右键菜单、事件等），完成后：选中内容右键菜单出现“Notepad 占位”“快速保存 占位”，点击分别弹出对应占位窗口；未选中内容右键菜单出现“Notepad 占位”。
│   ├── components            # 为通用 ui 组件；
│   │   └── panel             # 为 extension panel 专用 ui 组件；
│   │       └── PanelShellPlaceholder.tsx       # 为 Extension Panel 右侧挤压式壳层（BrandBar / Content / Footer）占位，尺寸与结构参考 `docs/原型图/extension-panel.html`，供 Panel/C-0 复用。完成后点击 FAB 悬浮球，在页面右侧看到固定列的主面板壳，而不是居中的一坨文字。
│   ├── contents
│   │   ├── fab.tsx             # 为 FAB 悬浮球注入入口，完成后右下角出现一个圆形“FAB 占位”按钮（固定位置，无拖拽/吸附）。
│   │   ├── notepad-e0.tsx      # 为 E-0 Notepad 覆盖层入口。选内容或空白处点击菜单项弹出 Notepad（E-0）窗口，内有“这是 Notepad 占位”字样，支持关闭。
│   │   ├── panel.tsx           # 为 Extension Panel（Home/Find/C-0 共用壳）的注入入口。点击 FAB 悬浮球，在页面右侧滑出 Extension Panel（Home/Find/C-0 共用壳）挤压式面板列，内有占位文案如“Extension Panel（Home/Find/C-0）占位”，支持关闭。
│   │   └── quick-save-c1.tsx   # 为 C-1 Quick-Save 覆盖层入口。选内容点击菜单项弹出 Quick-Save（C-1）窗口，内有“这是快速保存占位”字样，支持关闭。
│   ├── popup
│   │   ├── AuthPlaceholder.tsx # 为为统一U-0/U-1/A-0 Auth 区域占位视图，只是先放在这里因为step0我们不开feature文件夹，到step1的时候会把`AuthPlaceholder.tsx`移到`feature/`中去。
│   │   └── index.tsx           # 为浏览器工具栏 popup 的物理入口。完成后点击浏览器工具栏上的扩展图标，会弹出一个小窗。小窗里只有简单的一行占位提示，比如“这是 Auth（登录/注册/已登录）区域”，没有任何表单或按钮可操作，可用右上角关闭。
│   ├── styles
│   │   └── globals.css         # 为全局样式挂载点（后续加入 Tailwind 指令与设计 tokens）。这步因为不涉及 UI 可能不会有什么代码。
│   └── types                   # 为选择启用。   
│       └── shims.d.ts          # 是 Step 0 的“临时假值清单”，用来堵住类型缺口（React/Plasmo/chrome 等），让代码“先亮起来不报错”。只影响开发期类型检查，不会打包进产物。到 Step 1 我们把真正需要的代码与类型补齐后，就可以把它连文件夹加代码文件删除。
├── .gitkeep                    # 空目录占位文件（手动维护，不展开；用于保留目录结构）
├── .postcssrc                  # PostCSS 配置（根级 JSON，替代 `config/postcss.config.cjs`）
├── package-lock.json           # 依赖锁定文件（npm 自动生成，不展开；建议纳入版本控制，不手动编辑）
├── package.json                # 工程脚本与 Plasmo manifest 配置出口（替代 `config/plasmo.config.ts`）
├── tailwind.config.ts          # Tailwind 定制（根级，替代 `config/tailwind.config.ts`）
└── tsconfig.json               # TS 编译与类型规则来源


- 本步共启用 12 个文件夹 14 个文件（不统计 `.plasmo/`、`build/`、`node_modules/`、`assets/` 的内部文件；不统计 `.gitkeep`、`package-lock.json`）。`src/ (核心代码目录)`、`package.json (项目包管理与 manifest 配置)`、`src/styles/ (全局样式与设计)`、`tailwind.config.ts (Tailwind 定制)`、`.postcssrc (PostCSS 配置)`、`tsconfig.json (TS 编译与类型规则)` 为基础锚点，不管做什么项目都需要先启用的。
- `src/background`、`src/contents`、`src/popup` 为三个入口目录，分别对应右键点击，页面覆盖层，浏览器扩展栏。这 3 部分内容 file 代码填充完成后可以看到对应位置出现对应标识。

note：Step 0 不启用 `features/`。占位内容直接写在各“入口文件”里（比如 `src/popup/index.tsx`、`src/contents/panel.tsx`、`src/contents/notepad-e0.tsx`、`src/contents/quick-save-c1.tsx`），让用户能点击入口就看到“这是 XXX”的文字。到 Step 1 才启用 `features/`，把真正的页面视图迁出入口文件，入口只负责挂载/路由/壳层。也就是说：Step 0 = 入口内内联占位，Step 1 = 启用 `features/` 做页面骨架。



## Step 0｜任务清单

- T001：初始化与安装依赖（Plasmo MV3 + React + TS + Tailwind）。包含设置 `dev/build` 脚本；验收：能执行开发命令，Plasmo 启动无报错。
- T002：在 `extension/package.json` 的 `manifest` 字段声明最小 `manifest`（name/version/permissions：`contextMenus`、host_permissions：`<all_urls>`），并声明 background（MV3 service_worker）、popup 与 content-scripts 挂载入口；验收：生成的 `manifest` 含上述键值。
- T003：配置 `tsconfig.json`（`jsx: react-jsx`、`strict` 合理值、`baseUrl` 与常用 `paths` 可空）；验收：TS 编译通过。
- T004：配置 Tailwind（`tailwind.config.ts`，位于 `extension` 根）与全局样式 `src/styles/globals.css`（含 `@tailwind base/components/utilities`）；本步不单独提供 PostCSS 配置；验收：样式可被入口引入无报错。
- T005：补充 `src/types/shims.d.ts` 假值声明（React/Plasmo/chrome 等最小声明）以消除类型缺口；验收：类型检查无红线。
- T006：实现 `src/popup/AuthPlaceholder.tsx`，输出文案“这是 Auth（登录/注册/已登录）区域。”；验收：组件可独立渲染。
- T007：实现 `src/popup/index.tsx`，挂载并仅渲染 `AuthPlaceholder`（引入 `globals.css`）；验收：点击扩展图标弹出小窗显示占位文案，可关闭。
- T008：实现 `src/contents/fab.tsx`，右下角固定圆形按钮“FAB 占位”（不可拖拽/吸附）。
  - 验收：任意页面右下角可见按钮，随滚动不动，点击有响应（具体打开对象见 T009）。
- T009：实现 `src/contents/panel.tsx`，将 Extension Panel 改为**右侧挤压式占位面板**：
  - 点击 FAB 后，在页面右侧滑出一个固定列的占位面板（Home/Find/C-0 共用壳），贴右侧，默认宽度约占视口 35%～40%，同时保证宿主页面至少保留约 60%（≥720px）的可视宽度；不足时自动切到覆盖模式。
  - 面板出现时，通过在页面中插入独立 `<style>`，基于 `:root` 变量与常见主容器（`html/body/#app/#root/#__next/...`）的 `box-sizing: border-box`、`width: 100%` 与右侧 `padding` 把宿主内容“轻度挤开”，并带有平滑过渡动画；当视口较窄或检测到继续挤压会让宿主宽度跌破安全阈值时，会更果断地切换为覆盖模式，避免把宿主压成一条细缝或导致布局明显错乱。
  - 再次点击 FAB 或点击面板内部的关闭按钮，面板收回，宿主页面恢复原始宽度。
  - 验收：点击 FAB 能在右侧看到占位面板列，页面明显被挤出一块工作区且仍可阅读原网页，再次点击或关闭按钮可以完全收回。
- T010：实现 `src/components/panel/PanelShellPlaceholder.tsx`，提供右侧挤压式的 BrandBar / Content / Footer 占位壳，供 `panel.tsx` 复用：
  - 壳层结构和尺寸参考 `docs/原型图/extension-panel.html`，但内部卡片、搜索、分页等仅为静态占位，不需实现真实数据与交互。
  - 壳层左缘提供可见的竖向拖拽条（约 8～12px），支持用户在约 480px～1200px 区间拖动调宽，宿主页面的挤压宽度同步变化；当拖拽超过宿主可承受范围时自动切换为覆盖模式。无需跨页面记忆宽度。
  - 验收：`panel.tsx` 不直接写布局，而是通过 `PanelShellPlaceholder` 渲染出右侧挤压式面板壳；默认宽度下宿主页面仍可正常阅读，通过拖拽左侧竖线可以明显改变面板宽度并保持平滑过渡。
- T011：实现 `src/contents/notepad-e0.tsx`，覆盖层显示“这是 Notepad 占位”，可关闭；验收：调用时覆盖层可见并可关闭。
- T012：实现 `src/contents/quick-save-c1.tsx`，覆盖层显示“这是快速保存占位”，可关闭；验收：调用时覆盖层可见并可关闭。
- T013：实现 `src/background/index.ts`，注册右键菜单：
  - 选中文本：出现“Notepad 占位”“快速保存 占位”；
  - 未选中文本：仅“Notepad 占位”；
  点击各项分别向对应 content-script 发送消息以打开 E-0/C-1；验收：右键菜单与弹层行为符合描述。
- T014：联调与本地验证三处入口：
  - popup：显示 Auth 占位；
  - background→右键：E-0/C-1 弹层；
  - content→FAB：可打开/关闭右侧挤压式 Panel 占位（而不是全屏居中覆盖层）；
  验收：看得到、点得到、弹得出、关得上。
- T015：记录运行命令与注意事项，勾选完成项；若存在临时类型假值，注明 Step 1 将移除 `src/types` 与相关占位实现；验收：`task.md` 更新到位。

## Changelog（给 PM 看）

【你能直接看到的效果】
- 点击浏览器扩展图标：弹出一个小窗，只显示一句提示话；可关闭
- 在网页里点击右键：
  - 选中文本时：能看到“Notepad 占位”“快速保存 占位”，点击后各自弹出占位窗口；可关闭
  - 未选中文本时：只看到“Notepad 占位”，点击后弹出占位窗口；可关闭
- 页面右下角固定一个“FAB 占位”圆形按钮；点击后在页面右侧滑出一个挤压式 Extension Panel（Home/Find/C-0）占位面板：每次以一套克制的默认起始宽度出现（不记忆上次拖拽），在大多数网站上会把原页面轻度“挤”到左侧而不是整块盖住；当视口较窄或再挤压会明显破坏阅读体验时，则更倾向于以覆盖模式出现，优先保证原页面不崩且内容仍可阅读，并且可以通过面板左侧的竖向拉手在约 480px～1200px 间顺滑调宽。

【工程状态（给同事）】
- 已生成最小 MV3 manifest（permissions: contextMenus / host_permissions: <all_urls> / background service_worker / popup / content-scripts / icons）
- TypeScript / Tailwind / PostCSS 可用；全局样式入口：`src/styles/globals.css`
- 为便于开发暂时添加了类型假值：`src/types/shims.d.ts`（后续移除）

【如何运行】
1) 安装依赖（仅首次）
   ```bash
   cd extension
   npm i
   ```
2) 开发调试
   ```bash
   npm run dev
   ```
   在浏览器扩展管理中选择“加载已解压的扩展程序”，然后选择：
   `E:\solo dev\prompt manna - nnn\P2\extension\build\chrome-mv3-dev`
3) 生产构建
   ```bash
   npm run build
   ```
   然后加载：
   `E:\solo dev\prompt manna - nnn\P2\extension\build\chrome-mv3-prod`

【下一步会做什么】
- 删除临时类型假值，用真实类型替换
- 将覆盖层的内联样式逐步改为 Tailwind
- 把 `AuthPlaceholder.tsx` 挪到 `features/` 目录

## Buglist（修复记录｜PM 可读）

- 右键菜单没有出现
  - 根因：打包出来的 manifest 没有写入权限（permissions: ["contextMenus"]、host_permissions: ["<all_urls>"]），浏览器不会展示右键菜单。
  - 解决：把权限直接声明到 `extension/package.json` 的 `manifest` 字段；清理多份冲突的 Plasmo 配置，仅保留单一来源；重新构建后菜单正常出现。

- FAB 点击没有弹出面板
  - 根因：消息只通过 `chrome.runtime` 发送，Service Worker 休眠或未转发时消息会丢失。
  - 解决：点击时同时通过 `chrome.runtime.sendMessage` 与 `window.postMessage` 广播；`panel.tsx` 同时监听两路消息，确保稳定打开/关闭覆盖层。

- 配置生效不稳定（manifest 权限在 dev 未写入）
  - 根因：仓库里同时存在多份 Plasmo 配置（ts/cjs），dev 下未正确采纳权限配置，导致生成的 manifest 缺少权限。
  - 解决：删除多余配置文件，改为在 `package.json` 中声明 `manifest`，作为唯一配置来源；验证 prod 构建与加载后权限稳定可见。

- 构建报错：JSON5: invalid character
  - 根因：`postcss.config.cjs` 在当前环境被误按 JSON5 解析（首字符 `module.exports` 的 `m`），构建被中断。
  - 解决：移除该文件，改用 `.postcssrc`（JSON 格式）/或暂不显式配置 PostCSS；构建恢复正常。

- 右侧挤压面板在部分复杂站点上导致页面被压得过窄甚至布局错乱
  - 根因：早期实现主要依赖简单的 `margin-right` / 宽度计算，在视口较窄或站点大量使用 `100vw`、多重 `fixed/absolute` 布局时，继续挤压会让宿主内容宽度跌破安全值，出现聊天区域被压成细条、页面黑屏或结构明显错乱等极端情况。
  - 解决：引入基于视口与宿主“安全最小宽度”的双层判断逻辑：先按视口宽度与安全阈值估算挤压/覆盖模式，再通过实测主内容容器宽度进行校正；同时改为在页面中插入独立 `<style>`，通过 `:root` 自定义变量与针对性选择器统一设置 `html/body/主容器` 的 `box-sizing: border-box` 与 `width: 100%`，以右侧 `padding` 挤出工作区，而不粗暴修改站点内部布局。窗口过窄或布局极端时更早退回覆盖模式，显著降低“打开面板导致页面崩掉”的风险。

- 其他稳定性微调
  - 在后台 `Service Worker` 激活/重载后也会立即创建右键菜单（`createOrUpdateContextMenus()` 启动即执行）。
  - manifest 中的 `name` 在生产包为 `Prompt Manna`，用于对外展示。

