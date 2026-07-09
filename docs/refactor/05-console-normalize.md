# 05 · console.log 规范化

> 关联背景：[`00-background.md` §2 代码风格约定](./00-background.md)

## 目标

在不丢失调试价值的前提下，规范化项目中的 `console.*` 使用。保留对排查问题有帮助的日志，**去除明显冗余 / 已失效的调试残留**，统一前缀格式。不引入 `logger` 封装（用户明确：`console.log` 改 `logger.xxx` 除多一道外无其他用处）。

## 现状（探明计数）

- `src/stores/editor.ts`：28 处
- `src/utils/file-helpers.ts`：13 处
- `src/utils/version-upgrader.ts`：3 处
- `src/composables/useDropFolder.ts`：1 处

类型分布：`console.log` / `console.warn` / `console.error` / `console.debug` 混合。

## 方案

### 1. 清理原则（保留 / 删除）

**保留**（对线上排查有价值）：
- 错误分支的 `console.error`（如文件读写失败、解析异常）。
- 关键状态变更的 `console.warn`（如版本过高拦截、方言自动检测fallback）。
- 导入/导出等不可逆操作的入口日志。

**删除 / 降级**：
- 明显临时调试用的「打印一下看看」式 `console.log`（如 `console.log(data)` 无上下文）。
- 已注释代码块旁的残留日志。
- 循环内高频无意义的日志（改为 `console.debug` 或删除）。

### 2. 统一前缀格式

为便于在控制台过滤，建议统一前缀形如：

```ts
console.log('[editor] 打开项目:', folderName)
console.error('[file-helpers] 写入失败:', err)
```

前缀使用模块名（editor / file-helpers / version-upgrader / useDropFolder），不强制但推荐。

### 3. 原子提交

按文件分批，每文件清理后提交一次：
- `refactor: 规范化 editor store 中的 console 日志`
- `refactor: 规范化 file-helpers 中的 console 日志`
- `refactor: 规范化 version-upgrader / useDropFolder 中的 console 日志`

## 约束

- **不引入 logger 封装**：继续使用 `console.*`，仅规范用法与格式。
- 不因为清理日志而删除有价值的上下文信息（如错误对象 `err` 应保留）。
- 不改变任何业务逻辑与界面行为。

## 验收标准

- `pnpm build` 正常编译（移除日志不影响类型）。
- 原 `console.log` 残留中明显的临时调试语句已移除，错误/警告类日志保留并带统一前缀。
- 手动触发一次「打开项目 / 导入 SQL / 保存」流程，控制台输出信息清晰、无无意义刷屏。
- 未引入任何 `logger` 模块或封装。
