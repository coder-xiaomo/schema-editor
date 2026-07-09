# 15 · 基线快照 / 迁移脚本 设计文档

> 状态：**设计文档，待评审**。可运行实现（快照创建/列表、基于名称的初级 diff、用户自定义 SQL 步骤）留到 `field_id` 引入后落地。
> 依赖：[`11-directory-restructure.md`](./11-directory-restructure.md) 的目录布局。

## 背景与目标

用户希望未来能自动生成数据库变更 DDL：任选两个基线版本（或当前 vs 某基线），生成变更脚本（rename / 删+加 / 清空列 / 刷 SQL 逻辑 / 自定义迁移 SQL）。

决策（已确认）：本次**只出设计文档**，实现待 `field_id` 落地后。原因：rename 跟踪需稳定 id（field_id），在 field_id 前只能按名称匹配，rename 会退化成「删+加」丢失数据，不符合预期。

## 数据模型

1. **基线快照**：`baselines/<timestamp>-v<version>.json`，结构与 `current/` 一致（`database.json` + `schemas/<schema>/<table>/{table.json,initial-data.json}`）。创建基线 = 将 `current/` 深拷贝一份带时间戳的文件。
2. **迁移脚本**：`migrations/<migration-id>.json`：
   ```json
   {
     "id": "...",
     "from_baseline": "2026-07-09T16-32-v0.4",
     "to_baseline": "2026-08-01T10-00-v0.4",
     "steps": [
       { "type": "auto_diff" },
       { "type": "clear_column", "schema": "s", "table": "t", "field": "f" },
       { "type": "sql_transform", "dialect": "mysql", "sql": "UPDATE ..." },
       { "type": "custom_sql", "dialect": "postgresql", "sql": "..." }
     ]
   }
   ```

## diff 策略（设计）

- **结构对比**：对两个基线的 `table.json` 逐表逐字段对比。
- **匹配规则（field_id 落地前）**：按 `field_name` 匹配。同名 = 可能变更（类型/长度/注释/默认值）；仅一侧存在 = 新增/删除。
  - rename 限制：无 field_id 时，rename 只能以「删除旧 + 新增新」呈现（用户可在迁移步骤手动替换为 `ALTER TABLE ... RENAME COLUMN`）。field_id 落地后，按 id 匹配即可自动识别 rename。
- **输出**：生成 MySQL / PostgreSQL 两套变更 DDL，包含字段增删改、rename（field_id 后）、索引变更、initial-data 的 `clear_column` / `sql_transform` / `custom_sql` 步骤。

## 用户自定义迁移

- 用户在界面维护 `migrations/<id>.json` 的步骤列表（顺序执行）。
- `auto_diff` 步骤由系统基于两基线自动生成，用户可在其后追加/调整步骤。

## 待决问题（field_id 前）

- baseline 用单大 json 还是与 `schemas` 一致的分散结构？倾向**分散结构**（与 current 一致），便于未来对 current 与各 baseline 做结构升级（version-upgrader 统一处理）。
- rename 跟踪：依赖 field_id，本次不实现自动 rename。

## 验收标准（仅设计评审，非代码）

- 文档评审通过，目录布局/数据模型/diff 策略与用户预期一致。
- 明确标注「实现待 field_id 引入后」。
- 不影响当前 `pnpm build`（纯文档，无代码改动）。

## 后续落地拆分（field_id 后，仅占位）

1. `feat: 基线快照创建/列表（current → baselines/ 深拷贝）`
2. `feat: 基于名称的初级 diff 生成（rename 走删+加）`
3. `feat: 迁移脚本 steps 编辑与执行`
4. `feat: field_id 引入后升级 diff 为 id 匹配（自动 rename）`
