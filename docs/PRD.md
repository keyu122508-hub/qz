# 浅酌（TavernLite）产品需求文档 PRD

- 版本：v0.1（MVP 蓝图）
- 日期：2026-11-07
- 状态：草案
- 范围：MVP v1.0 + 后续路线图

---

## 1. 产品概述

### 1.1 背景与动机

AI 角色扮演赛道存在明显两极分化：

- **酒馆（SillyTavern）**：功能强大、免费开源，但需本地部署 Node.js，界面硬核，移动端体验差，普通用户门槛极高。
- **dzmm / 星野等国内商业产品**：体验精美、移动优先，但收费高昂，不支持用户自有 API，内容受平台审核，角色卡生态封闭。

一群"被精美体验吸引→被高价劝退→寻找平替→被酒馆门槛挡住"的用户长期被忽视。浅酌面向这批中间用户。

### 1.2 一句话定位

> 酒馆能开的角色卡我都能开，但你不用配环境，手机点开就聊。

### 1.3 核心价值主张

1. 兼容酒馆 PNG 角色卡格式，迁移成本为零，直接继承整个角色卡生态
2. 移动优先、克制美观的对话界面
3. 用户自带 API Key，平台不收模型费
4. 内容高自由度，海外部署，不做平台侧内容审核
5. 纯前端 + 海外静态部署，运营成本极低

### 1.4 目标用户

- 被国内商业 AI 角色扮演 App 吸引但被月费劝退，正在寻找平替的玩家
- 想用酒馆但搞不定本地部署 / 手机部署的用户
- 已有自己的 API Key（OpenAI / Claude / OpenRouter）或愿意自建中转的用户
- 对 NSFW 角色扮演有需求、被主流平台审核限制的用户

---

## 2. 目标与范围

### 2.1 MVP 目标（v1.0）

- 能导入并正常使用酒馆格式角色卡进行角色扮演对话
- 支持主流 API 自助配置并直连（OpenAI / Claude / OpenRouter / 自定义 endpoint）
- 移动端 PWA 体验达到 dzmm 的基础界面质感
- 本地持久化对话历史（IndexedDB，不上云）
- 部署为海外静态站 + PWA + 可打包 Android APK

### 2.2 明确不做（Non-Goals）

- 不做模型推理服务（用户自带 Key，平台不承担推理成本）
- 不做官方内容审核 / 举报机制
- 不做签到 / 任务 / 活动等运营功能
- 不做按量计费墙锁核心功能
- 不做第三方插件 / 扩展系统（MVP 阶段）
- 不做正则替换、极致提示词工程面板等硬核配置

---

## 3. 用户场景

| # | 场景 | 描述 |
|---|------|------|
| S1 | 首次体验 | 用户收到分享链接，浏览器打开，导入一张角色卡 PNG，填入 API Key，开始聊天 |
| S2 | 日常使用 | 手机 PWA 桌面图标，点开继续上次对话，切换角色或重生分支 |
| S3 | 角色创作 | 用户用内置编辑器创建角色卡，导出 PNG 分享给朋友或发布到社区 |
| S4 | 进阶玩家 | 配置自定义 endpoint 接自建中转或本地模型，调整温度等采样参数 |

---

## 4. 功能需求总览

优先级：**P0 = MVP 必做 / P1 = MVP 后紧接 / P2 = 远期规划**

| 模块 | 功能 | 优先级 |
|------|------|--------|
| 角色卡 | PNG 角色卡导入（兼容酒馆 chara_card_v2） | P0 |
| 角色卡 | 角色卡导出（PNG + JSON） | P0 |
| 角色卡 | 角色列表管理（收藏 / 删除 / 置顶 / 搜索） | P0 |
| 角色卡 | 多开场白切换（alternate_greetings） | P0 |
| 角色卡 | 角色卡内嵌世界书读取与使用 | P0 |
| 角色卡 | 可视化角色卡编辑器（结构化表单） | P1 |
| 对话 | 气泡式流式对话（移动端优先） | P0 |
| 对话 | 重生 / Swipe 分支 | P0 |
| 对话 | 编辑 / 删除任意历史消息 | P0 |
| 对话 | 宏占位符 {{char}} {{user}} 支持 | P0 |
| 对话 | 对话导出（JSON / TXT） | P0 |
| API | API 配置（选 Provider + 填 Key + 选模型） | P0 |
| API | 多套 API 配置保存与切换 | P0 |
| API | 连接测试按钮 | P0 |
| API | 采样参数高级设置（温度 / maxTokens 等） | P0 |
| 世界书 | 可视化世界书编辑器（关键词触发、条目管理） | P1 |
| 记忆 | 对话历史本地持久化（IndexedDB） | P0 |
| 立绘 | 角色头像 + 情绪表情切换 | P1 |
| 发现 | 角色广场（社区分享） | P1 |
| 界面 | 主题切换（深色 / 浅色 / 跟随系统） | P1 |
| 数据 | 聊天记录备份导入导出 | P1 |
| 群聊 | 多角色同框群聊 | P2 |
| TTS | 语音合成 | P2 |
| 长期记忆 | 向量记忆 / 摘要记忆 | P2 |

---

## 5. 数据模型与字段定义

### 5.1 角色卡（兼容酒馆 chara_card_v2 子集）

导入：解析 PNG tEXt/iTXt chunk 中的 `chara` 字段（base64 JSON）。  
导出：按 v2 规范封装，保证酒馆可回读。**未知字段透传不丢失。**

```jsonc
{
  "spec": "chara_card_v2",
  "spec_version": "2.0",
  "data": {
    // UI 主区暴露
    "name": "string",
    "description": "string",
    "personality": "string",
    "scenario": "string",
    "first_mes": "string",
    "mes_example": "string",
    "alternate_greetings": ["string"],
    "system_prompt": "string",
    "creator": "string",
    // UI 高级折叠区
    "post_history_instructions": "string",
    "creator_notes": "string",
    "tags": ["string"],
    "character_version": "string",
    // 透传，不在 UI 暴露
    "extensions": {},
    "character_book": {}   // 见 5.2
  }
}
```

### 5.2 世界书 / Lorebook

```jsonc
{
  "name": "string",
  "description": "string",
  "scan_depth": 4,
  "token_budget": 512,
  "recursive_scanning": false,
  "extensions": {},
  "entries": [{
    "id": 0,
    "name": "string",
    "comment": "string",
    "keys": ["string"],
    "secondary_keys": ["string"],
    "content": "string",
    "enabled": true,
    "constant": false,
    "selective": false,
    "case_sensitive": false,
    "insertion_order": 100,
    "position": "before_char",
    "extensions": {}
  }]
}
```

MVP 支持：keys 触发 / content / enabled / constant / insertion_order / position。  
P1 补充：secondary_keys / selective / recursive_scanning。

### 5.3 API 配置

```jsonc
{
  "id": "string",
  "name": "string",           // 默认自动生成"我的 OpenAI"
  "provider": "openai" | "claude" | "openrouter" | "custom",
  "baseUrl": "string",        // 自定义时用户填写；标准 provider 自动填充
  "apiKey": "string",         // 存 IndexedDB，不明文回显，不上传服务器
  "model": "string",
  "temperature": 1.0,
  "maxTokens": 2048,
  "contextLimit": 8192,
  "streaming": true,
  "createdAt": 0,
  "updatedAt": 0
}
```

Provider 默认值：

| Provider | baseUrl | 默认模型 |
|----------|---------|---------|
| openai | https://api.openai.com/v1 | gpt-4o |
| claude | https://api.anthropic.com | claude-3-5-sonnet-20241022 |
| openrouter | https://openrouter.ai/api/v1 | openrouter/auto |
| custom | 空（必填） | 空（必填） |

### 5.4 对话（Chat）

```jsonc
{
  "id": "string",
  "characterId": "string",
  "apiConfigId": "string",
  "title": "string",          // 默认"角色名 · 日期"
  "greetingIndex": 0,         // 0 = first_mes，1+ = alternate_greetings
  "createdAt": 0,
  "updatedAt": 0
}
```

### 5.5 消息（Message）

```jsonc
{
  "id": "string",
  "chatId": "string",
  "role": "user" | "assistant" | "system",
  "content": "string",
  "swipes": ["string"],       // 重生分支内容数组
  "currentSwipe": 0,
  "createdAt": 0,
  "metadata": {
    "tokens": 0,
    "model": "string"
  }
}
```

### 5.6 全局设置（localStorage）

```jsonc
{
  "userName": "User",
  "theme": "system",          // "light" | "dark" | "system"
  "fontSize": "md",           // "sm" | "md" | "lg"
  "defaultApiConfigId": "string",
  "ageConfirmed": false,
  "renderHtml": true,
  "streamingAnimation": true
}
```

---

## 6. 界面结构与页面清单

### 6.1 信息架构

```
首启动流程：
  年龄确认页 → 用户名设置页（可跳过）→ 主界面

主界面（底部 Tab 导航，移动端优先）：
  ├─ 💬 聊天    当前对话
  ├─ 🎭 角色    角色列表 + 导入入口
  ├─ 🔍 发现    角色广场（P1）
  └─ ⚙️ 我的    API 配置 / 外观 / 数据 / 关于
```

### 6.2 页面清单

| ID | 页面名 | 优先级 |
|----|--------|--------|
| P1 | 对话页 | P0 |
| P2 | 角色列表页 | P0 |
| P3 | 角色详情 / 新建对话页 | P0 |
| P4 | 角色卡导入页 | P0 |
| P5 | 角色卡编辑器 | P1 |
| P6 | 世界书编辑器 | P1 |
| P7 | API 配置列表页 | P0 |
| P8 | API 配置编辑页 | P0 |
| P9 | 发现 / 角色广场 | P1 |
| P10 | 设置页 | P0 |
| P11 | 年龄确认页 | P0 |

### 6.3 P8 API 配置编辑页（简化设计）

**设计原则：最简路径只需 3 步——选 Provider、粘贴 Key、测试保存。**

主区（默认可见）：

```
┌─────────────────────────────────────┐
│  选择服务商                          │
│  ┌────────┐ ┌────────┐              │
│  │ OpenAI │ │ Claude │              │
│  └────────┘ └────────┘              │
│  ┌──────────────┐ ┌────────┐        │
│  │  OpenRouter  │ │ 自定义 │        │
│  └──────────────┘ └────────┘        │
│                                     │
│  【仅"自定义"时出现】                 │
│  API 地址                           │
│  ┌───────────────────────────────┐  │
│  │ https://...                   │  │
│  └───────────────────────────────┘  │
│                                     │
│  API Key                            │
│  ┌──────────────────────────┐  👁   │
│  └──────────────────────────┘       │
│  去哪里获取？→（外链）               │
│                                     │
│  模型                               │
│  ┌────────────────────────────────▼┐│
│  │ gpt-4o（根据 Provider 自动填）  ││
│  └─────────────────────────────────┘│
│                                     │
│  ▶ 高级设置（折叠）                  │
│                                     │
│  [  取消  ]      [ 测试并保存 ]      │
└─────────────────────────────────────┘
```

高级设置（折叠区）：
- 配置名称（默认自动生成"我的 OpenAI"，用户可改）
- 温度（0.0 ~ 2.0，滑块，默认 1.0）
- 最大输出 Token（默认 2048）
- 上下文窗口（默认 8192）
- 流式输出（开关，默认开）

"测试并保存"行为：
1. 发送 `{"role":"user","content":"hi"}` 到配置的 endpoint
2. 成功 → 提示"连接成功，已保存"并返回列表
3. 失败 → 红色错误提示（含错误码），停留页面供用户修改

### 6.4 其他关键页面线框

**P1 对话页**

```
┌─────────────────────────────────────┐
│ ← [头像] 角色名称           [⋮菜单] │
├─────────────────────────────────────┤
│         [角色头像]                  │
│   ┌───────────────────────────┐     │
│   │ 角色消息（左对齐气泡）     │     │
│   └───────────────────────────┘     │
│        ↺重生  ✎编辑  📋复制         │
│                                     │
│              ┌──────────────────┐   │
│              │ 用户消息（右对齐）│   │
│              └──────────────────┘   │
│                      ✎编辑  🗑删除  │
├─────────────────────────────────────┤
│ ┌──────────────────────┐  [发送 ↑] │
│ │ 输入消息...           │           │
│ └──────────────────────┘           │
└─────────────────────────────────────┘

顶部 ⋮ 菜单：导出对话 / 查看角色卡 / 切换 API / 清空对话
```

**P2 角色列表页**

```
┌─────────────────────────────────────┐
│  角色                    [+ 导入]   │
│  🔍 搜索角色名...                   │
├─────────────────────────────────────┤
│  ┌──────────────────────────────┐   │
│  │ [头像] 角色名            [⋮] │   │
│  │        简介前 40 字...       │   │
│  │        最近聊天：昨天        │   │
│  │              [继续对话]      │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
卡片 ⋮ 菜单：置顶 / 导出角色卡 / 删除
```

**P4 角色卡导入页**

```
┌─────────────────────────────────────┐
│  导入角色卡                          │
│  ┌──────────────────────────────┐   │
│  │  📁 上传 PNG / JSON 文件     │   │
│  │     点击或拖拽至此            │   │
│  └──────────────────────────────┘   │
│  ── 或 粘贴 JSON ──                 │
│  ┌──────────────────────────────┐   │
│  │                              │   │
│  └──────────────────────────────┘   │
│  ── 或 URL 拉取 ──                  │
│  ┌──────────────────────────────┐   │
│  │ https://...                  │   │
│  └──────────────────────────────┘   │
│  ─── 解析成功后预览 ───              │
│  ┌──────────────────────────────┐   │
│  │ [头像] 角色名  creator       │   │
│  │ 描述前 80 字...  #tag        │   │
│  └──────────────────────────────┘   │
│  [取消]              [确认导入]      │
└─────────────────────────────────────┘
```

**P3 角色详情 / 新建对话页**

```
┌─────────────────────────────────────┐
│ ←  角色详情              [✎ 编辑]  │
│       [角色头像（大）]               │
│         角色名称  creator           │
│         #tag1 #tag2                │
│  ── 描述 ─────────────────────────  │
│  角色描述展开内容...                 │
│  ── 选择开场白 ────────────────────  │
│  ◉ 开场白 1（默认）                 │
│  ○ 开场白 2                        │
│  ── 预览 ──────────────────────────  │
│  当前选中开场白内容预览...            │
│           [ 开始新对话 ]            │
└─────────────────────────────────────┘
```


---

## 7. 技术架构

### 7.1 技术栈

| 层次 | 选型 | 说明 |
|------|------|------|
| 前端框架 | React 18 + TypeScript | 生态成熟，组件丰富 |
| 构建工具 | Vite | 快速 HMR，PWA 插件完善 |
| UI 组件 | Tailwind CSS + shadcn/ui | 响应式，暗色主题支持好 |
| 状态管理 | Zustand | 轻量，适合纯前端架构 |
| 本地数据库 | Dexie.js（IndexedDB 封装） | 存对话 / 角色卡 / API 配置 |
| PWA | vite-plugin-pwa + Workbox | 离线缓存，添加桌面图标 |
| PNG 解析 | 自写 tEXt chunk 解析 | 读写 PNG 中的角色卡 JSON |
| HTTP 客户端 | 原生 fetch + SSE 流式读取 | 浏览器直连 API |
| 移动端打包 | Capacitor（Android APK） | 不改代码直接打包 |

### 7.2 部署架构

```
用户浏览器 / PWA / APK
    │
    ├── 静态资源 ──→ Cloudflare Pages（海外节点，免费额度够 MVP）
    │
    └── API 调用 ──→ 用户配置的 endpoint（浏览器直连，不过浅酌服务器）
                     ├── api.openai.com
                     ├── api.anthropic.com
                     ├── openrouter.ai
                     └── 用户自建中转（Cloudflare Worker 等）
```

**关键合规设计：浅酌服务器不经手任何对话内容和 API Key。**

### 7.3 数据流

```
用户操作
  → Zustand Store（运行时状态）
  → Dexie.js IndexedDB（持久化：角色卡 / 对话 / 消息 / API 配置）

发送消息：
  → 构建上下文消息数组（宏替换 + 世界书注入）
  → fetch 调用用户 API endpoint
  → SSE 流式读取 → 逐字渲染 → 写入 IndexedDB
```

### 7.4 API 直连 CORS 支持

| Provider | 浏览器直连 |
|----------|-----------|
| OpenAI | ✅ 支持（Authorization header） |
| Claude (Anthropic) | ✅ 支持 |
| OpenRouter | ✅ 支持 |
| 自定义 endpoint | 取决于中转服务配置，需服务端开启 CORS |

---

## 8. 提示词注入顺序（上下文构建逻辑）

最终发送给模型的消息数组按如下顺序组装：

```
1. [system]  全局系统提示词
             （若角色卡有 system_prompt 则覆盖全局）
2. [system]  角色描述块：description + personality + scenario 拼合
3. [system]  世界书 constant 条目（按 insertion_order 排序）
4. [system]  mes_example（对话示例，格式化为 few-shot）
5. [...]     历史对话消息
             （超出 contextLimit 时从最旧条截断）
6. [system]  世界书关键词触发条目
             （扫描最近 scan_depth 条消息，按 insertion_order 排序）
7. [system]  post_history_instructions（若存在）
8. [user]    用户本次输入（宏替换后）
```

---

## 9. 非功能需求

| 类别 | 要求 |
|------|------|
| 性能 | 首屏 < 2s（Cloudflare CDN）；流式首字 < 1s（API 延迟为主）；本地 DB 查询 < 50ms |
| 安全 | API Key 仅存 IndexedDB，不明文回显，不上传任何服务器；全站 HTTPS |
| 合规 | 首启动强制年龄确认（18+）；服务条款明确用户对 API 使用和生成内容自担责任；不面向中国大陆应用商店 |
| 隐私 | 无账号体系（MVP 本地优先）；无第三方埋点；不收集用户行为数据 |
| 可访问性 | 深浅色切换；尊重 prefers-reduced-motion；键盘可达基础交互 |
| 兼容性 | Chrome 90+ / Safari 15+ / Firefox 90+；iOS 15+ PWA；Android 8+ WebView |

---

## 10. 路线图

| 版本 | 主要内容 | 目标 |
|------|----------|------|
| v1.0 MVP | P0 全部功能 | 单人角色扮演完整闭环可用 |
| v1.1 | 角色卡编辑器 + 世界书编辑器 + 角色广场基础 | 创作者可自建并分享角色 |
| v1.2 | 立绘/表情 + 主题切换 + 备份导入导出 | 体验质感全面补齐 |
| v2.0 | 群聊 + TTS + 向量长期记忆 | 进阶玩家功能完善 |

---

## 11. 商业模式

| 模式 | 说明 |
|------|------|
| 核心功能免费 | 用户自带 Key，平台无推理成本，功能不设付费墙 |
| 可选 API 中转（增值） | 为无法直连的用户提供付费中转，用户明确选择，非默认 |
| 远期角色广场 | 创作者激励 / 打赏，MVP 不涉及 |

---

## 12. 风险与应对

| 风险 | 应对方案 |
|------|---------|
| NSFW 内容合规 | 纯前端直连 + 海外部署 + 年龄确认 + 服务条款免责 |
| API CORS 限制 | 主流厂商已支持；不支持的引导用户配置自建中转 |
| iOS 分发 | PWA + Safari 添加桌面为主，不依赖 App Store |
| 角色卡格式演进 | 读 v2 核心子集，未知字段透传，保持前向兼容 |
| API Key 泄露 | Key 存 IndexedDB 不上传；文档提示用户设置 API 用量限额 |
| 用户获取 | B 站 AI 区、小红书、酒馆社区切入"手机平替"心智 |

---

## 13. 附录

### 13.1 角色卡格式参考

酒馆官方规范：https://github.com/SillyTavern/SillyTavern/blob/release/src/char-data.js

PNG 存储：角色卡 JSON 经 base64 编码后存于 PNG tEXt chunk，key 为 `chara`。

### 13.2 宏占位符（MVP 支持子集）

| 宏 | 替换为 |
|----|--------|
| `{{char}}` | 角色名（data.name） |
| `{{user}}` | 用户名（全局设置 userName） |
| `{{charDescription}}` | 角色描述（data.description） |
| `{{charPersonality}}` | 角色性格（data.personality） |
| `{{scenario}}` | 情境设定（data.scenario） |

### 13.3 竞品对比（参考）

| 产品 | 定价 | 自带 API | 移动端 | NSFW |
|------|------|---------|--------|------|
| SillyTavern（酒馆） | 免费 | ✅ | ❌ 差 | ✅ |
| dzmm / 风月 | ¥30-200/月 | ❌ | ✅ | 擦边 |
| 星野 AI | 免费+内购 | ❌ | ✅ | ❌ |
| Character.AI | $9.99/月 | ❌ | ✅ | ❌ |
| Janitor AI | 免费+自带 API | ✅ | 一般 | ✅ |
| **浅酌（本产品）** | **免费+可选中转** | **✅** | **✅** | **✅** |

