# 04 · 文档清理与更新

> 关联背景：[`00-background.md` §6 文档约定](./00-background.md)

## 目标

清理与代码明显脱节的过时文档，更新对未来维护仍有帮助的文档（DEVELOPMENT.md / README.md），使文档反映当前项目结构（含 `schemas/`、`initial-data/` 现状），并标注重构正在进行中。

## 现状

- `.qoder/specs/index-columns-editor-v2_task-4b9.md` —— 描述索引列编辑器 + 结构版本系统，功能已实现，属于历史 spec，与代码现状高度重合，维护价值低。
- `.qoder/specs/SQL建表语句导入功能_task-6ca.md` —— SQL 导入功能已实现，同上。
- `.qoder/plans/` —— 历史计划文档。
- `DEVELOPMENT.md` —— 描述的目录结构（如 `common.json` + `schema/*.json`）已与代码实际（`schemas/`、`initial-data/`）部分脱节。
- `README.md` —— 顶层说明，目录/结构描述可能滞后。

## 方案

### 1. `.qoder` 文档处置

- 评估 `specs/` 与 `plans/` 下文档：若内容已从代码一眼看出（功能已实现且描述与代码一致），**归档或删除**，避免误导。
- 建议：删除已实现功能的 spec（上述两个 task spec），或在 `.qoder/` 下新增 `ARCHIVED/` 目录迁移存放（保留历史但不干扰）。**具体采用删除还是归档由实现时确认，优先删除以减小噪声。**

### 2. 更新 DEVELOPMENT.md

- 校正「目录结构」章节，反映当前真实的 `src/` 布局（stores / utils / components / composables / i18n / assets/style）。
- 若文档描述工作目录（用户数据目录）结构，对齐代码实际：`common.json`、`schemas/`、`initial-data/`（非旧文档中的 `schema/*.json`）。
- 在文档顶部或重构章节标注：「项目正在进行渐进式重构，详见 `docs/refactor/`」。

### 3. 更新 README.md

- 校正项目结构与快速开始命令。
- 可选：在 README 增加「重构说明」链接到 `docs/refactor/README.md`。

### 4. 原子提交

- `docs: 归档/删除已过时的 .qoder spec 文档`
- `docs: 更新 DEVELOPMENT.md 目录结构描述并标注重构进行中`
- `docs: 更新 README.md 项目结构与重构链接`

## 验收标准

- `.qoder/specs/` 下不再有过时且与代码重合的历史 spec（或已迁移至归档区）。
- `DEVELOPMENT.md` 描述的 `src/` 与工作目录结构与代码实际一致。
- `DEVELOPMENT.md` / `README.md` 提及重构并指向 `docs/refactor/README.md`。
- 不改动任何 `.ts` / `.vue` 业务逻辑；仅文档变更，构建不受影响。
