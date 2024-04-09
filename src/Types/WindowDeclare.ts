import { BaseWindow } from "@/Utils/Designer/Form";
import { ControlDeclare } from "./ControlDeclare";
import { EventDeclare } from "./EventDeclare";

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
    config: ControlDeclare.FormConfig;
    focusIndex: number;
    dialog: boolean;
    instance: BaseWindow;
    subWindow: boolean;
  };

  export enum StartPosition {
    Default,
    CenterScreen,
  }
}
