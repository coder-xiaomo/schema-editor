# 13 · 手动「升级项目结构」按钮

> 目标：核心重构后目录/数据结构发生破坏性变化（每表独立 JSON、initial-data 行内化、struct_version 1.0）。为避免自动改盘造成的不可预期损失，**提供显式按钮**，由用户手动触发从旧结构迁移到新结构。
> 依赖：统一路径层 `src/core/workspace/`、`[12-initial-data-inline.md](./12-initial-data-inline.md)`。

## 背景

旧结构（重构前）：
- 根 `common.json`（含全部 common_config）
- `schemas/<schema>.json`（每 schema 一个文件，含其下所有表）
- `initial-data/<schema>/<table>.json`（平行数组结构）
- `output/<dialect>/<schema>.sql`

新结构见 [`00-background.md`](./00-background.md) / [`12-initial-data-inline.md](./12-initial-data-inline.md)。

决策（已确认）：**不自动改盘**，由用户在界面显式触发「升级项目结构」；升级成功后清理对应的旧文件，**不再支持回退旧结构**（新结构新增字段回退会丢失）。

## 目标

1. `editor.ts` 打开项目时检测 `struct_version`：
   - 若 `< 1.0` 且目录为新结构不存在 → 提示「当前项目为旧结构，可升级」。
   - 提供「升级项目结构」按钮（工具栏/侧栏）。
2. 点击后执行一次性迁移：
   - 读取旧 `common.json` / `schemas/*.json` / `initial-data/*`，经升级器转为新内存态。
   - 写入新结构（`common.json` + `current/database.json` + 各 `table.json` + 各 `initial-data.json`）。
   - 迁移成功后清理「已迁移」的旧文件（旧 `schemas/*.json`、旧 `initial-data/*`，按"升级了哪里就清理哪里"原则逐一删除对应文件，不删整个目录）。根 `common.json` 已被覆盖重写为新结构，无需删除。
   - **不再支持回退旧结构**：因新结构新增字段回退会丢失，取消升级等同关闭项目。
3. 迁移完成后，`FileSystemObserver` 正常接管新结构。
4. 未升级前，若用户坚持用旧结构，可继续以旧结构打开（兼容读取保留）。

## 验收标准

- 旧结构项目打开时显示升级提示，点击按钮后磁盘变为新结构且数据完整（表、字段、索引、初始数据、注释、跳过、pre/post_sql 均不丢）。
- 升级后重新打开为「新结构项目」，无再次升级提示。
- 升级成功后对应的旧文件被清理（旧 `schemas/*.json`、旧 `initial-data/*`），不再保留可回退的旧结构。
- 取消升级将关闭项目返回空状态，不保留旧结构打开态。
- 未升级时旧结构可读可编辑（兼容路径经 `src/core/workspace/paths.ts` 解析）。
- `pnpm build` 通过，界面功能正常。

## 原子提交拆分建议

1. `feat: editor.ts 检测旧结构并显示升级提示`
2. `feat: 实现 migrateOldToNewStructure 迁移函数（读写旧→写新）`
3. `feat: 工具栏/侧栏接入「升级项目结构」按钮`
4. `test: 迁移函数 Vitest 单测（内存态转换 + 路径映射，不接 jsdom）`

## 实现状态（已落地范围）

本步骤的**必要前提**已随第 11 步一并实现（旧结构打开 → 弹窗确认 → 迁移 → 清理旧文件 → 加载新结构）：

- `editor.ts` `_openRootHandle` 检测旧结构（读取根 `common.json` 的 `struct_version` 与 `CURRENT_STRUCT_VERSION` 比对，不再依赖 `current/` 目录是否存在）时，设置 `showUpgradeModal` + `pendingUpgradeRootHandle`，**不自动改盘**；用户确认后 `confirmUpgradeStructure` 才执行 `_migrateAndLoad`。
- 升级弹窗已从专用 `UpgradeModal.vue` **重构为通用 `ConfirmModal.vue`**：弹窗本身不再耦合任何业务文案或提交逻辑，完全由 props 驱动（`title` / `message` / `confirmText` / `cancelText`）+ 事件回调（`confirm` / `cancel`）。`App.vue` 中传入 `upgrade.*` 文案并绑定 `store.confirmUpgradeStructure()` / `store.cancelUpgradeStructure()`。
- **升级成功后清理已迁移的旧文件**（`cleanupOldStructure`）：逐一删除旧 `schemas/<schema>.json` 与旧 `initial-data/<schema>/<table>.json`（已分别整体迁移为 `current/schemas/<schema>/` 下文件与行内化的 `initial-data.json`）。仅删具体已迁移文件、不删整个目录（目录可能含用户其他文件）。旧根 `common.json` 在迁移时已被**覆盖重写**为新结构，无需删除。
- **取消升级 = 关闭项目**：`cancelUpgradeStructure` 清空所有状态并返回空状态（不再保留旧结构打开态）。弹窗取消文案为「暂不升级，并关闭项目」。
- **不再支持回退旧结构**：因新结构新增字段（如 `database.json` 的 `schema_order`、每表行内化的初始数据），回退旧结构会导致这些字段丢失，故升级后彻底禁止回退。

> 完整「工具栏/侧栏显式升级按钮 + 兼容以旧结构继续编辑」为后续增强项，本文档第 1 项「提供按钮」目标仍在规划中。当前是「打开旧项目时自动弹窗」形式。

## 迁移架构（已落地：逐个版本升级 + 单文件脚本）

升级机制设计为**按版本逐个运行的迁移链**，无论目录布局如何调整都能通过新增迁移脚本完成，且用户落后多个版本时也能逐级升到最新：

- **版本权威**：`CURRENT_STRUCT_VERSION`（当前 `1.0`）定义在 `src/core/workspace/layout.ts`，作为根 `common.json` 的 `struct_version` 写入值与判定基准（置于 layout 以避免 `file-helpers` ↔ `version-upgrader` 循环依赖）。`1.0` 是引入 `current/` 新布局后的第一个结构版本；此前旧磁盘格式（平行 `schemas/` + `initial-data/` 目录）对应的结构版本记为 `0.4`，即数据级升级链（`version-upgrader.UPGRADE_STEPS`）的当前末端。
- **判定**：`file-helpers.isNewStructure` 读取根 `common.json` 的 `struct_version` 与 `CURRENT_STRUCT_VERSION` 比较，不再依赖 `current/` 目录是否存在（避免空目录残留误判）。
- **结构迁移注册表**：`src/utils/structure-migrations/index.ts` 的 `STRUCTURE_MIGRATION_STEPS`（每条 `{ from, to, migrate }`）+ 通用调度器 `runStructureMigrations(rootHandle, fromVersion, deps, targetVersion)`。调度器从 `fromVersion` 出发，按注册表顺序循环查找 `from === current` 的下一步执行，直到达到 `targetVersion`，**天然支持用户落后多版本时依次跑**（如 `0.4 → 1.0` 会依次跑各注册表步骤直到目标版本）。当前 `CURRENT_STRUCT_VERSION = '1.0'`，即迁移链终点，`2.0` 不在本批次范围内。
- **每个版本一个脚本文件**：`src/utils/structure-migrations/v0_4-to-v1.ts` 导出 `migrate(rootHandle, deps)`，自包含地完成「读 from 磁盘 → 数据级升级 → 写 to 磁盘 → 清理已迁移旧文件」。未来新增 `v1-to-v2.ts` 只需新建文件并在注册表追加一行，**旧代码零改动**。
- **依赖注入打破循环**：脚本所需的「数据级升级」（`upgradeData`，来自 `version-upgrader.upgradeSchemaData`）与「表序列化」（`transformTable`，来自 `editor.buildSchemaExportData`）由调度器注入，脚本文件不反向依赖 `version-upgrader`/`editor`，避免模块循环。
- **数据级升级链**：`version-upgrader.UPGRADE_STEPS`（内存态字段迁移，如 `pgsql → postgresql`）仍按 `from→to` 链运行，由脚本在写盘前调用。
- **清理旧文件**：每个脚本内部按「升级了哪里就清理哪里」原则，迁移成功后删除对应的旧文件（不删整个目录），彻底禁止回退旧结构。
