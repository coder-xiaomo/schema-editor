# 10 · 统一路径层 `src/core/workspace/`

> 目标：把当前散落在 `file-helpers.ts` 与 `editor.ts` 中的目录路径拼接、句柄获取逻辑，收敛到独立的 `src/core/workspace/` 模块，为目录重构（[`11-directory-restructure.md`](./11-directory-restructure.md)）提供单一事实来源。

## 背景

当前路径相关逻辑分散：

- `file-helpers.ts` 直接 `getDirectoryHandle('schemas')` / `getDirectoryHandle('initial-data')` / `getDirectoryHandle('output')`。
- `editor.ts` 保存时硬编码 `${schema.schema}.json`、遍历 `schemas/` 等。
- 目录重构后路径规则更复杂（`current/schemas/<schema>/<table>/{table.json,initial-data.json}`、`current/database.json`、`baselines/`、`migrations/`），若仍散落各处，影响范围巨大且易错。

## 目标

1. 新增 `src/core/workspace/`，集中定义：
   - 各板块相对根目录的路径片段常量（`CURRENT_DIR`、`SCHEMAS_DIR`、`BASELINES_DIR`、`MIGRATIONS_DIR`、文件名友好化规则等）。
   - 基于 `FileSystemDirectoryHandle` 的句柄获取/创建辅助（`getOrCreateDir`、`getFileHandleSafe` 等）。
   - 业务逻辑层路径解析（`resolveTableDir(root, schema, table)`、`resolveTableJson(root, schema, table)`、`resolveInitialDataJson(...)`、`resolveDatabaseJson(root)`、`resolveBaselineFile(root, id)`、`resolveMigrationFile(root, id)`）。
2. 旧路径（`schemas/`、`initial-data/`、`output/`）的兼容读取也先收敛到本模块（便于 [`13-upgrade-button.md`](./13-upgrade-button.md) 做一次性迁移）。
3. `file-helpers.ts` 与 `editor.ts` 改为调用本模块，不再各自拼路径。

## 目录结构建议

```
src/core/workspace/
├── layout.ts          # 路径常量 + 文件名友好化（sanitizeName）
├── handles.ts         # 基于 handle 的目录/文件句柄获取与创建（业务无关）
└── paths.ts           # 业务路径解析（组合 layout + handles，含新旧结构）
```

- `layout.ts`：纯常量与字符串规则，可单测（Vitest，不接 jsdom）。
- `handles.ts`：仅封装 `getDirectoryHandle` / `getFileHandle` / `removeEntry` 等 FS Access API，保持无业务语义。
- `paths.ts`：组合前两者，对 `editor.ts` 暴露语义化路径解析。

## 验收标准

- `file-helpers.ts` 中所有 `getDirectoryHandle('schemas' | 'initial-data' | 'output')` 等硬编码路径，改为经由 `src/core/workspace/` 解析；`file-helpers.ts` 仅保留纯文件读写原语或整体迁移到 `handles.ts`。
- `editor.ts` 保存/读取逻辑不再出现手写路径字符串拼接（如 `${schema.schema}.json`），统一走 `paths.ts`。
- 新增 `layout.ts` 的 `sanitizeName` 与路径常量有 Vitest 单测覆盖（纯逻辑，不接 jsdom）。
- `pnpm build` 通过，现有打开/保存/拖拽目录功能行为不变。
- 代码风格与现有一致（注释、空行语义分组）。

## 原子提交拆分建议

1. `feat: 新增 src/core/workspace/layout.ts 路径常量与 sanitizeName`
2. `feat: 新增 src/core/workspace/handles.ts 句柄获取原语`
3. `feat: 新增 src/core/workspace/paths.ts 业务路径解析`
4. `refactor: editor.ts/file-helpers.ts 改用 workspace 路径层`
5. `test: 为 layout.ts 补充 sanitizeName 与路径拼接 Vitest 单测`
