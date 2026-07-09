# 02 · 统一方言解析辅助函数

> 关联背景：[`00-background.md` §4 方言解析约定](./00-background.md)

## 目标

引入统一方言解析辅助层，把所有形如 `obj.mysql?.attr ?? obj.attr ?? 'default'` 的散落读取收敛到一处，降低漏写方言覆盖导致的 bug 概率，并为后续核心重构（多基线 / 每表 JSON）铺路。

## 现状（探明）

散落读取约 66 处，分布在：

- `src/utils/sql-generator/shared.ts`（4）
- `src/utils/sql-generator/postgresql.ts`（9）
- `src/utils/sql-generator/mysql.ts`（10）
- `src/utils/index-column-utils.ts`（4）
- `src/types/schema.ts`（1）
- `src/components/IndexColumnsEditor.vue`（2）
- `src/stores/editor.ts`（24）
- `src/components/CommonConfigPanel.vue`（12）

模式统一为：优先读 `obj.<dialect>?.key`，回退读 `obj.key`，再回退默认值。

## 方案

### 1. 新增辅助模块 `src/utils/dialect-resolver.ts`

提供两类 API（具体命名在实现时确定，保持与现有风格一致）：

```ts
// 读取带方言覆盖的属性：dialect 覆盖优先，否则回退顶层，最后 fallback
function resolveDialectOverride<T>(
  obj: Record<string, any>,
  dialect: 'mysql' | 'postgresql',
  key: string,
  fallback?: T
): T

// 或提供只读访问器：统一返回「最终生效值」
function readDialect<T>(
  obj: Record<string, any>,
  dialect: 'mysql' | 'postgresql',
  key: string,
  fallback?: T
): T
```

实现内部就是 `obj[dialect]?.[key] ?? obj[key] ?? fallback`，逻辑与现状完全一致。

### 2. 分批替换（原子提交）

按文件分批，每替换一个文件的散落读取即提交一次：

1. `feat: 新增 dialect-resolver 辅助函数`
2. `refactor: editor store 方言读取收敛至 dialect-resolver`
3. `refactor: sql-generator 方言读取收敛至 dialect-resolver`
4. `refactor: index-column-utils 方言读取收敛至 dialect-resolver`
5. `refactor: CommonConfigPanel/IndexColumnsEditor 方言读取收敛至 dialect-resolver`
6. `refactor: types/schema 方言读取收敛至 dialect-resolver`

> 每批替换后必须类型检查通过。若某处逻辑与默认模式略有差异（如多重 fallback 顺序），保持行为不变，仅收敛写法。

### 3. 约束

- 新增代码**必须**使用辅助函数，禁止再出现 `obj.mysql?.x ?? obj.x` 式散落读取（后续 Code Review 检查）。
- 不影响 SQL 生成结果与界面行为。

## 验收标准

- `pnpm build` 无 TypeScript 报错。
- 全项目搜索 `\.mysql\?\.|\.postgresql\?\.` 仅剩辅助函数内部实现，业务代码无散落读取。
- SQL 预览、CommonConfig 各方言覆盖项、索引列方言覆盖的表现与重构前**完全一致**。
- 辅助函数覆盖所有原有 fallback 顺序语义（pgsql 历史字段见 [`03-version-upgrader-cleanup.md`](./03-version-upgrader-cleanup.md) 不在此重复处理，若涉及旧字段读取仍走 `readLegacyField`）。
