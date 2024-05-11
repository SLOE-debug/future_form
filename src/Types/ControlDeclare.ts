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

  export type DataSourceGroupConfig = {
    sourceName: string;
    sourceType: "Form" | "List";
    GetSource: (params?: any) => any;
    SaveSource: (sender: any) => any;
  } & ControlConfig;

  export type DateConfig = {
    value: string;
    placeholder: string;
    startPlaceholder: string;
    endPlaceholder: string;
  } & ControlConfig;

  export type FormConfig = {} & ControlConfig;

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
  } & ControlConfig;

  export enum DataStatus {
    New = 0,
    Edit = 1,
    Delete = 2,
  }

  // 数据状态标记属性名
  export const DataStatusField = "_status__$";

  type TabItem = { id: string; name: string; visible: boolean };

  export type TabsConfig = {
    value: string;
    tabs: TabItem[];
  } & ControlConfig;

  export abstract class BaseWindow {
    constructor(id: string) {}
    Show(): void {}
    ShowDialog(): void {}
    Alert(message: string, type: "success" | "warning" | "info" | "error" = "info", duration: number = 3000): void {}
  }
}
