import { UtilsDeclare } from "@/Types/UtilsDeclare";

export type EventHandler = (event: Event) => void;
export type EventTarget = Window | Document | HTMLElement;

/**
 * 事件管理器 - 处理事件绑定和解绑定，自动处理上下文绑定
 */
export class EventManager {
  private handlers: Map<string, { target: EventTarget; event: string; handler: EventHandler }[]> = new Map();

  /**
   * 添加事件监听
   * @param target 事件目标 (window, document 或 DOM元素)
   * @param event 事件名称
   * @param handler 事件处理函数
   * @param context 事件处理函数的上下文(this)
   */
  add<T>(target: EventTarget, event: string, handler: EventHandler, context?: T): void {
    // 绑定处理函数的上下文
    const boundHandler = context ? handler.bind(context) : handler;

    // 添加事件监听
    target.addEventListener(event, boundHandler);

    // 存储处理函数信息以便后续移除
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }

    this.handlers.get(event)!.push({
      target,
      event,
      handler: boundHandler,
    });
  }

  /**
   * 批量添加事件监听
   * @param target 事件目标
   * @param handlers 事件处理函数映射
   * @param context 事件处理函数的上下文
   */
  addBatch<T>(target: EventTarget, handlers: Record<string, EventHandler>, context?: T): void {
    Object.entries(handlers).forEach(([event, handler]) => {
      this.add(target, event, handler, context);
    });
  }

  /**
   * 移除特定事件监听
   * @param event 事件名称
   */
  remove(event?: string): void {
    if (event) {
      // 移除特定事件
      const handlers = this.handlers.get(event) || [];
      handlers.forEach(({ target, event, handler }) => {
        target.removeEventListener(event, handler);
      });
      this.handlers.delete(event);
    } else {
      // 移除所有事件
      this.handlers.forEach((handlers) => {
        handlers.forEach(({ target, event, handler }) => {
          target.removeEventListener(event, handler);
        });
      });
      this.handlers.clear();
    }
  }

  /**
   * 移除所有事件监听
   */
  removeAll(): void {
    this.remove();
  }
}
