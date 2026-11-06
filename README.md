# xstart

自用 Chrome 新标签页扩展（Manifest V3，纯 HTML/JS，无构建步骤）。

- **搜索**：Google / Bing / 百度 / DuckDuckGo / Brave，点左侧图标切换；Enter 当前页打开，⌘/Ctrl+Enter 新标签打开；`/` 聚焦。
- **AI 对话**：一次输入，按选中的服务商各开一个标签页并自动填入、发送（用你已登录的网页账号，不需要 API key）。支持 ChatGPT、Claude、Gemini、Grok、DeepSeek、Qwen、Kimi、豆包、Perplexity；设置里可关闭「自动发送」只填入。
- **书签**：添加时自动采集站点图标（页面 `<link>` 图标优先，其次 Google favicon 服务、`/favicon.ico`），缓存为 data URL；拖拽排序，悬停 `⋯` 编辑。
- **背景**：Bing 每日一图、Google Earth View、Unsplash（需 Access Key）、Picsum；可设刷新间隔，可把每张刷新到的图保存到你选的目录。

## 安装

1. 打开 `chrome://extensions`，打开右上角「开发者模式」
2. 「加载已解压的扩展程序」→ 选择本目录
3. 改代码后在扩展页点刷新按钮即可

## 说明

- 设置、书签都在 `chrome.storage.local`，卸载扩展会丢失。
- 图片保存用 File System Access API：在设置里选目录；Chrome 重启后可能需要重新授权，届时右下角出现黄色「待保存」按钮，点一下授权并补存。授权弹窗里选「每次访问都允许」可免去重复授权。同一张图（同来源同 ID）不会重复保存。
- AI 填入依赖各家网页结构，选择器在 `src/providers.js`；某家失效时先改那里。注入结果会打到扩展 service worker 的 console（`chrome://extensions` → xstart → service worker）。
- `data/earthview.json` 是 Earth View 图片 ID 列表（来自 github.com/limhenry/earthview），打包在扩展里避免运行时依赖。
