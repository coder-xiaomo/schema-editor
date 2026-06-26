// global.d.ts
interface Window {
  // MDN docs: https://developer.mozilla.org/zh-CN/docs/Web/API/Window/showDirectoryPicker
  showDirectoryPicker(options?: {
    id?: string
    mode?: 'read' | 'readwrite'
    startIn?: FileSystemHandle
  }): Promise<FileSystemDirectoryHandle>
}

// FileSystemObserver - experimental File System API
// @see https://developer.mozilla.org/en-US/docs/Web/API/FileSystemObserver
declare class FileSystemObserver {
  constructor(callback: (records: FileSystemObserverRecord[], observer: FileSystemObserver) => void)
  observe(handle: FileSystemHandle, options?: { recursive?: boolean }): Promise<void>
  disconnect(): void
}

interface FileSystemObserverRecord {
  readonly changedHandle: FileSystemFileHandle | FileSystemDirectoryHandle
  readonly type: 'appeared' | 'disappeared' | 'modified' | 'moved'
  readonly relativePathComponents: readonly string[]
  readonly relativePathMovedFrom?: readonly string[]
}
