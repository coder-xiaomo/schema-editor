# 01 · 样式 Scoped 化

> 关联背景：[`00-background.md` §3 现有架构](./00-background.md)

## 目标

将 `src/assets/style/` 下 14 个按功能拆分的全局 `.css`，按归属组件拆分到对应 `.vue` 文件的 `<style scoped>` 内 `@import`。取消全局引入入口（`main.ts` 不再引入 `index.css`，`index.css` 可删除或保留为空壳但不再被引用）。

**本轮不包含 UI 美化**（参考 GitHub 优秀 UI 的重设计留到后续批次）。

## 现状

- `src/main.ts` 第 6 行：`import './assets/style/index.css'`
- `src/assets/style/index.css` 汇总 `@import` 14 个文件：`base, layout, toast, badge, btn, comment, expand, form, help, modal, move-btn, section, table`。
- 这些样式目前作用于全局（非 scoped），存在样式泄漏与跨组件耦合风险。

## 方案

1. **盘点归属**：逐个 `.css` 分析其 class 主要被哪些组件使用，确定归属。
   - 例如 `btn.css` → 各含按钮的组件；`modal.css` → `Modal.vue` 系；`table.css` → 表格相关组件；`form.css` → 表单类组件；`layout.css` / `base.css` → `App.vue` 或全局基础层。
2. **拆分到组件**：在每个归属组件的 `<style scoped>` 中 `@import` 对应 `.css`：
   ```vue
   <style scoped>
   @import '../assets/style/btn.css';
   </style>
   ```
3. **多归属处理**：若一个 `.css` 被多个组件共用，在**每个**使用它的组件的 `<style scoped>` 内 `@import`（scoped 下 `@import` 仍受 scoped 限制，仅作用于该组件模板；若有真正全局的基础样式如 `base.css` / `layout.css`，可保留在 `App.vue` 的 `<style>`（非 scoped）或 `App.vue` 的 `<style scoped>` 仅包裹根节点）。
4. **移除全局入口**：
   - 删除 `main.ts` 中的 `import './assets/style/index.css'`。
   - 删除 `src/assets/style/index.css`（其汇总职责已不存在）。
5. **保留粒度**：不合并 `.css` 文件，保持现有 14 个文件的拆分粒度，仅改变引入方式。

## 原子提交拆分建议

- 提交 1：`feat: 将 X/Y/Z 组件样式迁移至 scoped @import`（按组件或按 css 文件分批，每批一个提交）
- 最后提交：`fix: 移除全局样式入口 index.css 及 main.ts 引用`

> 提示：函数/文件移动遵循「先完整移动 + 调整 import 提交一次，再重构提交一次」的原则（见 [`00-background.md` §1](./00-background.md)），但本步骤主要是 `@import` 位置调整，通常可随组件一次完成。

## 验收标准

- `pnpm dev` / `pnpm build` 正常编译运行。
- 页面视觉与重构前**一致**（无样式丢失、无布局错位）。
- `main.ts` 不再引入 `index.css`；`src/assets/style/index.css` 已删除。
- 各组件 `<style scoped>` 正确 `@import` 其归属样式，无全局泄漏导致的意外样式变化。
- 控制台无 `Failed to resolve @import` 类资源加载错误。
