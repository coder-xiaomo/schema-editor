<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEditorStore } from '@/stores/editor'
import {
  generateTableMySQL,
  generateTablePostgreSQL,
  type SqlDialect
} from '@/utils/sql-generator'

const store = useEditorStore()
const dialect = ref<SqlDialect>('mysql')

const previewSql = computed(() => {
  const table = store.currentTable
  if (!table) return ''
  const schema = store.currentSchema

  if (dialect.value === 'mysql') {
    return generateTableMySQL(table, store.commonConfig)
  } else {
    const schemaName = schema?.schema || 'public'
    return generateTablePostgreSQL(table, schemaName, store.commonConfig)
  }
})

function copyToClipboard() {
  navigator.clipboard.writeText(previewSql.value).then(() => {
    store.showToast('SQL copied')
  })
}
</script>

<template>
  <div class="section-card" v-if="store.currentTable">
    <div class="section-header">
      <span>SQL Preview</span>
      <div class="header-actions">
        <select class="dialect-select" v-model="dialect">
          <option value="mysql">MySQL</option>
          <option value="postgresql">PostgreSQL</option>
        </select>
        <button class="btn-copy" @click="copyToClipboard" title="Copy SQL">Copy</button>
      </div>
    </div>
    <div class="section-body">
      <pre class="sql-code"><code>{{ previewSql }}</code></pre>
    </div>
  </div>
</template>

<style scoped>
.section-card {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  margin-bottom: 16px;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #fafafa;
  border-bottom: 1px solid #eee;
  font-weight: 600;
  font-size: 13px;
  color: #444;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dialect-select {
  padding: 3px 8px;
  border: 1px solid #ccc;
  border-radius: 3px;
  font-size: 11px;
  color: #333;
  background: #fff;
  cursor: pointer;
}

.dialect-select:focus {
  outline: none;
  border-color: #4a90d9;
}

.btn-copy {
  padding: 3px 10px;
  border: 1px solid #ccc;
  border-radius: 3px;
  background: #fff;
  color: #555;
  font-size: 11px;
  cursor: pointer;
  transition: all .15s;
}

.btn-copy:hover {
  background: #e8e8e8;
  border-color: #aaa;
}

.section-body {
  padding: 0;
}

.sql-code {
  margin: 0;
  padding: 12px 14px;
  background: #1e1e2e;
  color: #cdd6f4;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre;
  max-height: 500px;
  overflow-y: auto;
}

.sql-code::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.sql-code::-webkit-scrollbar-track {
  background: #1e1e2e;
}

.sql-code::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 3px;
}

.sql-code::-webkit-scrollbar-thumb:hover {
  background: #777;
}
</style>
