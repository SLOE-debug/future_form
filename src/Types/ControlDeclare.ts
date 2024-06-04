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

  export type Locate = {
    filter?: Record<string, string>;
    index: number;
  };

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
    displayField?: string[];
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
    options: { label: string; value: string }[];
    value: string;
    clearable: boolean;
    placeholder: string;
    filterable: boolean;
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

  export type ToolStripConfig = {
    // 字体大小
    fontSize: number;
    // 停靠位置
    dock: "top" | "bottom" | "left" | "right" | "none";
    // 项
    items: {
      type: "button" | "label" | "select" | "split";
      name: string;
      width: number;
      height: number;

      // 文本和按钮
      text: string;

      // 按钮
      showTextWidth?: number;
      showTextHeight?: number;
      icon?: string;
      customIcon?: string;
      iconSize?: number;

      // 下拉框
      placeholder?: string;
      options?: { label: string; value: string }[];
      value?: string;

      // 是否选中
      checked?: boolean;
      // 事件函数对象
      events: any;

      // 事件
      [x: string]: any;
    }[];
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

    $refs: any;
    GlobalVariate: GlobalVariate;
    Show(): void {}
    ShowDialog(): void {}
    Alert(message: string, type: "success" | "warning" | "info" | "error" = "info", duration: number = 3000): void {}
  }
}
