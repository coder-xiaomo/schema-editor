# 03 · version-upgrader 消除 @ts-expect-error

> 关联背景：[`00-background.md` §5 版本升级机制](./00-background.md)

## 目标

保留 `version-upgrader.ts` 中 0.3→0.4 运行时升级逻辑（含 `pgsql` 旧字段读取兼容），但将散落的 `@ts-expect-error` 收敛到单一辅助函数 `readLegacyField()` 内部。逻辑与历史兼容性**完全不变**，仅消除 `@ts-expect-error` 噪声，使代码更健康、升级步骤可读。

## 现状

- `@ts-expect-error` 仅出现在 `src/utils/version-upgrader.ts`（约 30 处）。
- 成因：0.3→0.4 升级时字段 `pgsql` 重命名为 `postgresql`。运行时升级器需读取旧字段 `pgsql`，但新类型已无该字段，TS 报错，故用 `@ts-expect-error` 抑制。
- 这些 `@ts-expect-error` 分散在 schema / table / field / index / indexColumn / commonConfig / default_config / common_used_fields / unified_types 的升级步骤中。

## 方案

### 1. 新增辅助函数（可放在 `version-upgrader.ts` 内或 `src/utils/legacy-field.ts`）

```ts
// 读取旧字段名（历史兼容）。内部一次 as 断言，对外返回 any，
// 把分散的 @ts-expect-error 收敛到这一处。
export function readLegacyField<T = any>(
  obj: Record<string, any>,
  legacyKey: string,
  fallback?: T
): T {
  const v = (obj as Record<string, any>)[legacyKey]
  return (v === undefined ? fallback : v) as T
}
```

### 2. 替换散落 `@ts-expect-error`

将形如：

```ts
// @ts-expect-error pgsql 旧字段兼容
const x = obj.pgsql?.attr
```

改为：

```ts
const x = readLegacyField(obj, 'pgsql')?.attr
```

逐段替换，每替换一个升级步骤块即确保类型检查通过。

### 3. 原子提交

- `feat: 新增 readLegacyField 兼容读取辅助函数`
- `refactor: version-upgrader 各升级步骤收敛 @ts-expect-error 至 readLegacyField`

> 若单次替换过大，可再按升级步骤细分提交（如 schema 块、table 块、field 块各一次）。

## 约束

- **不改变运行时行为**：旧数据 `pgsql` 字段读取、升级结果、最终 `struct_version` 全部与重构前一致。
- 不引入 `field_id`（见总纲「不在当前范围」），旧字段访问仍按字段名。
- 不改动 `CURRENT_STRUCT_VERSION`（保持 `'0.4'`）。

## 验收标准

- `pnpm build` 无 `@ts-expect-error` 残留（全项目搜索 `@ts-expect-error` 结果为 0，或仅剩明确必要的个别例外并附说明）。
- 用一份 0.3 版本结构数据打开项目，升级流程与结果同重构前（自动升级到 0.4，字段正确迁移）。
- 类型检查通过，无新增 `any` 泄漏到业务代码（仅 `readLegacyField` 内部与返回值）。
