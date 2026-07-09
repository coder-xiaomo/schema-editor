# Schema Editor 重构总纲

> 本文档描述项目重构的**全局目标与验收标准**。具体的原子改动步骤不在此列出，请见各步骤文档（见下方「文档索引」）。
> 重构采用**渐进式、逐步替换、始终保持可运行**的策略。

## 背景

项目随业务演进，暴露出若干可维护性痛点。整体重构分多批推进，本目录（`docs/refactor/`）用于沉淀每批的重构方案与验收标准，便于团队追溯与并行推进其他功能开发。

公共基础知识（分支策略、原子提交规范、代码风格、现有架构、方言解析约定、版本升级机制）统一见 [`00-background.md`](./00-background.md)。

## 全局目标

1. **降低模块耦合**：把散落的逻辑收敛到统一位置（如方言解析、版本升级），减少「改一处牵动全身」。
2. **消除噪声**：清理全局样式耦合、消除 `@ts-expect-error` 散落、规范化调试日志、更新脱节文档。
3. **为后续核心重构铺路**：在不改变数据目录结构的前提下，先完成影响面小的改动，使后续「多基线 / 每表独立 JSON / initial-data 行内结构 / undo-redo / 全量保存优化」等核心重构更易落地。

## 全局验收标准

- 每次原子改动提交后，`pnpm dev` 与 `pnpm build` 均可正常编译运行，无 TypeScript 报错。
- 每次提交均为**最小化原子改动**，提交信息符合团队规范（`fix:` / `feat:` 前缀），不出现 `step1/step2` 式描述。
- 界面功能与重构前**行为一致**（除非该步骤明确包含 UI 美化目标）。
- 原有代码风格保持一致：`.map/.filter` 换行、注释、逻辑语义之间留空行的习惯不变。
- 所有重构在本地分支 `refactor/modularize-stores` 上进行，不直接影响 `main`。

## 不在当前范围（仅记录，后续批次实现）

以下为核心重构内容，文档将在方向确认后补充，**不在第一批**：

- 多基线目录结构（`current/` + `baselines/` + `migrations/`），其中 baseline 采用与 `schemas` 一致的分散 JSON 结构。
- 每表独立 JSON（`schemas/<schema>/<table>/table.json` + `initial-data.json`）。
- `initial-data` 行内结构（将 `field_comments` / `skip_rows` 内联到每行 `data` 中）。
- 底层 undo/redo 设计与实现。
- 按需写文件 + SQL 部分更新（替代当前的全量保存）。
- `field_id` 引入与 rename 跟踪（当前暂不引入）。
- `struct_version` 升至 `'2.0'`（核心重构时再升）。
- 自动生成数据库变更 DDL 的 diff 引擎（基于基线对比）。

## 文档索引

| 文档 | 范围 | 状态 |
|------|------|------|
| [`00-background.md`](./00-background.md) | 公共基础：分支策略 / 提交规范 / 代码风格 / 现有架构 / 方言约定 / 版本升级 | 已产出 |
| [`04-docs-cleanup.md`](./04-docs-cleanup.md) | 过时文档清理 + DEVELOPMENT/README 更新 | 已产出 |
| [`05-console-normalize.md`](./05-console-normalize.md) | `console.log` 规范化原则 | 已产出 |
