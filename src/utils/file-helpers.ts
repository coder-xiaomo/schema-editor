import { toRaw } from 'vue'

const jsonFileIndent = 4

// ===== File System Access API —— 基于 handle 的文件夹读写 =====

/** 检查浏览器是否支持 File System Access API */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window
}

/**
 * 弹出文件夹选择器，读取项目结构：
 *   - common.json（根目录）
 *   - schema/ 子目录下的所有 .json 文件
 * 返回 { rootHandle, schemaHandle, commonData, schemaFiles[] }
 */
export async function openProjectFolder(): Promise<{
  rootHandle: any
  schemaHandle: any
  commonData: unknown | null
  schemaFiles: { name: string; data: unknown }[]
}> {
  const rootHandle = await (window as any).showDirectoryPicker()
  let commonData: unknown | null = null
  let schemaHandle: any = null
  const schemaFiles: { name: string; data: unknown }[] = []

  // 逐条扫描根目录
  for await (const entry of rootHandle.values()) {
    const handle: any = entry
    const name: string = handle.name
    console.log(`[openProjectFolder] root entry: "${name}" kind=${handle.kind}`)

    if (name === 'common.json' && handle.kind === 'file') {
      try {
        const file = await handle.getFile()
        commonData = JSON.parse(await file.text())
        console.log('[openProjectFolder] common.json loaded')
      } catch (e) { console.warn('[openProjectFolder] common.json parse error:', e) }
    }

    if (name === 'schemas' && handle.kind === 'directory') {
      schemaHandle = handle
      console.log('[openProjectFolder] schemas/ directory found')
    }
  }

  // 读取 schemas/ 子目录
  try {
    const sdHandle = await rootHandle.getDirectoryHandle('schemas')
    schemaHandle = sdHandle
    console.log('[openProjectFolder] iterating schemas/ entries...')
    for await (const entry of sdHandle.values()) {
      const fHandle: any = entry
      const fName: string = fHandle.name
      console.log(`[openProjectFolder]   schemas entry: "${fName}" kind=${fHandle.kind}`)
      if (fName.endsWith('.json') && fHandle.kind === 'file') {
        try {
          const file = await fHandle.getFile()
          schemaFiles.push({ name: fName, data: JSON.parse(await file.text()) })
          console.log(`[openProjectFolder]   -> loaded "${fName}"`)
        } catch (e) { console.warn(`[openProjectFolder]   -> failed "${fName}":`, e) }
      }
    }
    console.log(`[openProjectFolder] schema files found: ${schemaFiles.length}`)
  } catch (e) {
    console.log('[openProjectFolder] no schemas/ directory, creating one')
    schemaHandle = await rootHandle.getDirectoryHandle('schemas', { create: true })
  }

  return { rootHandle, schemaHandle, commonData, schemaFiles }
}

/**
 * 将数据写入 common.json
 */
export async function writeCommonToHandle(rootHandle: any, data: unknown): Promise<void> {
  const handle = await rootHandle.getFileHandle('common.json', { create: true })
  const writable = await handle.createWritable()
  await writable.write(JSON.stringify(toRaw(data), null, jsonFileIndent))
  await writable.close()
}

/**
 * 将 schema 数据写入 schema/<filename>.json
 */
export async function writeSchemaToHandle(schemaHandle: any, filename: string, data: unknown): Promise<void> {
  const handle = await schemaHandle.getFileHandle(filename, { create: true })
  const writable = await handle.createWritable()
  await writable.write(JSON.stringify(toRaw(data), null, jsonFileIndent))
  await writable.close()
}

/**
 * 从 schema/ 目录删除文件
 */
export async function deleteSchemaFromHandle(schemaHandle: any, filename: string): Promise<void> {
  await schemaHandle.removeEntry(filename)
}

/**
 * 将 SQL 文件写入 output/<dialect>/<filename>.sql
 * 目录不存在时自动创建
 */
export async function writeSqlToOutput(
  rootHandle: any,
  dialect: string,
  filename: string,
  content: string
): Promise<void> {
  const outputHandle = await rootHandle.getDirectoryHandle('output', { create: true })
  const dialectHandle = await outputHandle.getDirectoryHandle(dialect, { create: true })
  const fileHandle = await dialectHandle.getFileHandle(filename, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(content)
  await writable.close()
}

// ===== 业务无关的工具函数 =====


/**
 * 解析默认值输入
 */
export function parseDefaultInput(val: string) {
  if (val === '' || val === undefined) return undefined
  // Try to parse as number
  if (/^-?\d+$/.test(val)) return parseInt(val, 10)
  if (/^-?\d+\.\d+$/.test(val)) return parseFloat(val)
  if (val === 'true') return true
  if (val === 'false') return false
  return val
}

/**
 * 格式化显示默认值
 */
export function displayDefault(val: any): string {
  if (val === undefined || val === null) return ''
  return String(val)
}

/**
 * 解析字段长度
 */
export function parseFieldLengthInput(val: string): number | null {
  if (val === '' || val === undefined || val === null) return null
  const str = String(val).trim()
  if (str === '') return null
  if (/^-?\d+$/.test(str)) return parseInt(str, 10)
  return null
}

/**
 * 格式化显示字段长度
 */
export function displayFieldLength(val: any): string {
  if (val === null || val === undefined) return ''
  return String(val)
}

/**
 * 文本转注释数组
 */
export function commentTextToArray(text: string): (string | null)[] {
  return text.split('\n').map(line => line === '' ? null : line)
}

/**
 * 注释数组转文本
 */
export function commentArrayToText(arr: string | (string | null)[]): string {
  if (Array.isArray(arr)) {
    return arr.map(item => item === null ? '' : item).join('\n')
  }
  return arr
}
