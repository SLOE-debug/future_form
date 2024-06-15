import { BaseWindow } from "@/Utils/Designer/Form";
import { ControlDeclare } from "./ControlDeclare";

type ControlConfig = ControlDeclare.ControlConfig;

export namespace WindowDeclare {
  export type WindowConfig = {
    config: ControlConfig;
    code: string;
    compiledCode: string;
    className: string;
    name: string;
    _id: string;
    instanceId: string;
    icon: string;
    maximize: boolean;
    fixed: boolean;
    baseToolKits: boolean;
    dialog: boolean;
  };

  /**
   * 桌面窗体实例参数
   */
  export type DesktopWindowInstances = {
    /**
     * 窗体配置
     */
    config: ControlDeclare.FormConfig;
    /**
     * 焦点索引
     */
    focusIndex: number;
    /**
     * 是否为对话框形式弹出
     */
    dialog: boolean;
    /**
     * 窗体实例
     */
    instance: BaseWindow;
    /**
     * 是否为子窗体
     */
    subWindow: boolean;
    /**
     * 是否是刷新的窗体
     */
    isRefresh: boolean;
    /**
     * 是否选中
     */
    selected: boolean;
  };

  /**
   * 窗体起始位置
   */
  export enum StartPosition {
    /**
     * 默认
     */
    Default,
    /**
     * 居中
     */
    CenterScreen,
  }
}
