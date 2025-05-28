import { ref, shallowReactive, shallowRef } from "vue";
import { ControlDeclare } from "@/Types";
import type Control from "@/CoreUI/Designer/Control";
import GlobalContainerManager from "./GlobalContainerManager";

// 拖拽调整状态
type DragAdjustState = {
  isDragging: boolean;
  adjustType: ControlDeclare.AdjustType | null;
  startCoord: { x: number; y: number } | null;
  offset: number[];
  lastMousePos: { x: number; y: number } | null;
};

// 缓存的控件信息
type CachedControl = {
  el: HTMLDivElement;
  originalLeft: number;
  originalTop: number;
  originalWidth: number;
  originalHeight: number;
  control: Control;
};

/**
 * 拖拽调整管理器 - 静态方法模式
 */
class DragAdjustManager {
  private static dragState = shallowReactive<DragAdjustState>({
    isDragging: false,
    adjustType: null,
    startCoord: null,
    offset: [],
    lastMousePos: null,
  });

  // 缓存控件信息为 shallowRef，避免深度 reactive
  private static cachedControls = shallowRef<CachedControl[]>([]);

  /**
   * 开始拖拽调整
   */
  static beginDragAdjust(e: MouseEvent, control: Control, selectedContainerControls: Control[]) {
    const designerStore = control.designerStore;
    if (!designerStore.debug || e.activity === false) return;

    e.activity = false;
    if (e.button !== 0) return;

    const target = e.target as HTMLDivElement;
    const { offset, type } = target.dataset;

    this.dragState.isDragging = true;
    this.dragState.startCoord = { x: e.clientX, y: e.clientY };
    this.dragState.lastMousePos = { x: e.clientX, y: e.clientY };

    if (type) {
      this.dragState.adjustType = ControlDeclare.AdjustType.Move;
    }
    if (offset) {
      this.dragState.adjustType = ControlDeclare.AdjustType.Resize;
      this.dragState.offset = offset.split(",").map((s) => parseInt(s));
    }

    // 将调整类型应用到控件
    control.adjustType = this.dragState.adjustType;

    // 缓存所有参与拖拽的控件信息
    this.cachedControls.value = selectedContainerControls
      .map((ctrl) => ({
        el: ctrl.$el as HTMLDivElement,
        originalLeft: ctrl.config.left,
        originalTop: ctrl.config.top,
        originalWidth: ctrl.config.width,
        originalHeight: ctrl.config.height,
        control: ctrl,
      }))
      .filter((item) => item.el);

    // 绑定全局事件
    window.addEventListener("mousemove", this.handleGlobalMouseMove);
    window.addEventListener("mouseup", this.handleGlobalMouseUp);
  }

  /**
   * 全局鼠标移动处理 - 基于缓存的DOM直接操作
   */
  private static handleGlobalMouseMove = (e: MouseEvent) => {
    if (!this.dragState.isDragging || !this.dragState.lastMousePos) return;

    const { x: lastX, y: lastY } = this.dragState.lastMousePos;
    const deltaX = e.clientX - lastX;
    const deltaY = e.clientY - lastY;

    // 如果移动距离太小，忽略
    if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;

    // 直接操作缓存的DOM元素，不访问任何control相关内容
    switch (this.dragState.adjustType) {
      case ControlDeclare.AdjustType.Move:
        this.handleBatchMoveDOM(deltaX, deltaY);
        break;
      case ControlDeclare.AdjustType.Resize:
        this.handleBatchResizeDOM(deltaX, deltaY);
        break;
    }

    // 更新最后的鼠标位置
    this.dragState.lastMousePos = { x: e.clientX, y: e.clientY };
  };

  /**
   * 批量移动DOM处理 - 直接操作DOM，不访问control
   */
  private static handleBatchMoveDOM(deltaX: number, deltaY: number) {
    this.cachedControls.value.forEach((cached) => {
      const newLeft = cached.originalLeft + deltaX;
      const newTop = cached.originalTop + deltaY;

      cached.el.style.left = `${newLeft}px`;
      cached.el.style.top = `${newTop}px`;

      // 更新缓存的当前值
      cached.originalLeft = newLeft;
      cached.originalTop = newTop;
    });
  }

  /**
   * 批量调整大小DOM处理 - 直接操作DOM，不访问control
   */
  private static handleBatchResizeDOM(deltaX: number, deltaY: number) {
    const [offsetX, offsetY] = this.dragState.offset;
    const MIN_SIZE = 20;

    this.cachedControls.value.forEach((cached) => {
      const adjustX = deltaX * offsetX;
      const adjustY = deltaY * offsetY;
      const isLeft = Math.sign(offsetX) === -1;
      const isTop = Math.sign(offsetY) === -1;

      const canAdjustWidth = cached.originalWidth + adjustX >= MIN_SIZE;
      const canAdjustHeight = cached.originalHeight + adjustY >= MIN_SIZE;

      if (isLeft && canAdjustWidth) {
        const newLeft = cached.originalLeft + -adjustX;
        cached.el.style.left = `${newLeft}px`;
        cached.originalLeft = newLeft;
      }
      if (isTop && canAdjustHeight) {
        const newTop = cached.originalTop + -adjustY;
        cached.el.style.top = `${newTop}px`;
        cached.originalTop = newTop;
      }

      if (canAdjustWidth) {
        const newWidth = cached.originalWidth + adjustX;
        cached.el.style.width = `${newWidth}px`;
        cached.originalWidth = newWidth;
      }
      if (canAdjustHeight) {
        const newHeight = cached.originalHeight + adjustY;
        cached.el.style.height = `${newHeight}px`;
        cached.originalHeight = newHeight;
      }
    });
  }

  /**
   * 全局鼠标抬起处理
   */
  private static handleGlobalMouseUp = (e: MouseEvent) => {
    if (!this.dragState.isDragging) return;

    // 批量赋值到 config
    this.cachedControls.value.forEach((item) => {
      // 检查 config 是否存在，防止在容器切换过程中 config 被删除
      if (item.control.config) {
        item.control.config.left = item.originalLeft;
        item.control.config.top = item.originalTop;
        item.control.config.width = item.originalWidth;
        item.control.config.height = item.originalHeight;
        GlobalContainerManager.handleContainerOnMouseUp(e, item.control);
        item.control.adjustType = null;
      }
    });

    // 清理拖拽状态
    this.dragState.isDragging = false;
    this.dragState.adjustType = null;
    this.dragState.startCoord = null;
    this.dragState.lastMousePos = null;
    this.dragState.offset = [];
    this.cachedControls.value = [];

    // 移除全局事件监听
    window.removeEventListener("mousemove", this.handleGlobalMouseMove);
    window.removeEventListener("mouseup", this.handleGlobalMouseUp);
  };

  /**
   * 获取当前拖拽状态
   */
  static get isDragging() {
    return this.dragState.isDragging;
  }

  /**
   * 清理资源
   */
  static destroy() {
    // 移除事件监听器
    window.removeEventListener("mousemove", this.handleGlobalMouseMove);
    window.removeEventListener("mouseup", this.handleGlobalMouseUp);

    // 重置状态
    this.dragState.isDragging = false;
    this.dragState.adjustType = null;
    this.dragState.startCoord = null;
    this.dragState.lastMousePos = null;
    this.dragState.offset = [];
    this.cachedControls.value = [];
  }
}

export default DragAdjustManager;
