import DragAdjustManager from "./DragAdjustManager";
import GlobalContainerManager from "./GlobalContainerManager";

/**
 * 管理器清理工具
 * 用于在应用卸载时清理单例管理器的资源
 */
export class ManagerCleanup {
  private static isCleanupRegistered = false;

  /**
   * 注册清理事件
   * 在应用初始化时调用一次即可
   */
  static registerCleanup() {
    if (this.isCleanupRegistered) return;

    // 监听页面卸载事件
    window.addEventListener("beforeunload", this.cleanup);
    
    // 监听 Vue 应用卸载事件（如果使用的话）
    if (typeof window !== "undefined" && (window as any).__VUE_APP__) {
      const app = (window as any).__VUE_APP__;
      if (app && app.config && app.config.globalProperties) {
        // 在应用卸载时清理
        const originalUnmount = app.unmount;
        app.unmount = function(...args: any[]) {
          ManagerCleanup.cleanup();
          return originalUnmount.apply(this, args);
        };
      }
    }

    this.isCleanupRegistered = true;
  }

  /**
   * 手动清理所有管理器资源
   */
  static cleanup = () => {
    try {
      // 清理拖拽管理器
      DragAdjustManager.destroy();
      
      // 全局容器管理器是无状态的，不需要特殊清理
      // 但如果将来添加了状态，可以在这里清理
      
      console.log("✅ 管理器资源已清理");
    } catch (error) {
      console.warn("⚠️ 清理管理器资源时出错：", error);
    }
  };

  /**
   * 取消注册清理事件
   */
  static unregisterCleanup() {
    window.removeEventListener("beforeunload", this.cleanup);
    this.isCleanupRegistered = false;
  }
}

// 自动注册清理（可选）
if (typeof window !== "undefined") {
  ManagerCleanup.registerCleanup();
}

export default ManagerCleanup;