# PRD｜Extension (目前只包含前端的要求)


## 0) Scope & Tech Baseline
* **总结**：扩展（React + Plasmo + Tailwind）和 webapp（React + Next + Tailwind）和 backend（Python + Fastapi + JWT + PostgreSQL）
* **范围（Scope）**：单一代码库（monorepo）承载三部分：Extension（Chrome MV3）、Webapp（Next.js）、Backend（FastAPI）。目标 v1 即直连后端（开发阶段允许本地 Mock 兜底）。埋点仅本地记录（不出网）。
* **前端 · Extension（浏览器扩展 ）**
  * 包含内容 = content script（右侧挤压式面板 + prompt 市场 + FAB）、popup（账户状态/登录按钮，登录/注册通过 WebAuthFlow 打开 WebApp）、background（右键/快捷键/发起 WebAuthFlow）；
  * **Framework**: React + **Plasmo** (MV3)
  * **Styling**: **TailwindCSS**（集中 tokens；仅用语义类/变量，不随手 px）
  * **Surfaces**:
    * content script：右侧“挤压式” Extension Panel（不遮挡网页，高度铺满；Home/Find/C-0）、可见性强的 FAB、小窗式覆盖层（E-0/E-1/C-1）
    * E-0/E-1/C-1 采用页面内覆盖层（Overlay），不新开浏览器窗口
    * popup：Auth 二状态（U-0 未登录 / U-1 已登录）
  * **background**：快捷键（唤起 Notepad 等）、右键菜单（空白仅“Notepad”；选中文本“Notepad/快速保存”）、消息桥、发起 WebAuthFlow（打开 Webapp 登录/注册小窗）
  * **Shell**：统一外壳（BrandBar / Content / FooterBar / Tabbar），Popup 与 CS 复用；BrandBar 右侧提供关闭按钮（X），行为与 ESC/遮罩关闭一致
  * **Storage（Extension）**：`chrome.storage.local`
    * `pm.prompts`（库）、`pm.favorites`（收藏引用）、`pm.settings`（开关/分类等）、`pm.notepadDraft`（E-0 全局草稿）、`pm.fabPosition`（全局小球位置）、`pm.auth`（会话标记）
  * **Permissions（MV3）**：`storage`、`contextMenus`、`clipboardWrite`、`scripting`、`activeTab`（最小权限原则）
  * **Offline**：本地优先；Find 离线降级为占位提示；恢复在线后后台自动同步（无显式提示）。Edge：在“边界/异常”中移除“一键同步”提示。Find 离线 → 展示占位，不触发网络；Home/库可全功能；恢复在线后静默补齐市场数据。
* **前端 · Webapp**
  * 包含内容 = 官网 + blog（ISR/SSG） + extension 的大屏网页版核心面板（CSR） + auth 登录/注册小页；
  * **Framework**：React + **Next.js** + **Tailwind**
  * **Pages/功能**：
    * Homepage（SSG/ISR）：产品介绍/功能说明
    * Blog（SSG/ISR）：团队教程/更新/Prompt 内容（md/mdx，前台只读）
    * Panel（CSR）：大屏版面板，在网页端还原 Extension 的 Home / Find / Save 核心能力（便于未安装扩展的用户使用）
    * Auth 小页：用于 WebAuthFlow 登录/注册的小窗页面（邮箱+密码为主，邮箱验证码为辅）；成功后重定向回扩展
  * **SEO/CSP**：禁用行内脚本；严格域白名单；与后端启用 CORS；不依赖第三方 Cookie（令牌基于 Bearer）
* **后端（Backend）**
  * 包含内容 = 核心：Auth（登录/鉴权/JWT）+ Data IO（Prompt CRUD + Market 只读）；配套：Security/CORS + DB/Config + Email（验证码） + Health（含 `/users/me` 基础身份查询）
  * **Framework**：Python + **FastAPI** + **PyJWT**
  * **数据库**：本地 SQLite（dev）/ 生产 PostgreSQL（建议）；ORM：SQLAlchemy/SQLModel；通用依赖注入 `get_db()`
  * **模块**（高层级概览）：
    * Auth：邮箱+密码登录、邮箱验证码登录、发送验证码、签发/校验 JWT
    * Users：当前用户基础信息（`/users/me`）
    * Prompts：我的 Prompt CRUD 与发布公开
    * Market：公开 Prompt 的只读查询
    * Security：密码哈希/鉴权、输入校验
    * Email：验证码邮件与频控
    * DB/Config：数据库连接、配置加载（`DATABASE_URL/JWT_SECRET/ALLOWED_ORIGINS/SMTP_*` 等）
    * Health：服务健康检查
  * **路由与版本**：统一前缀 `/api/v1`
  * **CORS**：仅允许 Webapp 域名与 Extension ID 来源；最小化允许域和方法
  * **安全**：密码哈希（bcrypt/argon2）、JWT HS256（默认有效期 7d，可配置）、可选刷新机制、验证码过期与节流、输入校验与输出转义
* **WebAuthBridge（Extension ↔ Webapp · PostMessage）**
* popup 点击“登录/注册” → 由扩展 popup 直接调用 `startAuthFlow(mode)`，通过 `window.open` 打开 WebApp Auth 小窗（`/auth/login`、`/auth/register`），统一附带 `client=extension&mode=login|register&relay=postmessage&relay_origin=<popup_origin>&state=<随机串>` 等参数
* WebApp 登录/注册成功 → 在小窗内根据 query 中的 `relay=postmessage`、`relay_origin`、`state` 等信息构造统一格式的 `AuthSession` 对象（`email/accessToken/refreshToken/tier/count/...`），通过 `postMessage` 发送 `{ type: "pm:auth:bridge", ok: true, state, session }` 给 opener（扩展 popup），由扩展校验 `origin` 与 `state` 后写入本地存储
* 扩展侧使用 `chrome.storage.local` 承载 `pm.auth.session`，并通过 `getSession/saveSession/subscribeSession` 进行读取与订阅；popup 基于订阅结果在 U-0/U-1 之间切换，后续请求以 `Authorization: Bearer <access_token>` 调用后端（refresh token 预留后续使用）
* 若中途失败/关闭 → WebApp 通过 `postMessage` 回传 `{ ok: false, error }` 或扩展在超时/小窗关闭时兜底提示；保持 U-0，可重试
* **Sync**：本地优先渲染；恢复在线后后台自动同步（静默）；冲突＝Server wins（按更新时间戳）
* **A11y**: 焦点管理、`role`/`aria-*` 与 reduced-motion 口径固定；DOM `id` 必须唯一；Tabbar 使用 `role=tablist`/`role=tab` + `aria-selected`（不使用 `aria-pressed`）；非激活项指针样式为 `cursor: pointer`，激活项为默认指针
* **Pixels**: **必须一致**（±0px 容忍）；动效口径固定（fast 150ms / normal 240ms）；下拉组件在固定面板尺寸内自适应翻转/收缩避免与底部 Tabbar 重叠
* **Browsers**: Chrome 120+（MV3），Edge 同步；Firefox 暂缓（后评估 polyfill）
* **Security/CSP**: 禁止 `eval`/行内脚本；仅可信域名；输入内容转义/去危险 HTML；最小权限；后端启用严格 CORS（仅 Webapp 域与 Extension ID）
* **Performance**: 打开面板首帧 ≤ 150ms（典型机器）；列表 ≥ 30 条时启用虚拟滚动；交互反馈 ≤ 100ms
* **i18n**: 初期固定 zh-CN；文案集中管理，后续可抽取为 tokens


### 页面清单（Screens / States）：

1. **Extension Panel · Home（我的）**

   * **Extension Panel · Home（我的）**
       * 数据源切换：库 / 收藏
       * 搜索、常用区（可选）、列表、页脚 Tabbar
   * **Extension Panel · Find（发现/市场）**
      * 浏览 / 复制 / 收藏；列表 + 页脚 Tabbar（Find 不支持直接编辑/保存）
  * **Extension Panel · C-0 （保存/编辑页）**
  * 标题（可选）、备注/使用说明、分类（固定枚举）、System Message（可选+放大编辑）、正文*、公开/私有开关；删除（仅编辑已有条目时可见，位于开关下方、底部操作栏上方，全宽危险样式）；保存/取消

2. **快速保存卡片（轻量表单）**

 * 标题（可选）、正文*、分类（可选）；快速保存（标题留空时以正文前 ~10 个字作为展示标题）
3. **E-0 Notepad（页面内覆盖层窗口）**
 * 全局笔记本：字数/行数统计、软换行；支持复制、保存为 Prompt（弹 C-1）、取消（草稿保留、下次恢复）

4. **E-1 放大编辑（页面内覆盖层窗口）**
 * 字段级放大编辑：出现在多行文本字段旁（如 C-0 正文/System Message、C-1 正文）；仅“完成/取消”两动作，完成回填原字段

5. **Auth（Extension Popup + WebApp）**

  * **U-0：未登录状态（popup）**：展示账号状态/本地限制，提供“登录/注册”按钮触发 WebAuthFlow。
  * **U-1：已登录状态（popup）**：展示账号信息、统计数据、Prompt 存储状态、FAB 开关与注销按钮。
  * **WebApp · Login**：`/auth/login` 小窗登录页（邮箱+密码，基础校验；成功后重定向到 `chrome.identity.getRedirectURL()`）。
  * **WebApp · Register**：`/auth/register` 小窗注册页（用户名+邮箱+密码+确认；成功后重定向或引导跳转登录页）。
5. **FAB 悬浮小球（pm-fab）**

   * 单击开 Panel；拖动仅移动；吸附边界


#### 各页面内容与功能（FR）

##### Extension部分

— Extension Panel · Home（我的）
- FR-HOME-001：搜索库/收藏，范围含标题/正文/System Message，回车触发筛选（Home 与 Find 一致）。
- FR-HOME-002：分段控件切换“库/收藏”，点击即切换，刷新列表与常用区。
- FR-HOME-003：常用区展示近90天使用频次降序（仅“复制”动作计数，含 Home·库/收藏与 Find 的复制）；并列按最近使用时间降序；在面板重新打开时重算。
- FR-HOME-004：分类下拉筛选列表；默认“全部”。
- FR-HOME-005：列表卡片支持复制（多策略兜底确保成功）与进入编辑（C-0）。复制内容规则：
  * 同时存在 System Message 与 正文 → 输出两段，格式：
    system message：\n{System Message}\n\nprompt：\n{正文}
  * 仅有正文 → 直接输出正文
 - FR-HOME-006：分页组件固定在列表下方；输入页码回车跳转；越界不跳转并给出轻量反馈（输入框抖动+红框 1.5s + 面板内底部居中 Toast，Esc 可关闭）。
- FR-HOME-007：页脚 Tabbar 在 Home/Find 间切换。
- FR-HOME-008：标题栏“X”可关闭面板；关闭后小球在原位置复现。
- FR-HOME-009：埋点：打开面板、切换数据源、搜索、筛选、复制、进入编辑、分页跳转、关闭等。
 - FR-HOME-010：顶部“新建”按钮可进入 C-0 创建全新条目（与 Find 一致）。
- FR-HOME-011：分类下拉包含系统默认（全部、编程、写作、商务、营销、翻译、其他）与用户自定义；下拉底部提供“新建分类”行动项。下拉内容超出时仅在下拉内滚动；下拉不得与底部栏重叠或越界。
- FR-HOME-012：Home 子状态：
  * 我的 - 库：卡片动作=复制、编辑。
  * 我的 - 收藏：卡片动作=复制、编辑、取消收藏；从收藏进入编辑：
    - 若保存：派生为“库”新条目，并从“收藏”移除该条；
    - 若取消：保持收藏条目不变。
 - FR-HOME-013：列表区域至少显示 10 条，支持垂直滚动浏览（与分页固定搭配）。
 - FR-HOME-014：常用区仅支持横向滑动查看；列表区为纵向滚动。

— Extension Panel · Find（发现/市场）
- FR-FIND-001：搜索市场数据（标题/正文/System Message），回车触发筛选。
- FR-FIND-002：卡片动作仅“复制、收藏”；不支持直接编辑/保存。
- FR-FIND-003：顶部“新建”按钮可进入 C-0 创建全新条目。
- FR-FIND-004：分类下拉筛选市场列表。
- FR-FIND-005：分页输入回车跳页，越界轻量反馈（同 Home）。
- FR-FIND-006：离线时显示离线占位提示，不展示列表。
- FR-FIND-007：页脚 Tabbar 可切换至 Home；标题栏“X”可关闭面板。
- FR-FIND-008：埋点：搜索、筛选、复制、收藏、分页、离线显示等。
- FR-FIND-009：分类下拉包含系统默认（全部、编程、写作、商务、营销、翻译、其他）与用户自定义；下拉底部提供“新建分类”行动项（样式与 Home 一致）。下拉内容超出时仅在下拉内滚动；下拉不得与底部栏重叠或越界。
 - FR-FIND-010：分页组件固定在列表下方（与 Home 行为一致）。
- FR-FIND-011：列表区域至少显示 15 条，支持垂直滚动浏览（与分页固定搭配）。

— Extension Panel · C-0（保存/编辑页）
 - FR-C0-001：字段：标题（可选，留空时用正文前~10字展示）、备注/使用说明、分类（系统默认+自定义，下拉支持“新建分类”行动项）、System Message（可选）、正文（必填）。
- FR-C0-002：正文与 System Message 提供“放大编辑”入口（E-1）。
- FR-C0-003：校验：正文必填；标题可空；其他按需可空；校验不通过禁止保存并提示。
- FR-C0-004：保存：写入“我的·库”；若来源于“收藏”编辑，保存派生为“库”新条目并切回库。
- FR-C0-005：取消：返回上一层列表（不刷新整页）。
- FR-C0-006：放大编辑：可进入 E-1 深度编辑，“完成”后回填至卡片。
- FR-C0-007：分类包含系统默认（全部、编程、写作、商务、营销、翻译、其他）与用户自定义；支持在下拉底部通过“新建分类”快速创建。
- FR-C0-008：埋点：进入来源（新建/编辑/收藏派生）、保存成功/失败、取消、放大编辑（E-1）入口点击等。
 - FR-C0-009：多行输入（正文、System Message）右下角提供“拉手”，仅支持向下拉伸，指针为斜向双箭头。
 - FR-C0-010：分类未选择时默认“其他”；分类下拉选项固定（全部、编程、写作、商务、营销、翻译、其他），超出时在下拉内上下滚动。
 - FR-C0-011：取消返回到打开 C-0 前所在的面板页面与位置。
 - FR-C0-012：删除：仅在“编辑已有条目”时显示“删除 Prompt”按钮；按钮位置在“正文”输入框下方、底部操作栏上方；按钮宽度与输入框一致（w-full），尺寸与其他主要按钮一致（h-9、text-sm、rounded-lg），采用危险样式（红色系，默认 bg-red-500，hover:bg-red-600，text-white）。
 - FR-C0-013：删除交互：点击后弹出二次删除确认弹窗确认；确认后删除该条并返回上一层列表。
 - FR-C0-014：删除埋点：点击删除、确认删除、删除成功/失败。
 - FR-C0-015：公开/私有开关（isPrivate）：点击私有化此条prompt。

— C-1 快速保存卡片（轻量表单）
 - FR-C1-001：若有选中文本，正文默认带入选区内容。
 - FR-C1-002：字段：标题（可选，留空用正文前~10字）、分类（系统默认+自定义，可选；下拉支持“新建分类”行动项）、正文（必填）。
- FR-C1-003：快速保存：写入本地（未登录上限30条，超过拦截提示）；离线本地持久，在线后可提示同步。
- FR-C1-004：清空：一键清空输入。
- FR-C1-005：放大编辑：可进入 E-1 深度编辑，“完成”后回填至卡片。
- FR-C1-006：埋点：打开来源（右键）、保存、清空、进入 E-0 等。
 - FR-C1-007：分类未选择时默认“其他”；分类下拉选项固定（全部、编程、写作、商务、营销、翻译、其他），超出时在下拉内上下滚动。
 - FR-C1-008：多行输入（若存在）右下角提供“拉手”，仅支持向下拉伸。
- FR-C1-009：C-1 以内容页内可拖拽悬浮卡片呈现，卡片不得超出可视范围。

— E-0 Notepad（全局笔记）
- FR-E0-001：入口: 右键菜单（任意页面空白处/有选区均可见“Notepad”）。
- FR-E0-002：用途：自由写作/脑暴；支持长文软换行与字数/行数统计（v1）。
- FR-E0-003：复制：一键复制编辑区全文（多策略兜底确保复制成功；首选 `navigator.clipboard.writeText`）。
- FR-E0-004：保存为 Prompt：点击后弹出 C-1 快速保存卡片，默认将当前 Notepad 内容作为正文带入。
- FR-E0-005：取消：关闭窗口但不清空草稿；下次打开自动恢复到上次关闭时的文本与光标位置（全局唯一草稿 `pm.notepadDraft`）。
- FR-E0-006：窗口：页面内覆盖层，支持拖拽、不得出屏；宽度与面板保持统一视觉基线。
- FR-E0-007：埋点：打开来源（右键）、复制、保存为 Prompt、取消、草稿恢复。

— E-1 放大编辑（字段级）
- FR-E1-001：入口：出现在多行输入字段旁的“放大编辑”按钮（例如 C-0 的 正文 / System Message、C-1 的 正文）。
- FR-E1-002：用途：提供更大的编辑视窗以便阅读/编写字段内容；打开时载入该字段当前内容。
- FR-E1-003：动作：仅两项——完成、取消。
  * 完成：将编辑结果回填到来源字段并关闭窗口。
  * 取消：不更改来源字段，直接关闭。
- FR-E1-004：显示：字数/行数统计、软换行；不提供复制、不提供“保存为 Prompt”。
- FR-E1-005：窗口：页面内覆盖层，支持拖拽，不得出屏；宽度与面板保持统一视觉基线。
- FR-E1-006：埋点：入口（字段/页面）、完成、取消。

— Auth · U-0 未登录状态
- FR-U0-001：显示未登录提示卡片与“立即登录/注册”按钮。
- FR-U0-002：显示当前限制（最多30条、本地存储、不同步）。
- FR-U0-003：本地存储进度条与剩余数量提示。
- FR-U0-004：启用浮动按钮（FAB）开关。
- FR-U0-005：辅助操作：打开 WebApp；版本号显示。
- FR-U0-006：埋点：展示、点击登录、开关 FAB、打开 WebApp 等。
 - FR-U0-007：入口与定位：通过浏览器地址栏旁扩展图标进入，视图锚定于该入口位置，不支持拖动。
 - FR-U0-008：点击“立即登录/立即注册”时调用 background WebAuthFlow，流程进行中需禁用按钮并展示加载态。

— Auth · U-1 已登录状态
- FR-U1-001：展示用户信息（用户名/邮箱/加入于日期）；布局：标签在左（图标在标签左侧）、值在右。
- FR-U1-002：统计数据：Prompt 数量/收藏数量。
- FR-U1-003：Prompt 存储显示（∞）。
- FR-U1-004：启用浮动按钮（FAB）开关；注销登录。
- FR-U1-005：埋点：展示、开关 FAB、注销、打开 WebApp 等。
 - FR-U1-006：入口与定位：通过浏览器地址栏旁扩展图标进入，视图锚定于该入口位置，不支持拖动。

— FAB 悬浮小球（pm-fab）
 - FR-FAB-001：单击打开面板；拖动仅移动位置。
 - FR-FAB-002：位置全局记忆；跨站点一致。存储模式=自由/贴边 + 边向偏移，视口变化时可还原（兼容分辨率变化）。
 - FR-FAB-003：吸附：拖动松手后仅当距离某边 ≤ 24px 时贴边；贴边外侧零边距；否则保持自由态停放原位（保留 12px 安全边距）。窗口尺寸变化/越界时自动夹紧/贴边。
 - FR-FAB-004：不支持快捷键（本期）。
 - FR-FAB-005：埋点：展示、拖动、点击打开。

— 右键菜单（Context Menu）
- FR-CM-001：有选区：显示“快速保存”“Notepad”。
- FR-CM-002：无选区：仅显示“Notepad”。
- FR-CM-003：“快速保存”预填正文为选中文本；标题可空。
- FR-CM-004：“Notepad”预填为选中文本（若有），否则加载全局 Notepad 草稿内容。
- FR-CM-005：埋点：展示、点击项、保存行为。

##### webapp 部分

— WebApp Auth · Login（/auth/login）
- FR-AUTH-LOGIN-001：字段：邮箱；模式切换：密码登录 / 邮箱验证码登录（二选一）。密码登录需密码≥6位；验证码登录需输入邮箱验证码（含发送/重发入口）。
- FR-AUTH-LOGIN-002：底部文案：“我们的 服务条款 和 隐私政策”。
- FR-AUTH-LOGIN-003：不提供第三方登录；忘记密码可直接使用验证码登录，无单独“重置密码”页。
- FR-AUTH-LOGIN-004：提交成功 → 根据 `redirect_uri` 重定向至 `https://<extensionId>.chromiumapp.org/...#access_token=...&refresh_token=...&session=<base64>（附带 state）`；Chrome 自动关闭小窗。
- FR-AUTH-LOGIN-005：埋点：进入、模式切换、校验失败、提交成功/失败、关闭窗口、验证码发送/重发结果。

— WebApp Auth · Register（/auth/register）
- FR-AUTH-REGISTER-001：字段：邮箱；模式切换：密码注册 / 邮箱验证码注册（二选一）。密码注册需密码≥6位并确认；验证码注册仅需邮箱+验证码，不再要求用户名。
- FR-AUTH-REGISTER-002：底部文案：“注册即表示您同意我们的 服务条款 和 隐私政策”。
- FR-AUTH-REGISTER-003：底部提供“已有账户？立即登入”文字按钮（主色文字，可点击）。
- FR-AUTH-REGISTER-004：注册成功 → 生成同结构 session（mode=register），按登录流程重定向；必要时提示“已创建账号，正在跳转登录”。
- FR-AUTH-REGISTER-005：埋点：进入、模式切换、字段错误、验证码发送/重发结果、提交结果、切换到登录页。

（WebApp Auth 仅保留 Login/Register，小窗入口统一由扩展 popup 触发）


##### backend部分



## 1) 产品概要（What & Why）

面向频繁使用 AI 提示词的创作者与知识工作者，我们提供一款**浏览器内的 Prompt 管理面板（extension）**。核心价值：**不离开当前网页**就能**快速保存、编辑、搜索并复用**提示词，显著降低上下文切换成本。不同于需要切应用或打开整页网站的工具，我们把“**收集→整理→复用**”压缩进**同一面板**完成。使用方式：任意页面用**悬浮小球**唤起面板，搜索浏览“**我的库/收藏**”，**一键复制**即用；有新想法时可进入**表单完整编辑**（含放大编辑），或**选中文本右键“快速保存”**不中断当前操作；在“**发现/市场**”挑选优质提示词并**复制或收藏**（Find 不直接编辑；收藏后在 Home·收藏中再编辑保存）。账号层：未登录提供用量提示与清晰引导，登录后**自动同步个人数据**。整体以**统一面板与清晰分区**覆盖常用、列表与表单，让流程变成“**点一下、存一下、用一下**”，提升产出效率，减少重复劳动。

---

## 2) 关键用户流程（Flow）

本节以“入口 → 承载形态 → 窗口间切换与层级”为主线，集中定义每个窗口/卡片的出现位置与相互流转（不覆盖功能细节，详见 FR）。

### 2.1 入口总览
- 浏览器 popup（固定锚定扩展图标位置）：承载 Auth 状态视图（U-0 未登录 / U-1 已登录），在同一 popup 内切换，并提供 WebAuthFlow 登录/注册入口。
- content script 覆盖层：FAB 小球、Extension Panel（Home/Find/C-0）、E-0 Notepad、E-1 放大编辑、C-1 快速保存卡片。
- background 右键菜单：注册“快速保存 Prompt”“Notepad”两项，用于在页面上唤起 C-1 或 E-0 覆盖层。

### 2.2 浏览器 popup（Auth）
- 位置与承载：固定锚定于浏览器扩展图标处的 popup；不可拖动。
- 首次进入：显示 U-0（未登录）。
- WebAuthFlow 流程：
  * U-0 点击“立即登录/立即注册” → popup 发送 `pm:auth:start` 给 background，禁用按钮并打开 WebApp 小窗（登录/注册）。
  * WebApp 完成登录/注册 → 重定向携带 access_token/refresh_token/session；background 校验 `state`、写入 `pm.auth.session`。
  * popup 通过订阅感知会话更新 → 自动切换到 U-1，并短暂展示“登录成功，数据同步中”提示。
  * U-1 点击“注销登录” → 清空 `pm.auth.session`，回到 U-0。
- 异常处理：WebAuthFlow 途中关闭/失败时，background 返回错误并解除按钮禁用；popup 维持 U-0，可再次触发。

### 2.3 content script（FAB → Extension Panel）
- FAB：安装后默认出现在页面右下；可拖拽移动，位置全局记忆，出屏自动吸附；单击打开 Extension Panel。
- 打开落点：Extension Panel 首次打开落在 Home。
- 面板呈现（布局行为）：每次打开以一套相对克制的默认起始宽度出现（不记忆上一次拖拽结果），在视口宽度充足时优先以“右侧挤压”的方式为面板让出一条固定列工作区；当窗口本身较窄或继续挤压会让宿主页面宽度跌破安全阈值、明显影响阅读体验时，更倾向于自动切换为“覆盖模式”，把面板作为悬浮工作区盖在原页面之上，关闭后宿主页面恢复原状。
- Home 内典型流转：
  * 顶部“+新建” → 进入 C-0（保存/编辑）
  * 列表项“编辑” → 进入 C-0（编辑已有）
  * 多行字段“放大” → 覆盖层 E-1（叠加在面板上方）
  * 分类下拉底部“新建分类” → 覆盖层“新建分类”提示（在面板上方）
  * C-0 中点击“删除” → 覆盖层“确认删除”提示（在面板上方）
  * 底部 Tabbar 切换至 Find → 进入 Find
- Find 内典型流转：
  * 顶部“+新建” → 进入 C-0（创建全新条目）
  * 列表卡片仅“复制/收藏”（编辑在 Home·收藏中完成）
- 关闭：面板右上角 X / ESC / 点击遮罩关闭；关闭后 FAB 在原位置复现。

### 2.4 background 右键菜单（C-1 / E-0）
- 有选区：
  * “快速保存 Prompt” → 覆盖层 C-1（正文默认带入选中文本）；C-1 中点击“放大” → 覆盖层 E-1（叠在 C-1 上方）
  * “Notepad” → 覆盖层 E-0（默认填入选中文本）
- 无选区：
  * “Notepad” → 覆盖层 E-0（首次为空；如曾使用则恢复上次草稿与光标位置）
- E-0 操作：
  * “保存为 Prompt” → 弹出 C-1，预填 E-0 文本
  * “复制” → 复制 E-0 全文
- 关闭：
  * E-1/C-1 关闭后回到其下层窗口；E-0 关闭后草稿保留，后续自动恢复。

### 2.5 层级与叠放（Z-Order）
- 基本规则：谁后打开谁在最上面；点击谁，谁获得焦点并置于最上层。
- 提示类覆盖层：除“确认删除”外，其余提示（如“新建分类”“成功提示”等）默认强制置顶；“确认删除”遵循通用置顶规则。
- 典型叠放关系：
  * E-1 可叠在 C-0 或 C-1 之上；
  * “新建分类”“确认删除”等提示叠在 Extension Panel 之上；
  * 多层覆盖时按“后开优先”的栈顶原则管理焦点与遮罩。
- 关闭回退：关闭顶层覆盖层回到下层；关闭 Extension Panel 后 FAB 复现；popup 为单窗口内切换（无拖拽与跨层叠放）。

---

## 4) 界面与交互（UX/UI）— PM 可读版

请参考高保真原型图 html，确保每一个页面窗口与设计 1:1（像素严格，动效口径：fast 150ms / normal 240ms）。所有页面宽度统一；C-0 与 Extension Panel 共享同一壳层；E-0 ， E-1 ，C-1 为页面内覆盖层的可拖拽窗口（保持与面板统一视觉基线）。

#### 各页面布局与尺寸

本节仅描述“布局结构”与“关键尺寸”，不涉及交互/逻辑（详见 FR）。统一遵循以下基线（参考 `原型图/` folder中设计）：

- 宽度基线：`--pm-width = clamp(300px, 19.56vw, 440px)`（最大 440px）
- Extension Panel 专用宽度：`--pm-panel-width`（最小约 480px，最大约 1200px，右侧贴边，参考 `extension-panel.html` 的挤压式布局）
- 圆角：`--pm-radius = 12px`；阴影：`--pm-shadow`（中等级）
- 面板高度：680px；滚动条视觉宽度约 6px

— 统一规范（全局）
- 三段式骨架：除提示模态外，所有页面/卡片窗口均采用`BrandBar（头部） → Main（主体） → Footer（底部 Tabbar）`。Tabbar 仅在面板视图显示。
- 呈现方式：
  - Extension Panel：作为页面右侧**挤压式固定列**存在，贴右侧，从屏幕右边缘滑入/滑出；高度铺满可视区域，宽度使用 `--pm-panel-width`，打开时宿主页面整体向左“让出”一列空间。
  - C-0 / C-1 / E-0 / E-1：作为浏览器页面内的覆盖层窗口，宽度遵循 `--pm-width`，内容区内部滚动，避免出屏，与 Extension Panel 在圆角/阴影/排版上保持统一视觉基线。
- BrandBar 家族：统一使用 `#panel-brand-bar`（`px-3 py-2`，底部细分割线）。左侧为 32×32px 渐变圆徽 + 标题/副标题，右侧关闭按钮 28×28px。不同页面仅更换图标与文案。
- 按钮统一：高度 36px（h-9），圆角 8–12px；同一套样式族在各页面复用，仅文字/颜色/宽度不同。
- 输入/选择/分段统一：高度 36px；分段控件整体高 36px，圆角与滑块风格与家族一致。
- Prompt Card 统一：
  * 常用区横向卡片：最小高度 68px；单卡宽约容器的 58–60%；水平间距 8–12px；横向滚动。
  * 列表纵向卡片：最小高度 76px；左右内边距约 12px；动作位按钮 32×32px（常用区动作位为 28×28px）。
- 分页条：居中位于列表区下方；翻页按钮约 24×24px；页码输入行高约 24px，整体高度 ≤ 32px。

— Extension Panel（通用壳层：Home / Find / C-0）
- 布局结构：
  * BrandBar（左圆徽+标题/副标题，右关闭）
  * Main：搜索行（左搜索输入，右“新建”按钮）→（按需）分段控件/分类下拉/常用区 → 列表区 → 分页条
  * Footer：底部 Tabbar（Home / Find）
- 关键尺寸：
  * 宽度：`--pm-panel-width`（右侧固定列，最小约 480px，最大约 1200px）；每次打开以一套相对克制的默认起始宽度出现（不记忆上次拖拽），用户通过面板左缘约 8–12px 的竖向拖拽条在该范围内调宽；圆角：`--pm-radius`；阴影：`--pm-shadow`
  * 右侧挤压与覆盖：在视口宽度充足且宿主内容仍能保持安全最小宽度时，面板贴右侧并通过挤压方式让宿主页面整体向左偏移；当窗口本身较窄或继续挤压会让宿主宽度跌破安全阈值、明显破坏阅读体验时，自动切换为覆盖模式，将面板作为悬浮工作区盖在原页面之上；关闭时无论哪种模式，宿主页面均恢复满宽。
  * BrandBar 内边距 8×12px；图标 18px；关闭按钮 28×28px
  * 搜索/按钮/分段/下拉：统一 36px 高
  * 列表区纵向滚动；滚动条宽约 6px
  * Tabbar 高度 40px（图标 18px，文字 12px）
  * 面板高度 680px（主体内容区内滚动）

— Extension Panel · Home（我的）
- 布局结构：搜索行 → 常用区（横向卡片）→ 分段（库/收藏）→ 分类下拉 → 列表区（纵向卡片）→ 分页控制器；底部 Tabbar 选中 Home。
- 关键尺寸：常用区卡片最小高 68px，单卡宽 58–60%；列表卡片最小高 76px；动作位按钮：常用区 28×28px，列表 32×32px。

— Extension Panel · Find（发现/市场）
- 布局结构：搜索行 → 分类下拉 → 列表区（右上动作位）→ 分页控制器；底部 Tabbar 选中 Find。
- 关键尺寸：与 Home 一致（面板宽度、输入/下拉 36px、列表滚动、分页条尺寸一致）；列表卡片动作位按钮 32×32px。

— Extension Panel · C-0（保存/编辑）
- 布局结构：BrandBar → 表单（标题 → 备注/使用说明 → 分类下拉 → System Message（多行，右侧预留“放大”入口位）→ 正文（多行，右侧预留“放大”入口位））→ 公开/私有开关 →  删除按钮区（整行）→ 底部操作栏（右对齐“取消/保存”）。
- 关键尺寸：输入/下拉 36px；多行文本最小高 150px（可向下拉伸）；删除按钮等高 36px、全宽；按钮圆角 8–12px。

— C-1：Quick-Save Card（精简表单）
- 布局结构：头部栏 → 精简表单（标题 → 分类下拉 → 正文（多行，右侧预留“放大”入口位））→ 底部操作栏（按钮居中）。
- 关键尺寸：遵循 `--pm-width` 与 `--pm-radius`；输入/下拉 36px；多行文本最小高 150px；底部双按钮 36px 高，水平居中。

— E-0：Notepad
- 布局结构：BrandBar → 大面积编辑区（多行文本域）→ 底部信息栏（统计/保存提示）→ 底部操作栏（“Save as Prompt/复制” 按钮居中）。
- 关键尺寸：最大宽度 1000px；编辑区最小高 360px；顶部/底部栏 32–40px；顶部按钮高 28px；底部双按钮居中。

— E-1：放大编辑
- 布局结构：BrandBar（标题“放大编辑”）→ 大面积编辑区（承载单字段内容）→ 底部操作栏（“取消/完成”，按钮居中）。
- 关键尺寸：最大宽度 1000px；编辑区最小高 360px；动作按钮高 28px；圆角/内边距与 E-0 保持一致。

— Auth · U-0 未登录状态（浏览器 popup）
- 布局结构：BrandBar → 主体卡片区（账号状态卡 → 限制说明卡 → 存储进度行 → 设置行（开关）→ 辅助链接行）→ 底部版本信息。
- 关键尺寸：与面板同宽基线；进度条约 10px 高；开关约 44×24px；卡片内边距 12px；行距 8–12px。

— Auth · WebApp Login（WebAuthFlow 小窗）
- 布局：顶部 Logo 圆徽（48×48）→ 欢迎标题/说明 → 表单区（邮箱/密码 2 行）→ 主按钮 → 辅助说明（服务条款/隐私）。
- 关键尺寸：输入/按钮 36px 高；左右内边距 24px；竖向间距 12–16px；整体卡片宽度随 `--pm-width`。

— Auth · WebApp Register（WebAuthFlow 小窗）
- 布局：顶部 Logo 圆徽 → 标题/说明 → 表单区（用户名/邮箱/密码/确认密码 4 行）→ 主按钮 → 辅助说明（含“已有账户？立即登入”文字按钮）。
- 关键尺寸：同登录页；多字段时上下间距保持 12px，说明文字 13px。

— Auth · U-1 已登录状态（浏览器 popup）
- 布局结构：BrandBar → 主体卡片区（账号信息卡 → 统计数据卡 → 存储展示行 → 设置行（开关）→ 辅助操作行）。
- 关键尺寸：与 U-0 一致；开关 44×24px；卡片内边距 12px；行距 8–12px。

— FAB 悬浮小球（pm-fab）
- 布局结构：位于页面内容之上的圆形可拖拽按钮，默认停靠右下角；靠边时切换为贴边胶囊形态（左右贴边外侧收口，宽约 60px，高 44px）。
- 关键尺寸：自由态直径 44px，安全边距 12px；贴边态宽 60px、高 44px，外侧零边距；点击热区与视觉一致。


## 5) 目录架构

### 前端 - extension部分— PM 可读版

E:\solo dev\prompt manna - nnn\P2 - Codex - 同步
├── .git  [skipped]
├── docs  [skipped]
├── backend/  [还未启用]                            # 后端部分内容
├── extension
│   ├── .plasmo  [skipped]                          # 工具生成的中间产物与模板（自动生成，不计入“启用源码”，不展开）
│   ├── assets  [skipped]                           # 图标等静态资源（手动维护，不展开）
│   ├── build  [skipped]                            # 构建产物输出（自动生成，不展开）
│   ├── node_modules  [skipped]                     # 依赖目录（自动生成，不展开）
│   ├── src                                         # extension核心代码目录
│   │   ├── libs/  [还未启用]                        # 可以复用的工具代码
│   │   ├── background                              # 这是扩展的后台总管，负责右键菜单与消息桥接。
│   │   │   └── index.ts                            # MV3 Service Worker 入口（右键菜单/消息桥接/Auth 预热）。已实现：安装/启动时创建菜单；选中文本右键“Notepad 占位/快速保存 占位”，空白处仅“Notepad 占位”；向页面广播消息兜底；在安装/启动时预热 WebAuth 相关页面（`warmupAuthOrigin`），以提升首登体验。
│   │   ├── components                              # 可以复用的UI组件
│   │   │   ├── panel                               # 为 extension panel 专用 ui 组件；
│   │   │   │   ├── PanelSearchBar.tsx  [还未启用]   # 搜索框
│   │   │   │   ├── Segmented.tsx  [还未启用]        # 库/收藏分段切换控件
│   │   │   │   ├── Pagination.tsx  [还未启用]       # 分页组件
│   │   │   │   ├── Tabbar.tsx  [还未启用]           # 底部 Tab（Home/Find）切页栏
│   │   │   │   └── PanelShellPlaceholder.tsx                 # 为 Extension Panel 右侧挤压式壳层（BrandBar / Content / Footer）占位，供 Panel/C-0 复用。完成后点击 FAB 悬浮球，在页面右侧看到固定列的主面板壳，而不是居中的一坨文字。
│   │   │   └── ui                                  # 新增：最小 UI 组件（必要，复用支撑四态）
│   │   │       ├── Button.tsx                      # 统一按钮风格/尺寸/加载态（主按钮/次按钮）
│   │   │       ├── Input.tsx                       # 文本输入（占位/出错态）封装
│   │   │       ├── ProgressBar.tsx                 # 进度条，用于 U-0 本地存储占用展示
│   │   │       ├── Select.tsx  [还未启用]           # 分类选择框。位置：Extension Panel、C-1、C-0
│   │   │       ├── TextArea.tsx  [还未启用]         # 多行输入。 位置：C-1/C-0/E-0/E-1
│   │   │       └── Toggle.tsx                      # 开关，用于 U-0/U-1 的 FAB 开关
│   │   ├── contents                                # FAB 小球、右侧挤压式 Extension Panel（Home/Find/C-0）、E-0 放大编辑（覆盖层）、C-1 快速保存卡片（覆盖层）的页面注入入口；没有它们，我们的 FAB/面板/覆盖层卡片就不能在浏览器页面显示
│   │   │   ├── fab.tsx                             # 为 FAB 悬浮球注入入口，完成后右下角出现一个圆形“FAB 占位”按钮（固定位置，无拖拽/吸附，后续版本支持拖拽与吸附）。
│   │   │   ├── notepad-e0.tsx                      # 为 E-0 Notepad 覆盖层入口。选内容或空白处点击菜单项弹出 Notepad（E-0）窗口，内有“这是 Notepad 占位”字样，支持关闭；监听 runtime/window 消息开关
│   │   │   ├── panel.tsx                           # 为 Extension Panel（Home/Find/C-0 共用壳）的注入入口。点击 FAB 悬浮球，在页面右侧滑出 Extension Panel（Home/Find/C-0 共用壳）挤压为主、必要时退回覆盖模式的侧边工作区面板列，内有占位文案如“Extension Panel（Home/Find/C-0）占位”，支持关闭与拖拽调宽。
│   │   │   └── quick-save-c1.tsx                   # 为 C-1 Quick-Save 覆盖层入口。选内容点击菜单项弹出 Quick-Save（C-1）窗口，内有“这是快速保存占位”字样，支持关闭；监听 runtime/window 消息开关
│   │   ├── features                                # 具体页面/窗口的视图
│   │   │   ├── auth                                # popup 状态视图（U0/U1）与跨态逻辑容器
│   │   │   │   ├── AuthRoot.tsx                    # 状态容器：读取/订阅 `pm.auth.session`，触发 WebAuthFlow，管理 FAB 设置
│   │   │   │   ├── U0.tsx                          # 未登录视图（登录引导/本地限制/FAB 开关/版本/触发 WebAuthFlow）
│   │   │   │   └── U1.tsx                          # 已登录视图（账户信息/同步提示/存储/FAB 开关/操作按钮）
│   │   │   ├── panel/  [还未启用]                   # content-script：Home / Find / C-0（复用 PanelShell）
│   │   │   ├── QuickSaveCard.tsx  [还未启用]        # C-1 快速保存卡片视图组件（配合 contents/quick-save-c1.tsx）
│   │   │   └── EditorE0.tsx  [还未启用]             # E-0 Notepad 视图组件（配合 contents/notepad-e0.tsx）
│   │   ├── popup                                   # popup 注入入口，只承载 U-0/U-1 状态视图。
│   │   │   └── index.tsx                           # 挂载 `features/auth/AuthRoot`（必要，替换 Step 0 占位）
│   │   ├── services                                # 存储、WebAuthBridge、后端接口占位
│   │   │   ├── auth.ts                             # 会话模型（access token/refresh token/tier 等）、`getSession`/`saveSession`/`logout`/订阅封装
│   │   │   ├── storage.ts                          # 封装 `chrome.storage.local`（get/set/subscribe），提供内存兜底以便开发/调试
│   │   │   └── webauthflow.ts                      # popup 侧发起 WebAuthBridge：构造带有 `client/mode/relay/relay_origin/state` 的 WebApp Auth URL，通过 `window.open` 打开登录/注册小窗；监听来自 WebApp 的 `postMessage`（`type = "pm:auth:bridge"`），校验 `origin/state` 后调用 `saveSession` 持久化；在非扩展环境下回退为直接打开 WebApp。
│   │   └── styles                                  # 全局样式与设计
│   │       └── globals.css                         # 已实现全局与 Auth popup 样式（含 Tailwind 指令与设计 tokens）
│   ├── .gitkeep                                    # 空目录占位文件（手动维护，不展开；用于保留目录结构）
│   ├── .postcssrc                                  # PostCSS 配置（根级 JSON，替代 `config/postcss.config.cjs`）
│   ├── fa-wand-magic-sparkles.json
│   ├── package-lock.json                           # 依赖锁定文件（npm 自动生成，不展开；建议纳入版本控制，不手动编辑）
│   ├── package.json                                # 工程脚本与 Plasmo manifest 配置出口（替代 `config/plasmo.config.ts`）
│   ├── tailwind.config.ts                          # Tailwind 定制（根级，替代 `config/tailwind.config.ts`）
│   └── tsconfig.json                               # TS 编译与类型规则来源
├── task  [skipped]
└── .gitignore                                      # Git 忽略规则



### 前端 - webapp部分— PM 可读版

webapp/                                       # WebApp（Next 14 + App Router）
├── package.json                              # webapp 独立 package（Next/Tailwind 依赖、脚本）
├── next.config.mjs                           # Next 配置（strict mode）
├── postcss.config.js                         # Tailwind + autoprefixer
├── tailwind.config.ts                        # Tailwind tokens（含 pm 设计变量）
├── tsconfig.json / next-env.d.ts             # TS 配置
└── src
    ├── app
    │   ├── layout.tsx                        # WebApp 根布局（全局字体/样式）
    │   ├── globals.css                       # 全局样式（Auth 小页视觉基线 / tailwind 指令）
    │   └── auth                              # WebAuthFlow 小窗页面集合
    │       ├── layout.tsx                    # Auth 子布局：580px 小窗、模糊背景
    │       ├── entry/page.tsx                # 入口页（在小窗中选择“登录/关闭”）
    │       ├── login/page.tsx                # 登录页（邮箱+密码，Mock WebAuthFlow 成功 → redirect）
    │       └── register/page.tsx             # 注册页（用户名/邮箱/密码，Mock WebAuthFlow 成功 → redirect/login）
    └── lib
        └── webauthflow.ts                    # WebAuthFlow 工具（拼接 relay query、mock session 哈希）

### 后端 - backend部分— PM 可读版




