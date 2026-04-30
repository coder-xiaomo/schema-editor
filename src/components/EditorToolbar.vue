<script setup lang="ts">
import { ref } from 'vue'
import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()

// Hidden file input refs
const commonFileInput = ref<HTMLInputElement | null>(null)
const schemaFileInput = ref<HTMLInputElement | null>(null)

// Trigger hidden file inputs
function triggerImportCommon() {
  if (commonFileInput.value) {
    commonFileInput.value.value = ''
    commonFileInput.value.click()
  }
}

function triggerImportSchemas() {
  if (schemaFileInput.value) {
    schemaFileInput.value.value = ''
    schemaFileInput.value.click()
  }
}
</script>

<template>
  <!-- ===== Top Toolbar ===== -->
  <div class="toolbar">
    <span class="title">Schema Editor</span>
    <button class="btn btn-primary" @click="triggerImportCommon">Import common.json</button>
    <input
      ref="commonFileInput"
      type="file"
      accept=".json"
      style="display: none"
      @change="store.handleCommonFile"
    />
    <button class="btn btn-primary" @click="triggerImportSchemas">Import Schema JSON</button>
    <input
      ref="schemaFileInput"
      type="file"
      accept=".json"
      multiple
      style="display: none"
      @change="store.handleSchemaFiles"
    />
    <div class="toolbar-separator"></div>
    <button class="btn" @click="store.exportCurrentSchema" :disabled="!store.currentSchema">Export Current Schema</button>
    <button class="btn" @click="store.exportAll" :disabled="store.schemas.length === 0">Export All</button>
  </div>
</template>

<style scoped>
/* ===== Top Toolbar ===== */
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #fff;
  border-bottom: 1px solid #ddd;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.toolbar .title {
  font-size: 15px;
  font-weight: 600;
  color: #4a90d9;
  margin-right: 16px;
  white-space: nowrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  color: #333;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all .15s;
}

.btn:hover {
  background: #e8e8e8;
  border-color: #aaa;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #4a90d9;
  color: #fff;
  border-color: #4a90d9;
}

.btn-primary:hover {
  background: #3a7bc8;
  border-color: #3a7bc8;
}

.toolbar-separator {
  width: 1px;
  height: 20px;
  background: #ddd;
  margin: 0 4px;
}
</style>
