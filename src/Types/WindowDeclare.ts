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

  /**
   * 窗体标题栏控件
   */
  export type TitleBarControl = {
    /**
     * 类型
     */
    type: "icon" | "select";
    /**
     * 是否可见
     */
    visible?: boolean;

    /**
     * 图标类型
     */
    iconType?: "fontawesome" | "custom";
    /**
     * 图标
     */
    icon?: string;
    /**
     * 标题
     */
    title?: string;
    /**
     * 选中
     */
    active?: boolean;

    /**
     * 宽度
     */
    width?: number;
    /**
     * 占位符
     */
    placeholder?: string;
    /**
     * 是否是远程搜索的下拉框
     */
    remote?: boolean;
    /**
     * 远程搜索方法
     */
    remoteMethod?: Function;
  };
}
