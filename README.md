# schema-editor - 数据库 Schema JSON 可视化编辑器

[GitHub](https://github.com/coder-xiaomo/schema-editor) [Preview](https://coder-xiaomo.github.io/schema-editor/)

通过可视化界面编辑数据库 Schema 的 JSON 配置文件，内置 SQL 预览，支持编辑后导出 JSON 或直接生成对应方言的 SQL 建表语句。

## 技术栈

- **Vue 3** + **TypeScript** + **Vite**
- **Pinia** 状态管理
- **File System Access API** — 打开本地文件夹，编辑内容实时同步保存
- 纯前端运行，无需后端服务

## 功能特性

- **Open Folder**：通过 File System Access API 打开包含 `common.json` 和 schema JSON 文件的文件夹，编辑内容自动实时保存到本地文件
- **Reload from Disk**：右上角「从磁盘重新加载」按钮，可放弃内存中的修改，重新读取本地文件
- 左侧树形导航（Schema > Table），Schema 支持 **折叠/展开** 和 **拖拽排序**，表支持 **跨 Schema 拖拽移动**
- 表级编辑：表名、注释、`comment_before_table`、MySQL 表级配置（engine/charset/collation）
- 字段管理（FieldTable）：表格展示字段属性，支持增删改查、`is_commented_out` 标记、`comment_before_fields` 编辑、MySQL/PostgreSQL 方言覆盖、拖拽排序
- 索引管理（IndexTable）：索引定义及 MySQL/PostgreSQL 覆盖配置、`pre_comment` 编辑
- 初始数据编辑（InitialDataEditor）：支持表格模式和 JSON 模式编辑表的初始数据，支持行注释和字段注释，编辑后自动保存 `__initial_data__.sql` 到本地
- SQL 预览（SqlPreview）：实时预览当前表的 MySQL / PostgreSQL 建表语句及初始数据 INSERT 语句
- 公共字段引用（CommonConfigPanel）：`common_used_fields` 的查看、编辑与排序
- Common 配置编辑：`default_config` 的查看与编辑
- 删除 Schema 时自动清理 output 目录中对应的 SQL 文件

## 快速开始

```sh
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build
```

## 项目结构

```
src/
├── App.vue                    # 根组件，布局框架
├── main.ts                    # 入口文件
├── assets/                    # 静态资源
├── components/
│   ├── EditorToolbar.vue      # 顶部工具栏（Open Folder / Reload from Disk）
│   ├── EditorSidebar.vue      # 左侧 Schema > Table 树形导航（折叠/展开/拖拽排序）
│   ├── CommonConfigPanel.vue  # Common 配置编辑面板
│   ├── TableEditor.vue        # 表编辑面板（基本信息 + 字段 + 索引 + SQL 预览 + 初始数据）
│   ├── FieldTable.vue         # 字段列表编辑
│   ├── IndexTable.vue         # 索引列表编辑
│   ├── AddFieldModal.vue      # 添加字段弹窗
│   ├── SqlPreview.vue         # SQL 建表语句实时预览
│   └── InitialDataEditor.vue  # 初始数据编辑器（表格/JSON 模式）
├── stores/
│   └── editor.ts              # Pinia 编辑器状态管理
├── types/
│   └── schema.ts              # Schema 类型定义
└── utils/
    ├── file-helpers.ts        # 文件导入/导出工具函数
    └── sql-generator.ts       # SQL 生成器（MySQL/PostgreSQL）
```

## 使用说明

1. **打开文件夹**：点击顶部工具栏的「Open Folder」按钮，选择包含 `common.json` 和 schema JSON 文件（如 `account.json`、`memo.json`）的文件夹，编辑内容会自动实时保存到本地文件
2. **导航**：在左侧树形导航中展开 Schema（点击箭头折叠/展开），点击表名切换编辑目标；点击 Schema 名称可编辑 Common 配置。Schema 和表支持拖拽排序
3. **编辑**：在右侧面板中编辑表属性、字段和索引，支持 MySQL/PostgreSQL 方言覆盖；可在 SQL 预览面板中实时查看生成的建表语句
4. **初始数据**：展开「Initial Data」面板，以表格或 JSON 模式编辑表的初始数据，支持添加行注释和字段注释，编辑后自动保存 `__initial_data__.sql`
5. **从磁盘重新加载**：如果直接在本地编辑了文件，可点击右上角「Reload from Disk」按钮，放弃网页中的修改并重新读取本地文件
