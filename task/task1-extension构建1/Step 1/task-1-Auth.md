## 目标和效果
### 目标
完成 Auth（U-0 未登录 / A-0 登录 / A-0 注册 / U-1 已登录）四态在 popup 内的最小可用实现；启用 `features/auth/` 与必要的通用 UI 组件；提供本地 Mock 登录流程与状态持久化；移除 Step 0 的临时类型假值目录。

### 效果 - 用户直观体验
- 浏览器工具栏 → 点击扩展图标（popup）
  - 首次为 U-0：显示未登录提示与“立即登录”按钮、用量说明、FAB 开关、辅助链接与版本号。
  - 点击“立即登录”先进入 A-0 登录：邮箱/密码表单、主按钮、底部条款提示与“前往注册”链接。
  - A-0 登录可跳转至 A-0 注册：用户名/邮箱/密码/确认密码四项表单，底部提供“已有账号？登录”和返回入口。
  - 登录或注册成功后切换至 U-1：显示账户信息、云同步状态、Prompt 存储、FAB 开关与操作按钮。
  - 登录/注册页面均可“返回入口”（返回 U-0）。

### 说明
- 本步仅在 popup 内实现 U-0 / A-0 / U-1 四态与完整交互，不接入真实后端；会话与设置状态保存在 `chrome.storage.local`，刷新 popup 后仍能恢复。
- 本步要求在 popup 中对 Auth 四态做到与 `docs/ui4-static.html` 一比一的内容、交互与样式还原：包含文案、图标（可用 inline SVG 视觉等价实现）、主按钮蓝紫渐变、尺寸与间距、切换/提示的轻微动效等（除另行标注为“占位”的元素外）。
- UI 与尺寸严格对齐原型（`docs/ui4-static.html`）的 Auth 片段：进度条≈10px、高度；开关≈44×24px；卡片内边距≈12px；区块/行距≈8–12px；输入与按钮≈36px；主按钮采用蓝紫渐变（from-blue-500 to-purple-600）；关键切换/提示采用约 0.24s 淡入动效；popup 视图固定锚定在浏览器扩展图标位置且不可拖动，并在宽度上与原型保持一致的卡片视觉（固定最大宽度）。
- 本步持久化键约定（可复用到后续步骤）：
  - `pm.auth.session`: `{ email: string, nickname?: string, tier?: "Pro"|"Free", lastSyncAt?: number }`（A-0 登录写入 / U-1 读取；Mock 值）
  - `pm.settings.showFab`: `boolean`（U-0/U-1 的 FAB 开关，仅写入设置，FAB 行为后续联动）
  - `pm.stats.localCount`: `number`（U-0 用于“本地存储进度条/剩余数量”展示；本步使用 Mock 数值，后续与 C-0/C-1 联动真实数据）
- A-0 登录成功后直接切换至 U-1，并显示“登录成功，正在同步”短暂态（Mock 约 2s）；U-1 同步状态展示“已同步 / 上次同步：刚刚”的文案占位。
- 登录/注册流程仅包含邮箱 + 密码表单与本地 mock 校验，暂不接入真实第三方授权；埋点事件以 console.info 代替，后续接入真实埋点。
- 严格按步启用：仅新增 `features/auth/`、`components/ui/`（最小 4 个组件）、`services/`（最小 2 个服务），以及修改 `popup/index.tsx` 挂载入口与 `package.json` 的 `manifest.permissions` 追加 `"storage"`。不新增与 Auth 无关的页面、权限或目录。
- 移除 `src/types/shims.d.ts`（Step 0 临时类型假值目录）；TS 类型通过依赖的 `@types/chrome`、`@types/react`、`@types/react-dom` 等真实类型补齐。
- 版本号显示（U-0/U-1 底部）本步可硬编码为占位文本，后续再与包版本对齐。


## 目录结构和目录启用总结

E:\solo dev\prompt manna - nnn\P2\extension
├── src
│   ├── features
│   │   └── auth                     # 新增：popup 四态视图（必要，承载 FR-U0/A0 登录/A0 注册/U1 全部交互）
│   │       ├── AuthRoot.tsx         # 必要：状态路由容器，负责四态渲染切换
│   │       ├── U0.tsx               # 必要：未登录视图（登录引导/限制/本地进度/FAB 开关/版本）
│   │       ├── A0Login.tsx          # 必要：登录视图（邮箱/密码表单、条款提示、跳转注册/返回入口）
│   │       ├── A0Register.tsx       # 必要：注册视图（用户名/邮箱/密码确认、跳转登录/返回入口）
│   │       └── U1.tsx               # 必要：已登录视图（账户信息/同步状态/存储/FAB 开关/操作按钮）
│   ├── components
│   │   └── ui                       # 新增：最小 UI 组件（必要，复用支撑四态）
│   │       ├── Button.tsx           # 必要：统一按钮风格/尺寸/加载态（主按钮/次按钮）
│   │       ├── Input.tsx            # 必要：文本输入（占位/出错态），用于 A-0 邮箱/密码
│   │       ├── Toggle.tsx           # 必要：开关，用于 U-0/U-1 的 FAB 开关
│   │       └── ProgressBar.tsx      # 必要：进度条，用于 U-0 本地存储占用展示
│   ├── popup
│   │   ├── AuthPlaceholder.tsx      # 移除：之前的4件套占位组件，现在src/popup/index.tsx 只渲染 AuthRoot不在引用AuthPlaceholder.tsx因此删除
│   │   └── index.tsx                # 修改：挂载 `features/auth/AuthRoot`（必要，替换 Step 0 占位）
│   ├── services                     # 新增：与数据与存储相关的最小服务
│   │   ├── storage.ts               # 必要：封装 `chrome.storage.local`（get/set/subscribe）
│   │   └── auth.ts                  # 必要：本地 Mock 会话（login/logout/getSession；写入/读取 `pm.auth.session`）
│   └── styles
│       └── globals.css              # 复用：沿用 Step 0，全局样式入口
├── package.json                     # 修改：仅追加权限 `"storage"`（必要，持久化会话与设置）
├── tsconfig.json                    # 复用（`jsx: react-jsx` 已就绪）
└── src/types                        # 移除：Step 0 临时类型假值目录（`shims.d.ts`，按步清理）

- 本步新增 3 个目录 8 个文件（`features/auth`、`components/ui`、`services`）。
- 启用理由汇总：
  - 四态视图与状态切换需要 `features/auth/*`；
  - A-0 表单、U-0/U-1 控件复用需要最小 `components/ui/*`；
  - 会话与设置持久化需要最小 `services/*` 与 `storage` 权限；
  - `popup/index.tsx` 仅承担挂载入口职责，替换 Step 0 占位。
- 未启用项（保持 Step 0 状态）：`background/*`、`contents/*`、与面板/右键相关权限与页面均不改动，避免越步启用。





## Step 1 task1｜任务清单

- T101：在 `extension/package.json` 的 `manifest.permissions` 追加 `"storage"`（仅此一项）；
  验收：`npm run dev/build` 生成的 `manifest.json` 均含 `permissions: ["contextMenus", "storage"]`；未改动其他权限与 `host_permissions`；加载扩展后可正常调用 `chrome.storage` 无权限告警。

- T102：新增 `src/services/storage.ts`（最小封装 `chrome.storage.local` 的 `get/set/subscribe`）；
  验收：可读写 `pm.*` 命名空间键；`subscribe(keys, cb)` 可在键值变化时回调并返回取消订阅函数；类型签名明确，编译通过。

- T103：新增 `src/services/auth.ts`（Mock 会话）实现 `login/logout/getSession`；
  验收：`login(email,pwd)` 写入 `pm.auth.session`（含 `email/tier/lastSyncAt`），并触发 2s “登录成功，正在同步”占位；`logout()` 清空会话；`getSession()` 读取并返回会话或 `null`；均基于 `storage.ts` 实现。

- T104：新增最小通用 UI 组件 `src/components/ui/`：`Button.tsx`、`Input.tsx`、`Toggle.tsx`、`ProgressBar.tsx`；
  验收：
  - `Button` 支持主/次样式、禁用/加载态，默认高度≈36px；主样式需支持蓝紫渐变（from-blue-500 to-purple-600）以还原原型主按钮；
  - `Input` 支持占位/错误态（A-0 使用），高度≈36px；
  - `Toggle` 尺寸≈44×24px，受控组件；
  - `ProgressBar` 高度≈10px，支持百分比与无障碍 `aria` 属性；
  以上组件均通过示例用法在 Auth 四态中被实际引用。

- T105：新增 `src/features/auth/AuthRoot.tsx`（状态路由容器）；
  验收：初始从 `pm.auth.session` 判定渲染 U-0/U-1；支持 U-0→A-0、A-0→U-1、U-1→U-0 的切换；监听 `pm.auth.session` 与 `pm.settings.showFab` 的变更（通过 `storage.subscribe`）并驱动 UI；关键用户动作以 `console.info` 打印埋点。

- T106：新增 `src/features/auth/U0.tsx`（未登录视图）；
  验收：
  - 展示“未登录”提示卡与“立即登录”按钮；
  - 展示“当前限制”（最多30条/本地存储/不同步）；
  - 展示“本地存储”进度：读取 `pm.stats.localCount`（Mock），显示占用条、剩余数文案；
  - 提供 FAB 开关（写入 `pm.settings.showFab`）；
  - 提供“打开 WebApp”按钮与底部版本号占位；
  - 点击登录进入 A-0；UI 尺寸与间距对齐原型。

- T107：新增 `src/features/auth/A0.tsx`（登录/注册视图）；
  验收：
  - 邮箱/密码两行输入，最小校验：邮箱格式含 `@`，密码长度≥6；主按钮禁用态直至通过校验；
  - 主按钮提交→调用 `login()`→显示“登录成功，正在同步”（约 2s，淡入动效≈0.24s）→切换 U-1；
  - 登录页仅保留邮箱/密码提交；注册页为四项表单，均打印 mock 埋点，无真实后端请求；
  - 展示“登录即表示同意条款与隐私”文案；
  - 提供“返回入口”操作返回 U-0；
  - UI 尺寸与间距对齐原型。

- T108：新增 `src/features/auth/U1.tsx`（已登录视图）；
  验收：
  - 展示用户信息（邮箱/昵称占位）与等级徽标（Free/Pro 占位）；
  - 展示 Prompt 存储“∞”占位；
  - 提供 FAB 开关（写入 `pm.settings.showFab`）；
  - 提供“打开 WebApp”和“注销登录”；注销后清空会话并切换 U-0；
  - UI 尺寸与间距对齐原型。

- T109：修改 `src/popup/index.tsx` 挂载 `features/auth/AuthRoot`；
  验收：替换 Step 0 的占位渲染；引入全局样式；设置 popup 根容器宽度与内边距以匹配原型卡片视觉（固定最大宽度、卡片边距与圆角等可通过 Tailwind + 全局样式实现）；点击扩展图标可看到四态流程。

- T110：删除 `src/types/shims.d.ts`（清理临时类型假值）；
  验收：类型检查无红线；`npm run dev/build` 编译通过；运行期无因类型缺失导致的报错。

- T111：埋点占位实现（`console.info`）；
  验收：覆盖关键节点：U-0 展示/点击登录/开关 FAB/打开 WebApp，A-0 登录进入/提交/跳转注册/返回，A-0 注册进入/提交/跳转登录/返回，U-1 展示/开关 FAB/注销/打开 WebApp；输出格式含事件名与最小上下文。

- T112：UI 对齐核验（与 `docs/ui4-static.html`）；
  验收：进度条≈10px，开关≈44×24px，输入/按钮≈36px，卡片内边距≈12px，区块/行距≈8–12px；主按钮采用蓝紫渐变；图标与文案与原型一致（可用 inline SVG 视觉等价实现）；关键切换/提示具备约 0.24s 轻微淡入动效；popup 视图锚定入口且不可拖动，并在宽度/圆角/阴影等外观上与原型保持像素级一致（Auth 四态部分要求一比一）。

- T113：联调与本地验证（仅限 popup/Auth；不触碰 background/contents）；
  验收：
  - 初次进入 U-0；点击“立即登录”进入 A-0；提交登录后进入 U-1 并显示“正在同步”短暂态；注销回到 U-0；
  - 切换 FAB 开关后重新打开 popup 状态仍保持；
  - 仅新增 `storage` 权限，`background/*`、`contents/*` 与面板/右键相关逻辑均未改动；
  - dev/prod 构建均可加载并验证上述流程。

- T114：文档更新与记录（本文件与必要备注）；
  验收：本文件“说明”“目录结构和目录启用总结”“任务清单”三处内容一致；记录运行命令与注意事项（沿用 Step 0 的运行方式），并标注本步移除临时类型假值与按步启用边界。

## Changelog（给 PM 看）
- Popup Auth 四态（U-0 / A-0 登录 / A-0 注册 / U-1）按最新原型落地，包含登录成功同步提示与 FAB 偏好持久化。
- 新增 `features/auth/`、`services/*` 与 `components/ui/*`，实现本地 Mock 登录、存储封装与统一 UI 体系。
- Popup 样式升级：接入全局渐变/卡片视觉、淡入动效与 1:1 间距；入口改为直接挂载 AuthRoot。
- 布局调优：popup 宽度锁定 360px，借助自动测量钩子随视图高度自适应，移除多余的内层居中/填充以展示完整卡片。


















