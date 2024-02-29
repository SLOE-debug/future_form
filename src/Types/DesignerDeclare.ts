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
    multiple?: boolean;
    field: string | RefValue;
    max?: number;
    min?: number;
    precision?: number;
    step?: number;
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
