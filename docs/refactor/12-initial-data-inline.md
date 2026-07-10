# 12 · initial-data 行内结构 + 升级器兼容

> 目标：将 `InitialData` 的「四个平行数组」结构（`rows` / `row_comments` / `field_comments` / `skip_rows`）重构为行内对象数组，消除索引对齐脆弱性，并为后续「页面导入 JSON」（单列后续文档）与基线 diff 铺路。

## 现状问题

`src/types/schema.ts` 当前定义：

```ts
export interface InitialData {
  rows?: Record<string, any>[]
  row_comments?: (string | null)[]
  field_comments?: (Record<string, string> | null)[]
  skip_rows?: (boolean | null)[]
  pre_sql?: SqlStatements
  post_sql?: SqlStatements
}
```

- 四个数组靠**相同索引**对齐，脆弱且难维护（插入/删除行需同步维护多个数组）。
- `file-helpers.ts` 的 `normalizeInitialData` 与 `writeInitialDataToHandle` 大量处理「仅含非空数组才导出」的边界。

## 目标态结构

```ts
export interface InitialDataRow {
  data: Record<string, any>
  field_comments?: Record<string, string>   // 仅该项有注释时存在
  is_skip?: boolean                          // 仅跳过时存在（语义同原 skip_rows[i]===true）
  row_comment?: string                       // 可选，行级注释
}

export interface InitialData {
  rows: InitialDataRow[]                      // 必有，空表为 []
  pre_sql?: SqlStatements
  post_sql?: SqlStatements
}
```

- 行与注释/跳过标记**内聚**在单个对象，根除索引对齐问题。
- 向后兼容：旧格式（平行数组）由升级器一次性转为行内结构。

## 升级器变更

- `version-upgrader.ts`：新增 `0.4 → 1.0` 升级步骤，将旧 `rows/row_comments/field_comments/skip_rows` 合并为 `InitialDataRow[]`。
- `CURRENT_STRUCT_VERSION` 从 `'0.4'` 升至 `'1.0'`。
- 旧字段访问（若有残留）继续使用 `readLegacyField`（见背景第 6 节），不新增 `@ts-expect-error`。

## 读写适配

- `file-helpers.ts`：`normalizeInitialData` 同时接受新旧格式并返回行内结构；`writeInitialDataToHandle` 改为只写 `rows`（省略全 null/全空的字段，保持磁盘文件精简）。
- `editor.ts` / `InitialDataEditor.vue`：内存操作从「操作多个平行数组」改为「操作 `rows` 对象数组」（增删行、改注释、切 skip 直接改对象属性）。
- SQL 生成器（`generateInitialDataAllMySQL/PostgreSQL`）：从行内结构读取 `data` / `field_comments` / `is_skip`，行为不变。

## 验收标准

- 打开旧项目（平行数组格式）能自动升级为行内结构并正常编辑、保存、生成 INSERT。
- 新建/编辑初始数据的界面行为与原先一致（注释、跳过、行注释均可用）。
- `generateInitialDataAll*` 生成的 INSERT 语句与重构前字节级一致（含 pre/post_sql）。
- `file-helpers.ts` 不再有针对「平行数组对齐」的特殊分支（除升级器内一次性转换）。
- `pnpm build` 通过。

## 原子提交拆分建议

1. `feat: types 新增 InitialDataRow，保留旧 InitialData 兼容`
2. `feat: version-upgrader 增加 0.4→1.0 行内结构合并，struct_version→1.0`
3. `refactor: file-helpers 读写改为行内结构`
4. `refactor: InitialDataEditor.vue 操作改为行内对象数组`
5. `refactor: sql-generator 读取行内结构（行为不变）`
