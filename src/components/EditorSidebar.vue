<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()
</script>

<template>
  <!-- ===== Left Sidebar ===== -->
  <div class="sidebar">
    <div class="sidebar-header">
      <span>Navigation</span>
    </div>
    <div class="sidebar-tree">
      <!-- Common Config Entry -->
      <div
        v-if="store.commonConfig"
        class="sidebar-item common-item"
        :class="{ active: store.showCommonPanel }"
        @click="store.selectCommonConfig()"
      >
        <span class="sidebar-icon">&#9881;</span>
        Common Config
      </div>

      <!-- Schema Groups -->
      <template v-for="(schema, sIdx) in store.schemas" :key="schema.schema">
        <div class="sidebar-item schema-item">
          <span class="sidebar-icon">&#9654;</span>
          <span class="schema-label">{{ schema.schema }}</span>
          <span style="margin-left:auto; font-size:10px; color:#aaa;">{{ schema.tables.length }}</span>
          <span class="delete-btn" @click.stop="store.addTable(sIdx)" title="Add table">+</span>
        </div>
        <div
          v-for="(table, tIdx) in schema.tables"
          :key="table.name + tIdx"
          class="sidebar-item table-item"
          :class="{ active: store.selectedSchemaIdx === sIdx && store.selectedTableIdx === tIdx && !store.showCommonPanel }"
          @click="store.selectTable(sIdx, tIdx)"
        >
          <span class="sidebar-icon">&#9679;</span>
          <span class="table-name">{{ table.name }}</span>
          <span v-if="table.comment" class="table-comment" :title="table.comment">{{ table.comment }}</span>
          <span class="delete-btn" @click.stop="store.deleteTable(sIdx, tIdx)" title="Delete table">&times;</span>
        </div>
      </template>

      <!-- Empty State -->
      <div v-if="!store.projectOpened && store.schemas.length === 0 && !store.commonConfig" class="empty-hint">
        Click "Open Folder" to start
      </div>
    </div>

    <!-- Sidebar Footer -->
    <div v-if="!store.projectOpened" class="sidebar-footer">
      <button class="btn-footer btn-footer-primary" @click="store.openProject()">
        <!-- &#128193; Open -->
        &#128193;&#xFE0E; Open
      </button>
    </div>
  </div>
</template>

<style scoped>
/* ===== Left Sidebar ===== */
.sidebar {
  width: 250px;
  min-width: 250px;
  background: #fff;
  border-right: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 10px 12px;
  font-weight: 600;
  font-size: 12px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-tree {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.sidebar-item {
  padding: 6px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #555;
  transition: background .1s;
  user-select: none;
}

.sidebar-item:hover {
  background: #f0f0f0;
}

.sidebar-item.active {
  background: #e3edf7;
  color: #4a90d9;
  font-weight: 500;
}

.sidebar-item.schema-item {
  font-weight: 600;
  color: #333;
  padding-left: 8px;
  font-size: 13px;
  cursor: default;
}

.sidebar-item.schema-item:hover {
  background: transparent;
}

.sidebar-item.table-item {
  padding-left: 24px;
}

.table-name {
  flex-shrink: 0;
}

.table-comment {
  color: #999;
  font-size: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.sidebar-item.common-item {
  color: #4a90d9;
  font-weight: 500;
}

.sidebar-icon {
  font-size: 11px;
  opacity: 0.6;
  flex-shrink: 0;
}

.sidebar-item .delete-btn {
  margin-left: auto;
  opacity: 0;
  color: #d9534f;
  cursor: pointer;
  font-size: 11px;
}

.sidebar-item:hover .delete-btn {
  opacity: 0.6;
}

.sidebar-item .delete-btn:hover {
  opacity: 1;
}

.schema-label {
  display: inline-block;
  padding: 2px 8px;
  background: #e8f0fe;
  color: #4a90d9;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 500;
}

.empty-hint {
  padding: 20px;
  text-align: center;
  color: #aaa;
  font-size: 12px;
}

/* ===== Sidebar Footer ===== */
.sidebar-footer {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border-top: 1px solid #eee;
  background: #fafafa;
  flex-shrink: 0;
}

.btn-footer {
  padding: 4px 10px;
  border: 1px solid #ddd;
  border-radius: 3px;
  background: #fff;
  color: #555;
  font-size: 11px;
  cursor: pointer;
  white-space: nowrap;
  transition: all .15s;
}

.btn-footer:hover {
  background: #e8e8e8;
  border-color: #aaa;
}

.btn-footer-primary {
  background: #4a90d9;
  color: #fff;
  border-color: #4a90d9;
  font-weight: 500;
}

.btn-footer-primary:hover {
  background: #3a7bc8;
  border-color: #3a7bc8;
}

/* ===== Scrollbar ===== */
.sidebar-tree::-webkit-scrollbar {
  width: 6px;
}

.sidebar-tree::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-tree::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.sidebar-tree::-webkit-scrollbar-thumb:hover {
  background: #aaa;
}
</style>
