import { ref, reactive, computed } from 'vue'
import { defineStore } from 'pinia'
import type { CommonConfig, Schema, Table, Field, Index } from '@/types/schema'
import { downloadJson, parseFieldLengthInput } from '@/utils/file-helpers'

export const useEditorStore = defineStore('editor', () => {
  // ===== State =====
  const commonConfig = ref<CommonConfig | null>(null)
  const schemas = reactive<Schema[]>([])
  const selectedSchemaIdx = ref(-1)
  const selectedTableIdx = ref(-1)
  const expandedFields = reactive(new Set<string>())
  const expandedIndexes = reactive(new Set<string>())
  const showCommonPanel = ref(false)
  const toastMsg = ref('')
  const toastVisible = ref(false)
  const showAddFieldModal = ref(false)
  const addFieldMode = ref<'normal' | 'common'>('normal') // 'normal' | 'common'
  const addFieldSchemaIdx = ref(-1)
  const addFieldTableIdx = ref(-1)
  const newFieldName = ref('')
  const newFieldSelectCommon = ref('')

  // ===== Computed =====
  const currentSchema = computed(() => {
    if (selectedSchemaIdx.value >= 0 && selectedSchemaIdx.value < schemas.length) {
      return schemas[selectedSchemaIdx.value]
    }
    return null
  })

  const currentTable = computed(() => {
    if (currentSchema.value && selectedTableIdx.value >= 0 && selectedTableIdx.value < currentSchema.value.tables.length) {
      return currentSchema.value.tables[selectedTableIdx.value]
    }
    return null
  })

  const commonFieldNames = computed(() => {
    if (!commonConfig.value) return []
    return Object.keys(commonConfig.value.common_used_fields || {})
  })

  // ===== Toast =====
  let toastTimer: ReturnType<typeof setTimeout> | null = null
  function showToast(msg: string) {
    toastMsg.value = msg
    toastVisible.value = true
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => { toastVisible.value = false }, 2000)
  }

  // ===== File Import =====
  function handleCommonFile(e: Event) {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target!.result as string)
        if (!data.default_config || !data.common_used_fields) {
          showToast('Invalid common.json: missing default_config or common_used_fields')
          return
        }
        commonConfig.value = data
        showToast('common.json imported successfully')
      } catch (err: any) {
        showToast('Failed to parse common.json: ' + err.message)
      }
    }
    reader.readAsText(file)
  }

  function handleSchemaFiles(e: Event) {
    const target = e.target as HTMLInputElement
    const files = Array.from(target.files || [])
    if (files.length === 0) return
    let imported = 0
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target!.result as string)
          if (!data.schema || !Array.isArray(data.tables)) {
            showToast('Invalid schema file: missing schema or tables')
            return
          }
          // Ensure tables have indexes array
          data.tables.forEach((t: any) => {
            if (!t.indexes) t.indexes = []
            if (!t.fields) t.fields = []
          })
          // Check if schema already exists
          const existIdx = schemas.findIndex(s => s.schema === data.schema)
          if (existIdx >= 0) {
            schemas.splice(existIdx, 1, data)
          } else {
            schemas.push(data)
          }
          imported++
          if (imported === files.length) {
            showToast(`Imported ${imported} schema(s)`)
          }
        } catch (err: any) {
          showToast('Failed to parse: ' + err.message)
        }
      }
      reader.readAsText(file)
    })
  }

  // ===== Navigation =====
  function selectTable(schemaIdx: number, tableIdx: number) {
    selectedSchemaIdx.value = schemaIdx
    selectedTableIdx.value = tableIdx
    showCommonPanel.value = false
    // Clear expanded states
    expandedFields.clear()
    expandedIndexes.clear()
  }

  function selectCommonConfig() {
    showCommonPanel.value = true
    selectedSchemaIdx.value = -1
    selectedTableIdx.value = -1
  }

  // ===== Table CRUD =====
  function addTable(schemaIdx: number) {
    const schema = schemas[schemaIdx]
    if (!schema) return
    const newTable: Table = {
      name: 'new_table',
      comment: '',
      fields: [],
      indexes: []
    }
    schema.tables.push(newTable)
    selectTable(schemaIdx, schema.tables.length - 1)
    showToast('Table added')
  }

  function deleteTable(schemaIdx: number, tableIdx: number) {
    const schema = schemas[schemaIdx]
    if (!schema) return
    const tableName = schema.tables[tableIdx]?.name
    if (!confirm(`Delete table "${tableName}"?`)) return
    schema.tables.splice(tableIdx, 1)
    if (selectedSchemaIdx.value === schemaIdx) {
      if (selectedTableIdx.value >= schema.tables.length) {
        selectedTableIdx.value = schema.tables.length - 1
      }
      if (schema.tables.length === 0) {
        selectedTableIdx.value = -1
      }
    }
    showToast('Table deleted')
  }

  // ===== Field Helpers =====
  function isCommonField(field: Field) {
    return field.use_common_used_fields === true
  }

  function getResolvedField(field: Field): Field {
    if (isCommonField(field) && commonConfig.value) {
      return commonConfig.value.common_used_fields[field.field_name] || field
    }
    return field
  }

  function fieldKey(schema: Schema, table: Table, field: Field) {
    return `${schema.schema}-${table.name}-${field.field_name}`
  }

  function indexKey(schema: Schema, table: Table, index: Index, indexIdx: number) {
    return `${schema.schema}-${table.name}-idx-${index.name || indexIdx}`
  }

  function toggleFieldExpand(key: string) {
    if (expandedFields.has(key)) {
      expandedFields.delete(key)
    } else {
      expandedFields.add(key)
    }
  }

  function toggleIndexExpand(key: string) {
    if (expandedIndexes.has(key)) {
      expandedIndexes.delete(key)
    } else {
      expandedIndexes.add(key)
    }
  }

  // ===== Comment Before Table =====
  function commentBeforeTableText(table: Table) {
    const val = table.comment_before_table
    if (!val) return ''
    if (Array.isArray(val)) {
      return val.map(item => item === null ? '' : item).join('\n')
    }
    return val
  }

  function setCommentBeforeTable(table: Table, text: string) {
    const lines = text.split('\n')
    if (lines.length === 1) {
      if (lines[0] === '') {
        delete table.comment_before_table
      } else {
        table.comment_before_table = lines[0]
      }
    } else {
      table.comment_before_table = lines.map(line => line === '' ? null : line)
    }
  }

  // ===== Comment Before Fields =====
  function commentBeforeFieldText(table: Table, fieldName: string) {
    if (!table.comment_before_fields || !table.comment_before_fields[fieldName]) return ''
    const val = table.comment_before_fields[fieldName]
    if (Array.isArray(val)) {
      return val.map(item => item === null ? '' : item).join('\n')
    }
    return val
  }

  function setCommentBeforeField(table: Table, fieldName: string, text: string) {
    if (!text.trim()) {
      if (table.comment_before_fields) {
        delete table.comment_before_fields[fieldName]
        if (Object.keys(table.comment_before_fields).length === 0) {
          delete table.comment_before_fields
        }
      }
      return
    }
    if (!table.comment_before_fields) {
      table.comment_before_fields = {}
    }
    const lines = text.split('\n')
    if (lines.length === 1) {
      table.comment_before_fields[fieldName] = lines[0]!
    } else {
      table.comment_before_fields[fieldName] = lines.map(line => line === '' ? null : line)
    }
  }

  // ===== Field CRUD =====
  function openAddFieldModal(schemaIdx: number, tableIdx: number, mode: 'normal' | 'common') {
    addFieldSchemaIdx.value = schemaIdx
    addFieldTableIdx.value = tableIdx
    addFieldMode.value = mode
    newFieldName.value = ''
    newFieldSelectCommon.value = ''
    showAddFieldModal.value = true
  }

  function confirmAddField() {
    const sIdx = addFieldSchemaIdx.value
    const tIdx = addFieldTableIdx.value
    if (sIdx < 0 || tIdx < 0) return

    const table = schemas[sIdx]?.tables[tIdx]
    if (!table) return

    if (addFieldMode.value === 'common') {
      const name = newFieldSelectCommon.value
      if (!name) { showToast('Please select a common field'); return }
      // Check duplicate
      if (table.fields.some(f => f.field_name === name)) {
        showToast(`Field "${name}" already exists in this table`)
        return
      }
      table.fields.push({
        field_name: name,
        use_common_used_fields: true
      })
    } else {
      const name = newFieldName.value.trim()
      if (!name) { showToast('Please enter field name'); return }
      if (table.fields.some(f => f.field_name === name)) {
        showToast(`Field "${name}" already exists in this table`)
        return
      }
      table.fields.push({
        field_name: name,
        field_type: 'varchar',
        field_length: 255,
        not_null: false,
        primary_key: false,
        comment: ''
      })
    }

    showAddFieldModal.value = false
    showToast('Field added')
  }

  function deleteField(table: Table, fieldIdx: number) {
    const fieldName = table.fields[fieldIdx]?.field_name
    if (!fieldName) return
    if (!confirm(`Delete field "${fieldName}"?`)) return
    table.fields.splice(fieldIdx, 1)
    // Clean up comment_before_fields
    if (table.comment_before_fields && table.comment_before_fields[fieldName]) {
      delete table.comment_before_fields[fieldName]
      if (Object.keys(table.comment_before_fields).length === 0) {
        delete table.comment_before_fields
      }
    }
    showToast('Field deleted')
  }

  function moveFieldUp(table: Table, fieldIdx: number) {
    if (fieldIdx <= 0) return
    const arr = table.fields;
    [arr[fieldIdx - 1], arr[fieldIdx]] = [arr[fieldIdx]!, arr[fieldIdx - 1]!]
  }

  function moveFieldDown(table: Table, fieldIdx: number) {
    if (fieldIdx >= table.fields.length - 1) return
    const arr = table.fields;
    [arr[fieldIdx], arr[fieldIdx + 1]] = [arr[fieldIdx + 1]!, arr[fieldIdx]!]
  }

  // ===== Index CRUD =====
  function addIndex(table: Table) {
    table.indexes.push({
      type: 'index',
      columns: [''],
      using: ''
    })
    showToast('Index added')
  }

  function deleteIndex(table: Table, indexIdx: number) {
    if (!confirm('Delete this index?')) return
    table.indexes.splice(indexIdx, 1)
    showToast('Index deleted')
  }

  function indexColumnsText(index: Index) {
    return (index.columns || []).join(', ')
  }

  function setIndexColumns(index: Index, text: string) {
    index.columns = text.split(',').map(s => s.trim()).filter(s => s)
    if (index.columns.length === 0) {
      index.columns = ['']
    }
  }

  // ===== MySQL table override =====
  function getTableMysqlEngine(table: Table) {
    return table.mysql?.mysql_engine || ''
  }
  function getTableMysqlCharset(table: Table) {
    return table.mysql?.mysql_charset || ''
  }
  function getTableMysqlCollation(table: Table) {
    return table.mysql?.mysql_collation || ''
  }
  function setTableMysqlEngine(table: Table, val: string) {
    if (!table.mysql) table.mysql = {}
    table.mysql.mysql_engine = val || undefined
    cleanMysqlOverride(table)
  }
  function setTableMysqlCharset(table: Table, val: string) {
    if (!table.mysql) table.mysql = {}
    table.mysql.mysql_charset = val || undefined
    cleanMysqlOverride(table)
  }
  function setTableMysqlCollation(table: Table, val: string) {
    if (!table.mysql) table.mysql = {}
    table.mysql.mysql_collation = val || undefined
    cleanMysqlOverride(table)
  }
  function cleanMysqlOverride(table: Table) {
    if (table.mysql && Object.values(table.mysql).every(v => v === undefined || v === '')) {
      delete table.mysql
    }
  }

  // ===== Field mysql/pgsql override helpers =====
  function ensureFieldOverride(field: Field, db: 'mysql' | 'pgsql') {
    if (!field[db]) field[db] = {}
    return field[db]!
  }

  function getFieldOverrideValue(field: Field, db: 'mysql' | 'pgsql', key: string) {
    return (field[db] as any)?.[key] ?? ''
  }

  function setFieldOverrideValue(field: Field, db: 'mysql' | 'pgsql', key: string, val: any) {
    const override = ensureFieldOverride(field, db)
    if (val === '' || val === null || val === undefined) {
      delete override[key as keyof typeof override]
    } else {
      if (key === 'field_length') {
        (override as any)[key] = parseFieldLengthInput(val)
      } else {
        (override as any)[key] = val
      }
    }
    // Clean up empty override object
    if (field[db] && Object.keys(field[db]!).length === 0) {
      delete field[db]
    }
  }

  // ===== Index mysql/pgsql override helpers =====
  function getIndexOverrideValue(index: Index, db: 'mysql' | 'pgsql', key: string) {
    return (index[db] as any)?.[key] ?? ''
  }

  function setIndexOverrideValue(index: Index, db: 'mysql' | 'pgsql', key: string, val: any) {
    if (!index[db]) (index as any)[db] = {}
    if (val === '' || val === null || val === undefined) {
      delete (index[db] as any)[key]
    } else {
      (index[db] as any)[key] = val
    }
    if (index[db] && Object.keys(index[db]!).length === 0) {
      delete index[db]
    }
  }

  // ===== Export =====
  function buildSchemaExportData(schema: Schema) {
    const data = {
      schema: schema.schema,
      tables: schema.tables.map(table => {
        const tableData: any = {
          name: table.name,
          comment: table.comment
        }

        // comment_before_table
        if (table.comment_before_table) {
          tableData.comment_before_table = table.comment_before_table
        }

        // comment_before_fields
        if (table.comment_before_fields && Object.keys(table.comment_before_fields).length > 0) {
          tableData.comment_before_fields = {}
          for (const [k, v] of Object.entries(table.comment_before_fields)) {
            tableData.comment_before_fields[k] = v
          }
        }

        // mysql table config
        if (table.mysql && Object.keys(table.mysql).length > 0) {
          const mysqlData: any = {}
          if (table.mysql.mysql_engine) mysqlData.mysql_engine = table.mysql.mysql_engine
          if (table.mysql.mysql_charset) mysqlData.mysql_charset = table.mysql.mysql_charset
          if (table.mysql.mysql_collation) mysqlData.mysql_collation = table.mysql.mysql_collation
          if (Object.keys(mysqlData).length > 0) tableData.mysql = mysqlData
        }

        // fields
        tableData.fields = table.fields.map(field => {
          const f: any = { field_name: field.field_name }
          if (field.use_common_used_fields) {
            f.use_common_used_fields = true
          } else {
            if (field.field_type !== undefined) f.field_type = field.field_type
            if (field.field_length !== undefined) f.field_length = field.field_length
            if (field.not_null !== undefined) f.not_null = field.not_null
            if (field.primary_key !== undefined) f.primary_key = field.primary_key
            if (field.default !== undefined) f.default = field.default
            if (field.comment !== undefined) f.comment = field.comment
            if (field.is_commented_out) f.is_commented_out = true
            // db overrides
            if (field.mysql && Object.keys(field.mysql).length > 0) f.mysql = { ...field.mysql }
            if (field.pgsql && Object.keys(field.pgsql).length > 0) f.pgsql = { ...field.pgsql }
          }
          return f
        })

        // indexes
        tableData.indexes = table.indexes.map(index => {
          const idx: any = {}
          if (index.name) idx.name = index.name
          if (index.type) idx.type = index.type
          if (index.using) idx.using = index.using
          idx.columns = [...index.columns]
          if (index.pre_comment) idx.pre_comment = index.pre_comment
          if (index.mysql && Object.keys(index.mysql).length > 0) idx.mysql = { ...index.mysql }
          if (index.pgsql && Object.keys(index.pgsql).length > 0) idx.pgsql = { ...index.pgsql }
          return idx
        })

        return tableData
      })
    }
    return data
  }

  function exportCurrentSchema() {
    if (!currentSchema.value) {
      showToast('No schema selected')
      return
    }
    const data = buildSchemaExportData(currentSchema.value)
    downloadJson(data, `${currentSchema.value.schema}.json`)
    showToast('Schema exported')
  }

  function exportAll() {
    schemas.forEach(schema => {
      const data = buildSchemaExportData(schema)
      downloadJson(data, `${schema.schema}.json`)
    })
    if (commonConfig.value) {
      downloadJson(commonConfig.value, 'common.json')
    }
    showToast(`Exported ${schemas.length} schema(s)` + (commonConfig.value ? ' + common.json' : ''))
  }

  // ===== Common Config Editing =====
  function getCommonMysqlEngine() {
    return commonConfig.value?.default_config?.mysql?.table?.mysql_engine || ''
  }
  function getCommonMysqlCharset() {
    return commonConfig.value?.default_config?.mysql?.table?.mysql_charset || ''
  }
  function getCommonMysqlCollation() {
    return commonConfig.value?.default_config?.mysql?.table?.mysql_collation || ''
  }
  function setCommonMysqlEngine(val: string) {
    if (commonConfig.value) commonConfig.value.default_config.mysql.table.mysql_engine = val
  }
  function setCommonMysqlCharset(val: string) {
    if (commonConfig.value) commonConfig.value.default_config.mysql.table.mysql_charset = val
  }
  function setCommonMysqlCollation(val: string) {
    if (commonConfig.value) commonConfig.value.default_config.mysql.table.mysql_collation = val
  }

  return {
    // State
    commonConfig,
    schemas,
    selectedSchemaIdx,
    selectedTableIdx,
    showCommonPanel,
    toastMsg,
    toastVisible,
    showAddFieldModal,
    addFieldMode,
    newFieldName,
    newFieldSelectCommon,

    // Computed
    currentSchema,
    currentTable,
    commonFieldNames,

    // Navigation
    selectTable,
    selectCommonConfig,

    // Table CRUD
    addTable,
    deleteTable,

    // Field Helpers
    isCommonField,
    getResolvedField,
    fieldKey,
    indexKey,
    toggleFieldExpand,
    toggleIndexExpand,
    expandedFields,
    expandedIndexes,

    // Comment editing
    commentBeforeTableText,
    setCommentBeforeTable,
    commentBeforeFieldText,
    setCommentBeforeField,

    // Field CRUD
    openAddFieldModal,
    confirmAddField,
    deleteField,
    moveFieldUp,
    moveFieldDown,

    // Index CRUD
    addIndex,
    deleteIndex,
    indexColumnsText,
    setIndexColumns,

    // Table MySQL
    getTableMysqlEngine,
    getTableMysqlCharset,
    getTableMysqlCollation,
    setTableMysqlEngine,
    setTableMysqlCharset,
    setTableMysqlCollation,

    // Field overrides
    getFieldOverrideValue,
    setFieldOverrideValue,

    // Index overrides
    getIndexOverrideValue,
    setIndexOverrideValue,

    // Export
    buildSchemaExportData,
    exportCurrentSchema,
    exportAll,

    // Import
    handleCommonFile,
    handleSchemaFiles,

    // Common config
    getCommonMysqlEngine,
    getCommonMysqlCharset,
    getCommonMysqlCollation,
    setCommonMysqlEngine,
    setCommonMysqlCharset,
    setCommonMysqlCollation,

    // Toast
    showToast
  }
})
