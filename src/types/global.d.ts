// global.d.ts
interface Window {
  // MDN docs: https://developer.mozilla.org/zh-CN/docs/Web/API/Window/showDirectoryPicker
  showDirectoryPicker(options?: {
    id?: string
    mode?: 'read' | 'readwrite'
    startIn?: FileSystemHandle
  }): Promise<FileSystemDirectoryHandle>
}
