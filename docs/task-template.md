<!--
用法：复制本模板为你的任务文件，例如：task/your-feature/Step X/task.md，然后全局替换 {{...}} 占位符。
建议：先“写出用户能看到/点到/弹出的最低可验证体验”，再补工程侧与脚本。
-->

## 目标和效果
### 目标
- {{目标概要：一句话描述本 Step 要达成的“可见可验”状态}}

### 效果 - 用户直观体验
- {{入口一｜位置与交互简述，含可见文案/弹层/可关闭}}
- {{入口二｜位置与交互简述}}
- {{入口三｜位置与交互简述}}

### 说明
- 仅位置与入口连通：看得到、点得到、弹得出、关得上。
- 本 Step 可不含业务逻辑与数据读写；仅放占位文案以验证链路。

### 工程侧
- 运行开发命令后，以上入口均可出现对应占位视图且可关闭。


## 目录结构和目录启用总结

{{代码结构根路径（例如：E:\\...\\extension 或 src/ 根）}}
```text
{{根}}
├── src
│   ├── background            # MV3 Service Worker / 后台事件与右键菜单
│   ├── components            # 通用 UI 组件
│   │   └── panel             # 面板相关组件（如主壳）
│   ├── contents              # 覆盖层与页面注入入口（FAB/Panel/E-0/C-1 等）
│   ├── popup                 # 浏览器工具栏 popup 入口
│   ├── styles                # 全局样式与 design tokens
│   └── types                 # 临时类型假值（如需）
├── package.json              # 脚本与 Plasmo manifest 出口
├── tailwind.config.ts        # Tailwind 配置
├── .postcssrc                # PostCSS 配置（可选）
└── tsconfig.json             # TS 编译与类型规则
```

- 本步启用目录：{{列出启用的目录与文件要点}}
- 入口目录：`src/background`、`src/contents`、`src/popup`（三处入口对齐“用户直观体验”）。
- Step 0 可内联占位；Step 1 起将页面骨架迁入 `features/`，入口仅做挂载与路由。


## {{Step 名称}}｜任务清单

- T001：初始化与安装依赖（{{技术栈}}）。包含设置 `dev/build` 脚本；验收：能执行开发命令无报错。
- T002：在 `package.json` 的 `manifest` 字段声明最小 `manifest`（permissions/host_permissions 等），并声明 background/popup/content-scripts；验收：生成的 `manifest` 含上述键值。
- T003：配置 `tsconfig.json`（`jsx: react-jsx`、`strict` 合理值、`baseUrl`/`paths` 可选）；验收：类型编译通过。
- T004：配置 Tailwind 与全局样式（`@tailwind base/components/utilities`）；验收：样式可被入口引入无报错。
- T005：必要时补充 `src/types/shims.d.ts` 假值声明以消除类型缺口；验收：类型检查无红线。
- T006：实现 `popup` 占位组件，显示“{{占位文案-Auth/登录区}}”；验收：组件可独立渲染。
- T007：实现 `popup/index.tsx` 挂载并仅渲染占位组件（引入 `globals.css`）；验收：点击扩展图标弹出小窗显示占位文案，可关闭。
- T008：实现 `contents/fab.tsx`，右下角固定圆形按钮“{{FAB 占位文案}}”；验收：页面右下角可见按钮。
- T009：实现 `contents/panel.tsx`，弹出覆盖层显示“{{Panel 占位文案}}”，与 FAB 点击联动开关；验收：点击 FAB 出/关覆盖层。
- T010：实现 `components/panel/PanelShellPlaceholder.tsx`，提供壳层（BrandBar/Content/Footer）供 Panel 复用；验收：Panel 使用壳渲染占位。
- T011：实现 `contents/notepad-e0.tsx` 覆盖层显示“{{E-0 占位文案}}”；验收：调用时可见并可关闭。
- T012：实现 `contents/quick-save-c1.tsx` 覆盖层显示“{{C-1 占位文案}}”；验收：调用时可见并可关闭。
- T013：实现 `background/index.ts` 注册右键菜单（选中文本/未选中文本不同项），点击各项向对应 content 发送消息打开覆盖层；验收：右键菜单与弹层行为符合描述。
- T014：联调与本地验证三处入口（popup / background→右键 / content→FAB）；验收：看得到、点得到、弹得出、关得上。
- T015：记录运行命令与注意事项，勾选完成项；若存在临时类型假值，注明下一步将移除 `src/types` 与相关占位实现；验收：`task.md` 更新到位。


## Changelog（给 PM 看）

【你能直接看到的效果】
- {{以用户视角罗列三处入口的可见行为}}

【工程状态（给同事）】
- {{manifest 声明/样式/类型状态等}}

【如何运行】
1) 安装依赖（仅首次）
   ```bash
   cd {{工程子目录，如 extension}}
   npm i
   ```
2) 开发调试
   ```bash
   npm run dev
   ```
   在浏览器扩展管理中选择“加载已解压的扩展程序”，然后选择：
   `{{开发构建输出目录}}`
3) 生产构建
   ```bash
   npm run build
   ```
   然后加载：
   `{{生产构建输出目录}}`


## Buglist（修复记录｜PM 可读）

- {{问题标题}}
  - 根因：{{原因}}
  - 解决：{{方案}}

- {{问题标题}}
  - 根因：{{原因}}
  - 解决：{{方案}}


