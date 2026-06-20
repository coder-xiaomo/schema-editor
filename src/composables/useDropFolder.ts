import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEditorStore } from '@/stores/editor'

/**
 * 文件夹拖拽打开 composable
 *
 * 返回 dragOver 响应式状态和四个拖拽事件处理器，
 * 在 App.vue 的根容器上绑定即可启用拖入文件夹直接打开项目的功能。
 */
export function useDropFolder() {
  const store = useEditorStore()
  const { t } = useI18n()

  const dragOver = ref(false)
  let dragOverCounter = 0

  function onDragOver(e: DragEvent) {
    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy'
    }
  }

  function onDragEnter(e: DragEvent) {
    e.preventDefault()
    dragOverCounter++
    // 仅当浏览器支持 getAsFileSystemHandle 时才显示覆盖层
    if (dragOverCounter === 1 && e.dataTransfer?.items.length) {
      const item = e.dataTransfer.items[0]
      if (item && typeof (item as any).getAsFileSystemHandle === 'function') {
        dragOver.value = true
      }
    }
  }

  function onDragLeave(e: DragEvent) {
    e.preventDefault()
    dragOverCounter--
    if (dragOverCounter <= 0) {
      dragOverCounter = 0
      dragOver.value = false
    }
  }

  async function onDrop(e: DragEvent) {
    e.preventDefault()
    dragOver.value = false
    dragOverCounter = 0

    const items = e.dataTransfer?.items
    if (!items?.length) return

    const item = items[0]
    if (!item || typeof (item as any).getAsFileSystemHandle !== 'function') {
      store.showToast(t('toast.dropNotSupported'))
      return
    }

    try {
      const handle = await (item as any).getAsFileSystemHandle() as FileSystemHandle | null
      if (!handle) return

      if (handle.kind !== 'directory') {
        store.showToast(t('toast.dropFolderOnly'))
        return
      }

      // 如果已有项目打开，先关闭再打开新项目
      if (store.projectOpened) {
        store.closeProject()
      }

      await store.openProjectFromHandle(handle as FileSystemDirectoryHandle)
    } catch (err) {
      console.error('[useDropFolder] Failed to open dropped folder:', err)
      store.showToast(t('toast.dropNotSupported'))
    }
  }

  return { dragOver, onDragOver, onDragEnter, onDragLeave, onDrop }
}
