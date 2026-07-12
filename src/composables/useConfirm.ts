import { reactive } from 'vue'

export interface ConfirmOptions {
  /** 标题文本（已翻译后的字符串，直接显示） */
  title: string
  /** 正文消息，支持 \n 换行 */
  message: string
  /** 确认按钮文本 */
  confirmText?: string
  /** 取消按钮文本；为空则不显示取消按钮 */
  cancelText?: string
  /** 确认按钮是否使用主色调（默认 true） */
  primaryConfirm?: boolean
}

interface ConfirmRequest {
  title: string
  message: string
  confirmText: string
  cancelText: string
  primaryConfirm: boolean
  resolve: (value: boolean) => void
}

// 队列：每次 confirmDialog()/alertDialog() 入队并返回 Promise，
// 由 App.vue 中唯一的 ConfirmModal 依次展示队首，关闭后自动展示下一个。
// 因此天然支持弹窗嵌套（如确认框的回调里再弹确认）或多个异步链并发触发弹窗，
// 不会出现「单例 state 被覆盖导致前一个 Promise 永不 resolve」的问题。
const queue: ConfirmRequest[] = []

const state = reactive({
  visible: false,
  title: '',
  message: '',
  confirmText: 'OK',
  cancelText: '',
  primaryConfirm: true,
})

function showFront() {
  const front = queue[0]
  if (!front) {
    state.visible = false
    return
  }
  state.title = front.title
  state.message = front.message
  state.confirmText = front.confirmText
  state.cancelText = front.cancelText
  state.primaryConfirm = front.primaryConfirm
  state.visible = true
}

function enqueue(options: ConfirmOptions, resolve: (value: boolean) => void) {
  queue.push({
    title: options.title,
    message: options.message,
    confirmText: options.confirmText ?? 'OK',
    cancelText: options.cancelText ?? '',
    primaryConfirm: options.primaryConfirm ?? true,
    resolve,
  })
  // 当前没有弹窗在展示时才立即展示；否则等待队首关闭后由 resolveConfirm 自动展示下一个
  if (!state.visible) showFront()
}

/**
 * 打开确认弹窗，返回用户是否点击「确认」。
 * 替代原生 window.confirm，统一项目弹窗样式。
 */
export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => enqueue(options, resolve))
}

/**
 * 打开提示弹窗（仅确认按钮），返回 Promise<void>。
 * 替代原生 window.alert，统一项目弹窗样式。
 */
export function alertDialog(options: Omit<ConfirmOptions, 'cancelText'>): Promise<void> {
  return new Promise<void>((resolve) => enqueue({ ...options, cancelText: '' }, () => resolve()))
}

/** 由 ConfirmModal 在用户点击确认/取消或点击遮罩时调用 */
export function resolveConfirm(value: boolean) {
  const front = queue.shift()
  if (!front) return
  front.resolve(value)
  showFront()
}

/** 暴露响应式状态，供 App.vue 全局唯一挂载的 ConfirmModal 绑定 */
export function useConfirmState() {
  return state
}
