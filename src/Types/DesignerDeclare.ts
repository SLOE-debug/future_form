import { ControlDeclare } from "./ControlDeclare";
import { UtilsDeclare } from "./UtilsDeclare";

type ControlConfig = ControlDeclare.ControlConfig;
type Source = UtilsDeclare.Source;

export namespace DesignerDeclare {
  export enum InputType {
    ElInput,
    ElInputNumber,
    ElSwitch,
    ElSelect,
    ElColorPicker,
    Options,
    Columns,
  }

  export type RefValue = {
    ref: any;
    key: string;
  };

  export type ConfiguratorItem = {
    name: string;
    des: string;
    type: InputType;
    config?: ControlConfig;
    options?: { label: string; value: string | number | boolean | object }[];
    onChange?: (value: any) => void;
    paramTypes?: string[][];
    /**
     * 不使用默认参数配置
     */
    unuseDefaultParam?: boolean;
    multiple?: boolean;
    field: string | RefValue;
    max?: number;
    min?: number;
    /**
     * 保留几位小数
     */
    precision?: number;
    step?: number;
    /**
     * 是否仅在设计文件中启用
     */
    onlyDesign?: boolean;

    /**
     * 特殊配置类型时传递的额外参数
     */
    extra?: any;
  };

  export type MenuItem = {
    text: string;
    code: string;
    shortcutKey?: string;
  };

  export type MethodType = {
    controlName: string;
    type: string;
  };

  export type SubWin = {
    _id: string;
    name: string;
    className: string;
    dataSource: Source[];
  };

  export type ContainerInfo = {
    globalTop: number;
    globalLeft: number;
    screenTop: number;
    screenLeft: number;
    container: ControlConfig;
  };
}
