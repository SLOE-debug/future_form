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

  export type DesktopWindowInstances = {
    config: WindowConfig;
    focusIndex: number;
    dialog: boolean;
  };

  export enum StartPosition {
    Default,
    CenterScreen,
  }
}
