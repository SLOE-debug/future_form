export namespace ControlDeclare {
  export type ParamItem = {
    name: string;
    type: string;
  };

  export enum AdjustType {
    Resize,
    Move,
  }

  export type OptionValue = string | number;

  export type ControlConfig = {
    width: number;
    height: number;
    type: string;
    name?: string;
    transparent?: number;
    round?: number;
    border?: number;
    borderStyle?: string;
    borderColor?: string;
    color?: string;
    bgColor?: string;
    visible?: boolean;
    readonly?: boolean;
    disabled?: boolean;
    required?: boolean;
    errorMessage?: string;
    container?: boolean;
    fromContainer?: string;
    fromTabId?: string;
    sourceField?: string;

    id?: string;
    top?: number;
    left?: number;
    $children?: ControlConfig[];
    [x: string]: any;
  };

  /**
   * 基本的数据源控件配置，包含数据源、显示字段、数据字段、参数
   */
  export type DataSourceControlConfig = {
    dataSource?: string;
    displayField?: string;
    dataField?: string;
    params?: ParamItem[];
  };

  export type ButtonConfig = { fontSize: number; style: string; text: string; loading: boolean } & ControlConfig;

  export type CheckConfig = {
    label: string;
    value: OptionValue | boolean;
    selectValue: OptionValue;
    unSelectValue: OptionValue;
  } & ControlConfig;

  export type CheckGroupConfig = {
    options: { label: string }[];
    value: string[];
    align: string;
    optionRight: number;
  } & ControlConfig;

  /**
   * 数据源组配置
   */
  export type DataSourceGroupConfig = {
    sourceName: string;
    sourceType: "Form" | "List";
    SaveSource?(sender: any): any;
    SharedData?(control: any): any;
  } & ControlConfig;

  export type DateConfig = {
    value: string;
    placeholder: string;
    startPlaceholder: string;
    endPlaceholder: string;
  } & ControlConfig;

  export type FormConfig = {
    maximize?: boolean;
    // 是否显示标题栏的控件组
    showTitleBarControls?: boolean;
  } & ControlConfig;

  export type GroupConfig = {
    sunk: boolean;
  } & ControlConfig;

  export type InputConfig = {
    value: string;
    placeholder: string;
    clearable: boolean;
    textIndent: number;
    textarea: boolean;
    formatter: string;
    formatterReplace: string;
    maxlength: number;
  } & ControlConfig;

  export type LabelConfig = {
    fontSize: number;
    text: string;
    align: string;
  } & ControlConfig;

  export type NumberConfig = {
    value: number;
    controlsAlign: string;
  } & ControlConfig;

  export type RadioConfig = {
    options: { label: string; value: OptionValue }[];
    value: OptionValue;
    optionRight: number;
    align: string;
  } & ControlConfig;

  export type SelectConfig = {
    options: { label: string; value: string; m?: Object }[];
    value: string;
    clearable: boolean;
    placeholder: string;
    filterable: boolean;
    // 行高
    itemHeight: number;
    // 显示方式
    display: "list" | "table";
    // 列
    columns?: {
      title: string;
      field: string;
      width?: number;
      isHtml?: boolean;
    }[];
  } & DataSourceControlConfig &
    ControlConfig;

  export type SubWindowConfig = {
    form: { [x: string]: ControlConfig & Function };
    subWindowId: string;
    // 实例化时 new 的类名
    createClassName: string;
  } & ControlConfig;

  export type ColumnItem = {
    title?: string;
    field: string;
    type?: "text" | "number" | "date" | "select" | "check" | "button" | "pic";
    key?: string;
    dataKey?: string;
    width: number;
    hidden?: boolean;
    readonly?: boolean;
    sortable?: boolean;
    filter?: boolean;
    options?: { label: string; value: string }[];
    btnColor?: string;
    selectValue?: string;
    unSelectValue?: string;
    dataSource?: string;
    displayField?: string;
    dataField?: string;

    headerCellRenderer?: any;
    cellRenderer?: any;
  };

  export type TableConfig = {
    columns: ColumnItem[];
    data: any[];
    multiple: boolean;
    highlightColumn: boolean;
    // 添加行
    AddRow?: (object?: object) => void;
    // 删除选中行
    DeleteSelectedRow?: () => void;
    // 选中行
    SelectRow?: (index: number) => void;
  } & ControlConfig;

  export enum DataStatus {
    New = 0,
    Edit = 1,
    Delete = 2,
  }

  export type ToolStripItem = {
    type: "button" | "label" | "select" | "split";
    name: string;
    width: number;
    height: number;

    // 文本和按钮
    text?: string;

    // 按钮
    showTextWidth?: number;
    showTextHeight?: number;
    icon?: string;
    faIcon?: string;
    iconSize?: number;
    // 禁用
    disabled?: boolean;

    // 下拉框
    placeholder?: string;
    options?: { label: string; value: string; m?: Object }[];
    value?: string;
    // 是否可清空
    clearable?: boolean;
    // 正在加载
    loading?: boolean;
    // 加载时显示的文字
    loadingText?: string;
    // 无数据时显示的文字
    empty?: string;
    // 远程搜索下拉框
    remote?: boolean;
    // 远程方法
    remoteMethod?: Function;
    // 是否可筛选
    filterable?: boolean;
    // 显示方式
    display?: "list" | "table";
    // 列
    columns?: {
      title: string;
      field: string;
      width?: number;
    }[];

    // 是否选中
    checked?: boolean;
    // 事件函数对象
    events: { [x: string]: Function };

    // 事件
    [x: string]: any;
  };

  export type ToolStripConfig = {
    // 字体大小
    fontSize: number;
    // 停靠位置
    dock: "top" | "bottom" | "left" | "right" | "none";
    // 项
    items: ToolStripItem[];
    // 按钮是否显示文本
    showText: boolean;
    // 是否显示区分的线
    showSplit: boolean;
  } & ControlConfig;

  // 数据状态标记属性名
  export const DataStatusField = "_status__$";

  type TabItem = { id: string; name: string; visible: boolean };

  export type TabsConfig = {
    value: string;
    tabs: TabItem[];
  } & ControlConfig;

  // 全局变量对象
  export type GlobalVariate = {
    [x: string]: any;
  };

  export abstract class BaseWindow {
    constructor(id: string) {}

    /**
     * 当前窗体中所有的控件实例
     */
    $refs: any;
    /**
     * 全局变量对象
     */
    $globalVariate: GlobalVariate;
    /**
     * 显示窗体
     */
    Show(): void {}
    /**
     * 以对话框的形式显示窗体
     */
    ShowDialog(): void {}
    /**
     * 弹出消息
     * @param message 消息内容
     * @param type 消息类型
     * @param duration 显示时间
     */
    Alert(message: string, type: "success" | "warning" | "info" | "error" = "info", duration: number = 3000): void {}
    /**
     * 弹出确认框
     */
    Confirm(
      message: string,
      title: string = "提示",
      type: "success" | "warning" | "info" | "error" = "info",
      confirmButtonText: string = "确定",
      cancelButtonText: string = "取消",
      showConfirmButton: boolean = true,
      showCancelButton: boolean = true
    ): Promise<boolean> {
      return new Promise((resolve) => {});
    }
    /**
     * 关闭窗体
     */
    Close(): void {}

    /**
     * 获取公共的ToolStrips配置
     */
    GetCommonToolStrips(): ToolStripItem[] {
      return [];
    }
    /**
     * Watch函数，用于监控数据变化
     */
    Watch(data: any, prop: string, callback: (nv: any, ov: any) => void) {}
  }
}
