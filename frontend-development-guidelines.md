# 通用前端开发规范

> 适用范围：新建 Web 前端项目、BFF 较轻的全栈前端项目、管理后台、营销站点、移动 H5、组件库和中大型单体前端应用。本文不包含微前端规范。

## 1. 规范目标

前端工程规范的目标不是增加流程，而是让团队在质量、效率和长期维护之间取得稳定平衡。

- 保证代码可读、可测、可维护。
- 保证 UI 表现一致，避免同一产品内出现多套交互与视觉语言。
- 保证类型、构建、Lint、测试、性能、安全和可访问性成为默认质量门。
- 保证新人可以通过目录结构、命名、脚本和文档快速理解项目。
- 保证线上问题可定位、可回滚、可度量。

## 2. 技术栈基线

### 2.1 语言与运行时

- 默认使用 TypeScript，并开启 `strict`。
- Node.js 版本必须在 `package.json` 的 `engines` 中声明，并在 CI 中校验。
- 包管理器统一使用一种，推荐 `pnpm` 或 `npm`，禁止混用 lockfile。
- 前端代码默认使用 ESM。
- 禁止在业务代码中使用隐式 `any`、宽泛对象、魔法字符串和未收敛的类型断言。

### 2.2 框架选择

- 新项目优先选择成熟生态：React + Next.js/Vite，或 Vue + Nuxt/Vite。
- 内容型、营销型、SEO 强相关项目优先 SSR/SSG。
- 复杂交互型后台或内部工具可优先 SPA，但仍需关注首屏性能和路由级拆包。
- 框架能力优先于自研基础设施。路由、数据获取、图片优化、字体优化、构建优化、错误边界等能力，能使用框架官方方案时不重复造轮子。

### 2.3 推荐基础依赖

- 代码质量：ESLint、Prettier 或 Biome，必要时加入 Stylelint。
- 类型检查：TypeScript。
- 测试：Vitest/Jest、Testing Library、Playwright。
- Git 约束：Husky 或 Lefthook、lint-staged、Commitlint。
- 数据请求：框架内置能力、TanStack Query、SWR 或项目统一封装。
- 表单：React Hook Form、Zod/Valibot/Yup 等 schema 校验。
- 组件：优先使用设计系统或成熟无样式组件库，再组合业务组件。

## 3. 项目目录规范

推荐按“业务领域 + 共享基础能力”组织，而不是按文件类型堆叠。

```text
src/
  app/                 # 路由、页面入口、布局、全局错误页
  features/            # 按业务领域聚合的功能模块
    user/
      api/
      components/
      hooks/
      model/
      pages/
      utils/
  components/          # 跨业务复用的通用组件
  design-system/       # 基础 UI、tokens、主题、图标适配
  hooks/               # 跨业务通用 hooks
  lib/                 # 第三方库适配、工具封装、客户端初始化
  services/            # 跨模块 API client 或 SDK
  stores/              # 全局状态，仅放确需全局共享的状态
  styles/              # 全局样式、tokens、reset
  types/               # 全局共享类型
  utils/               # 无业务语义的纯工具函数
  test/                # 测试工具、mock、fixture
public/                # 静态资源
```

目录约定：

- 页面只负责组合、数据边界和路由语义，复杂逻辑下沉到 feature。
- `components/` 只放跨业务复用组件，业务专属组件放在对应 `features/*/components`。
- `utils/` 必须无副作用、无业务状态、无框架强耦合。
- `lib/` 用于封装第三方库初始化和适配层，避免业务代码散落第三方 API。
- 禁止出现无限增长的 `common`、`shared`、`helpers` 目录；需要明确职责边界。

## 4. 命名规范

### 4.1 文件与目录

- 目录名使用 `kebab-case`。
- React/Vue 组件文件使用 `PascalCase`，例如 `UserProfile.tsx`。
- 非组件模块使用 `camelCase` 或 `kebab-case`，项目内统一即可。
- 测试文件使用 `*.test.ts(x)` 或 `*.spec.ts(x)`。
- 类型文件避免滥用 `types.ts`，优先靠近使用方命名，例如 `user.schema.ts`、`order.types.ts`。

### 4.2 代码命名

- 变量、函数使用 `camelCase`。
- 类型、接口、类、组件使用 `PascalCase`。
- 常量使用 `UPPER_SNAKE_CASE`，仅限真正全局常量。
- 布尔变量使用 `is`、`has`、`can`、`should` 等前缀。
- 事件处理函数使用 `handleXxx`，传入子组件的回调用 `onXxx`。
- API 方法以业务动作命名，例如 `fetchUserList`、`createOrder`、`updateProfile`。

## 5. TypeScript 规范

- 开启 `strict`、`noEmit`、`isolatedModules`。
- API 入参、响应、表单数据和本地存储数据必须有明确类型。
- 优先使用类型推导，公共 API、组件 props、复杂返回值必须显式声明。
- 禁止使用 `any`。确实无法表达时使用 `unknown`，并在边界处收窄。
- 禁止随意使用 `as`。类型断言必须靠近数据边界，并说明原因。
- 优先使用 `type` 表达组合类型，使用 `interface` 表达可扩展对象契约；项目内需统一。
- 枚举优先使用字面量联合类型或 `as const` 对象。
- 网络响应、URL 参数、环境变量、外部输入必须经过运行时校验。

示例：

```ts
const USER_STATUS = {
  Active: "active",
  Disabled: "disabled",
} as const;

type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];
```

## 6. JavaScript 与代码风格

- 使用 ESLint 作为代码正确性约束，Prettier/Biome 作为格式化约束。
- 格式化由工具自动完成，不在 Code Review 中争论缩进、引号、尾逗号。
- 禁止未使用变量、未处理 Promise、隐式全局变量。
- 禁止在渲染函数或计算属性中执行副作用。
- 复杂条件必须提取为具名变量或函数。
- 单个函数建议不超过 50 行；超过时优先拆出纯函数或子组件。
- 注释解释“为什么”，不要复述“做了什么”。
- 公共工具函数必须有单元测试。

## 7. React/Vue 组件规范

### 7.1 通用组件原则

- 组件应小而聚焦，一个组件只承担一个清晰职责。
- 组件 props 保持稳定、明确，避免透传巨大对象。
- UI 组件尽量无业务副作用；业务组件负责数据、权限、埋点和状态编排。
- 列表项必须使用稳定 key，禁止使用数组下标作为动态列表 key。
- 禁止在组件内部定义会导致子组件重复卸载的大型嵌套组件。
- 组件对外暴露的状态变化使用受控模式或清晰的事件回调。

### 7.2 React 约定

- 遵守 Hooks 规则：只在组件或自定义 Hook 顶层调用 Hook。
- 组件和 Hook 必须保持纯度：不要直接修改 props、state 或 Hook 参数。
- 副作用放在事件处理、Effect 或服务层中，禁止在 render 阶段执行副作用。
- `useEffect` 只用于同步外部系统，不用于能在 render 中推导出的状态。
- 优先使用 Server Components 或服务端数据能力，只有需要浏览器 API、交互状态或事件处理时才使用 Client Component。
- Context 只承载低频变化的跨层数据，如主题、语言、当前用户；高频状态使用更合适的状态管理或局部状态。

### 7.3 Vue 约定

- 默认使用 Composition API 和 `<script setup>`。
- props 和 emits 必须显式声明类型。
- computed 保持纯计算，watch/watchEffect 只用于副作用。
- 复杂业务逻辑封装为 composable，命名使用 `useXxx`。
- 模板中避免复杂表达式，复杂逻辑移入 computed 或函数。

## 8. 状态管理规范

- 优先使用局部状态，能不全局就不全局。
- 服务端状态和客户端 UI 状态分离。
- 服务端状态推荐使用 TanStack Query、SWR 或框架内置数据能力管理缓存、重试、失效和并发。
- 全局状态只保存跨页面、跨模块共享且生命周期较长的数据。
- URL 是筛选、分页、Tab、搜索条件等可分享状态的首选来源。
- 表单状态交给表单库管理，提交前做 schema 校验。
- 禁止把接口原始响应直接作为全局状态长期持有，应转换成页面需要的模型。

## 9. API 与数据规范

- 统一 API client，集中处理 baseURL、鉴权、超时、错误码、重试、日志和追踪 ID。
- 每个接口必须定义请求类型、响应类型和错误处理策略。
- 不信任任何外部输入，包括接口响应、URL 参数、localStorage、postMessage、环境变量。
- GET 请求必须幂等；写操作必须有明确 loading、success、error 和重试策略。
- 删除、支付、提交审批等高风险操作必须二次确认或具备撤销能力。
- 文件上传需限制类型、大小、数量，并提供进度和失败恢复。
- 前端不硬编码后端错误文案映射以外的业务规则；关键规则由后端兜底。

## 10. 样式与设计系统

- 新项目必须定义设计 token：颜色、字体、字号、间距、圆角、阴影、层级、断点。
- 禁止散落魔法颜色和魔法间距；优先使用 token 或主题变量。
- 样式方案可选 CSS Modules、Tailwind CSS、vanilla-extract、CSS-in-JS 或框架约定，项目内保持一致。
- 组件样式和组件同目录组织，跨组件样式进入设计系统或全局样式。
- 全局 CSS 只放 reset、字体、变量和少量基础排版规则。
- 响应式优先使用 CSS Grid、Flexbox、容器查询和语义断点。
- 不以颜色作为唯一信息表达方式，错误、成功、警告状态必须同时有文本或图标语义。

## 11. 可访问性规范

- 语义化 HTML 优先，只有原生元素无法表达时才使用 ARIA。
- 所有可交互元素必须可键盘访问，并有清晰 focus 状态。
- 表单控件必须有 label、错误提示和辅助说明关联。
- 图片必须提供有意义的 `alt`；纯装饰图片使用空 `alt`。
- 弹窗、抽屉、下拉菜单必须处理焦点管理、Esc 关闭和焦点回归。
- 文本和背景对比度至少满足 WCAG AA。
- 页面结构使用正确标题层级，避免跳级和滥用标题。
- 动画尊重 `prefers-reduced-motion`。
- 自动播放音视频默认静音，并提供暂停能力。

## 12. 性能规范

### 12.1 性能指标

以 Core Web Vitals 作为基础性能目标：

- LCP：优秀目标小于 2.5s。
- INP：优秀目标小于 200ms。
- CLS：优秀目标小于 0.1。

### 12.2 实践要求

- 路由级拆包，非首屏能力延迟加载。
- 图片使用现代格式、明确尺寸、懒加载和框架图片优化能力。
- 字体使用子集化、预加载和 `font-display` 策略。
- 避免在首屏加载大型图表、编辑器、地图、播放器等重依赖。
- 长列表使用虚拟滚动或分页。
- 事件处理中的重计算必须节流、防抖或移入 Web Worker。
- 避免无意义的 memo；先用 profiler 定位，再优化。
- 构建产物需要定期分析 bundle 体积。
- 第三方脚本必须评估必要性、加载时机、失败影响和隐私风险。

## 13. 安全规范

- 禁止在前端仓库提交密钥、token、证书和生产配置。
- 环境变量按环境隔离，只有明确允许公开的变量才能进入客户端 bundle。
- 所有用户输入输出都要考虑 XSS，禁止直接拼接 HTML。
- 必须使用框架安全 API 或可信 sanitizer 处理富文本。
- 鉴权和权限必须以后端为准，前端权限只用于体验优化。
- 敏感操作必须防重复提交，并考虑 CSRF、重放和越权风险。
- 依赖定期审计，发现高危漏洞必须有升级、替换或隔离方案。
- iframe、postMessage、下载链接、跳转链接必须校验来源和目标。
- Cookie 使用 `HttpOnly`、`Secure`、`SameSite` 等安全属性，具体由后端和部署层统一管理。

## 14. 测试规范

测试金字塔建议：

- 单元测试：纯函数、hooks/composables、复杂状态机、数据转换。
- 组件测试：关键交互、表单校验、条件渲染、可访问性语义。
- 集成测试：页面级数据流、权限、路由、错误态。
- E2E 测试：登录、核心交易链路、关键回归路径。

测试原则：

- 测试用户行为，不测试实现细节。
- 优先按角色、文本、label 查询 DOM，少用 class 和 test id。
- Mock 外部系统，不 Mock 被测模块内部实现。
- 每个 bug 修复应补充能复现问题的测试。
- 快速测试在 PR 中必跑，慢速 E2E 可按主干、发布或定时运行。
- 快照测试谨慎使用，只适合稳定且人工审查成本低的输出。

## 15. 错误处理与可观测性

- 页面必须有全局错误边界和局部错误态。
- 接口错误、空数据、加载中、无权限、网络断开必须有明确 UI。
- 线上错误接入监控平台，至少包含版本号、路由、用户环境、错误堆栈、请求 ID。
- 关键交互埋点必须定义事件名、触发时机、属性字段和隐私边界。
- Web Vitals、资源加载失败、接口耗时、JS 错误、白屏应进入监控。
- 日志中禁止记录密码、token、身份证、手机号全量等敏感信息。

## 16. Git 与协作规范

- 主干保持可发布，功能开发使用短生命周期分支。
- Commit Message 推荐遵循 Conventional Commits。
- PR 必须小而聚焦，避免混入无关格式化和重构。
- Code Review 关注正确性、可维护性、类型边界、测试、性能、安全和用户体验。
- 所有 PR 合并前至少通过 lint、typecheck、test、build。
- 重大技术决策使用 ADR 或设计文档记录背景、方案、取舍和后续影响。

Commit 类型建议：

```text
feat: 新功能
fix: 缺陷修复
docs: 文档
style: 纯格式调整
refactor: 重构
perf: 性能优化
test: 测试
build: 构建系统或依赖
ci: CI 配置
chore: 其他工程事务
revert: 回滚
```

## 17. CI/CD 质量门

每个新项目至少配置以下脚本：

```json
{
  "scripts": {
    "dev": "启动本地开发",
    "build": "生产构建",
    "start": "启动生产产物",
    "lint": "代码规范检查",
    "typecheck": "TypeScript 类型检查",
    "test": "单元与组件测试",
    "test:e2e": "端到端测试",
    "format": "格式化代码"
  }
}
```

CI 必须执行：

- 安装依赖时使用 lockfile 严格模式。
- 校验 Node.js 与包管理器版本。
- 运行 lint、typecheck、test、build。
- 对生产构建产物做缓存和体积检查。
- 发布前记录版本号、commit SHA 和构建时间。
- 支持快速回滚到上一稳定版本。

## 18. 环境与配置规范

- 配置分为本地、测试、预发、生产，不同环境显式隔离。
- `.env.example` 必须列出必需变量、含义和示例值。
- 客户端可见环境变量必须有统一前缀，例如 `PUBLIC_`、`NEXT_PUBLIC_`、`VITE_`。
- 禁止在代码中硬编码环境地址、租户 ID、密钥和实验开关。
- 实验开关、灰度和降级策略应通过配置中心或远端开关管理。

## 19. 依赖管理规范

- 引入新依赖前评估：维护状态、bundle 体积、许可证、类型支持、安全记录、替换成本。
- 禁止为了少量工具函数引入大型依赖。
- 锁定依赖版本，升级通过独立 PR 完成。
- 定期清理未使用依赖。
- 对关键依赖升级必须跑完整回归。
- 浏览器端依赖必须关注 tree-shaking 和副作用声明。

## 20. 国际化与本地化

- 面向多语言产品时，文案不得硬编码在组件内部。
- 日期、时间、数字、货币使用 Intl 或统一格式化工具。
- 文案 key 命名应体现业务语义，不使用页面位置作为唯一语义。
- 布局需考虑长文本、不同语言方向和字体差异。
- 错误提示、空状态、按钮、表单 label 都需要纳入国际化范围。

## 21. 发布前检查清单

- `lint` 通过。
- `typecheck` 通过。
- `test` 通过，核心链路 E2E 通过。
- `build` 通过，无明显 bundle 异常。
- 页面 loading、empty、error、success 状态完整。
- 关键页面移动端、桌面端和主流浏览器验证通过。
- 表单校验、重复提交、接口失败和权限失败已验证。
- 基础可访问性检查通过，键盘可操作。
- Core Web Vitals 未明显退化。
- 无密钥、调试日志、测试账号、Mock 地址泄漏。
- 监控、埋点和错误上报可用。
- 回滚方案明确。

## 22. 新项目推荐落地模板

### 22.1 最小必备配置

- TypeScript strict。
- ESLint + 框架推荐规则 + Hooks/可访问性规则。
- Prettier 或 Biome 自动格式化。
- 路径别名，例如 `@/*` 指向 `src/*`。
- Git hooks：提交前格式化和 lint staged 文件。
- CI：lint、typecheck、test、build。
- `.env.example`。
- `README.md`：启动、构建、测试、目录结构、环境变量、发布说明。

### 22.2 推荐 ESLint 规则方向

- 框架官方推荐规则。
- TypeScript 推荐规则。
- React Hooks 规则。
- 可访问性规则。
- import 排序和循环依赖检查。
- 禁止未处理 Promise。
- 禁止默认导出是否采用需团队统一；大型项目推荐具名导出，便于重构。

### 22.3 README 必备内容

- 项目简介和技术栈。
- 本地开发前置条件。
- 安装、启动、构建、测试命令。
- 目录结构说明。
- 环境变量说明。
- 分支、提交、发布流程。
- 常见问题和排障方式。

## 23. 本项目提炼出的约定

从当前工作区内可见的前端项目配置中，可提炼出以下可复用约定：

- 使用现代 React/Next 技术栈。
- 使用 TypeScript，并开启 `strict`。
- 使用框架官方 ESLint 规则，并包含 Core Web Vitals 与 TypeScript 规则。
- 在 `package.json` 中声明 Node.js 最低版本。
- 提供统一脚本：`dev`、`build`、`start`、`lint`。
- 使用路径别名 `@/*` 降低深层相对路径成本。
- 通过构建命令验证生产产物。
- README 说明前置条件、快速启动、目录形态和常用命令。

这些约定适合作为新项目的基础骨架，再按具体业务补充测试、可访问性、安全、监控和发布流程。

## 24. 参考来源

- React 官方 Rules of React：<https://react.dev/reference/rules>
- Next.js ESLint 配置文档：<https://nextjs.org/docs/app/api-reference/config/eslint>
- web.dev Core Web Vitals：<https://web.dev/articles/vitals>
- W3C WAI Accessibility Principles：<https://www.w3.org/WAI/fundamentals/accessibility-principles/>
- OWASP Top 10：<https://owasp.org/www-project-top-ten/>
- Testing Library Guiding Principles：<https://testing-library.com/docs/guiding-principles/>
- Conventional Commits：<https://www.conventionalcommits.org/en/v1.0.0/>
- Airbnb JavaScript Style Guide：<https://github.com/airbnb/javascript>
