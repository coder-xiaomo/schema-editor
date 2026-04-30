<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'
import { displayFieldLength, displayDefault } from '@/utils/file-helpers'

const store = useEditorStore()

// Helper to format db override entries as "key=value" pairs
function formatOverride(override: Record<string, any> | undefined): string {
  if (!override || Object.keys(override).length === 0) return '-'
  return Object.entries(override).map(([k, v]) => `${k}=${v}`).join(', ')
}
</script>

<template>
  <!-- ===== Common Config Panel ===== -->
  <template v-if="store.showCommonPanel && store.commonConfig">
    <!-- Default MySQL Table Config -->
    <div class="section-card">
      <div class="section-header">Default MySQL Table Config</div>
      <div class="section-body">
        <div class="form-row">
          <div class="form-group medium">
            <label class="form-label">Engine</label>
            <input
              class="form-input"
              :value="store.getCommonMysqlEngine()"
              @input="store.setCommonMysqlEngine(($event.target as HTMLInputElement).value)"
            />
          </div>
          <div class="form-group medium">
            <label class="form-label">Charset</label>
            <input
              class="form-input"
              :value="store.getCommonMysqlCharset()"
              @input="store.setCommonMysqlCharset(($event.target as HTMLInputElement).value)"
            />
          </div>
          <div class="form-group medium">
            <label class="form-label">Collation</label>
            <input
              class="form-input"
              :value="store.getCommonMysqlCollation()"
              @input="store.setCommonMysqlCollation(($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Common Used Fields -->
    <div class="section-card">
      <div class="section-header">
        Common Used Fields
        <span class="badge">{{ store.commonFieldNames.length }} fields</span>
      </div>
      <div class="section-body" style="padding: 0;">
        <table class="common-fields-table">
          <thead>
            <tr>
              <th>field_name</th>
              <th>field_type</th>
              <th>length</th>
              <th>not_null</th>
              <th>pk</th>
              <th>default</th>
              <th>comment</th>
              <th>mysql</th>
              <th>pgsql</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="name in store.commonFieldNames" :key="name">
              <td><code>{{ name }}</code></td>
              <td>{{ store.commonConfig!.common_used_fields[name]?.field_type || '-' }}</td>
              <td>{{ displayFieldLength(store.commonConfig!.common_used_fields[name]?.field_length) || '-' }}</td>
              <td>{{ store.commonConfig!.common_used_fields[name]?.not_null ? '&#10003;' : '' }}</td>
              <td>{{ store.commonConfig!.common_used_fields[name]?.primary_key ? '&#10003;' : '' }}</td>
              <td>{{ displayDefault(store.commonConfig!.common_used_fields[name]?.default) }}</td>
              <td>{{ store.commonConfig!.common_used_fields[name]?.comment }}</td>
              <td>{{ formatOverride(store.commonConfig!.common_used_fields[name]?.mysql) }}</td>
              <td>{{ formatOverride(store.commonConfig!.common_used_fields[name]?.pgsql) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </template>
</template>

<style scoped>
/* ===== Section Card ===== */
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

.section-header .badge {
  font-weight: 400;
  font-size: 11px;
  color: #888;
  margin-left: 8px;
}

.section-body {
  padding: 14px;
}

/* ===== Form Row ===== */
.form-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
}

.form-group.medium {
  flex: 0 0 200px;
}

.form-label {
  font-size: 11px;
  color: #888;
  font-weight: 500;
}

.form-input {
  padding: 5px 8px;
  border: 1px solid #ccc;
  border-radius: 3px;
  font-size: 12px;
  font-family: inherit;
  color: #333;
  transition: border-color .15s;
}

.form-input:focus {
  outline: none;
  border-color: #4a90d9;
}

/* ===== Common Fields Table ===== */
.common-fields-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.common-fields-table th {
  background: #f5f5f5;
  padding: 6px 8px;
  text-align: left;
  font-weight: 600;
  color: #666;
  border-bottom: 1px solid #ddd;
  font-size: 11px;
}

.common-fields-table td {
  padding: 4px 8px;
  border-bottom: 1px solid #eee;
}

.common-fields-table code {
  background: #f0f0f0;
  padding: 1px 4px;
  border-radius: 2px;
  font-size: 11px;
}
</style>
