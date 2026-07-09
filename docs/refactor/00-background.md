# 背景与公共基础

> 本文件沉淀跨步骤的公共知识。各步骤文档通过相对链接引用本文对应章节，避免重复描述。

## 1. 分支与提交流程

- 所有重构在本地分支 **`refactor/modularize-stores`** 上进行：
  ```bash
  git checkout -b refactor/modularize-stores
  ```
- **原子提交原则**：每个独立改动单独提交，单次提交只解决一个问题。
- **提交信息规范**：
  - 修复类：`fix: <简明描述>`
  - 功能/重构类：`feat: <简明描述>`
  - 禁止 `step1 xxx` / `step2 xxx` 式描述。
- **可运行约束**：每次提交前必须 `pnpm build`（或至少 `vue-tsc` 类型检查通过），不提交编译报错的版本。

## 2. 代码风格约定（保持不变）

重构过程中**必须保留原有代码风格**，包括但不限于：

- `.map` / `.filter` 等链式调用的换行习惯（每个回调换行）。
- 注释的位置与措辞风格。
- **逻辑语义分组**：同一语义的若干行放在一起，不同语义之间保留一个空行。
- 模块内部类型与实现混放是既有设计策略（便于就近查找），仅把多模块共用的类型抽到更高层级。

## 3. 现有项目架构（第一批视角）

- 技术栈：Vue 3.5 + TypeScript + Vite + Pinia + vue-i18n；纯前端，基于 File System Access API 读写本地工作目录。
- 关键目录：
  - `src/stores/editor.ts` —— 单一核心 store（体量较大，第一批**不拆分**，仅收敛其内部散落的方言读取）。
  - `src/utils/version-upgrader.ts` —— 运行时数据结构升级器，当前 `CURRENT_STRUCT_VERSION = '0.4'`。
  - `src/utils/sql-generator/` —— SQL 生成器（`shared.ts` / `mysql.ts` / `postgresql.ts`）。
  - `src/utils/index-column-utils.ts` —— 索引列解析与方言覆盖工具。
  - `src/assets/style/` —— 14 个按功能拆分的全局 `.css`，由 `index.css` 汇总 `@import`，在 `main.ts` 引入。
- 当前样式入口链路：`main.ts` → `import './assets/style/index.css'` → `@import` 14 个 `.css`。

## 4. 方言解析约定（详见 [`02-dialect-resolver.md`](./02-dialect-resolver.md)）

现状：针对数据库方言的配置覆盖，采用「在配置对象上单独加 `mysql:{}` / `postgresql:{}` 属性」的方式，读取处散落形如：

```ts
const x = obj.mysql?.attr ?? obj.attr ?? 'default'
```

第一批将引入统一方言解析辅助函数（如 `resolveDialectOverride(obj, dialect, key, fallback)`），把所有散落读取收敛到一处。新增代码**必须**走辅助函数，不再新增散落读取。

> 注：`pgsql` 是历史遗留字段名（0.3→0.4 升级时改为 `postgresql`），见第 5 节。

## 5. 版本升级机制（详见 [`03-version-upgrader-cleanup.md`](./03-version-upgrader-cleanup.md)）

- 数据结构版本存于 `common.json` 的 `struct_version`。
- 打开项目时 `version-upgrader.ts` 按版本逐步升级到 `CURRENT_STRUCT_VERSION`。
- 历史兼容：0.3→0.4 升级涉及 `pgsql` → `postgresql` 字段重命名，运行时仍需读取旧字段名，因此存在大量 `@ts-expect-error`。第一批将其收敛到 `readLegacyField()` 辅助函数内，消除散落的 `@ts-expect-error`。

## 6. 文档约定

- 过时且与代码明显脱节的文档（如 `.qoder/` 下部分 spec）可归档或删除；仍能帮助未来维护的文档（DEVELOPMENT.md / README.md）更新为最新目录结构。
- 每个步骤文档至少包含「目标」与「验收标准」两节。
