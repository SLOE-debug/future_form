import { ControlDeclare } from "@/Types/ControlDeclare";
import Control from "@/CoreUI/Designer/Control";

type ControlConfig = ControlDeclare.ControlConfig;

export enum StackAction {
  Default,
  Delete,
  Create,
}

export class Stack {
  private _instance: Control;
  private _ov: ControlConfig;
  private _nv: ControlConfig;
  private _action: StackAction;

  constructor(instance: Control, nv: ControlConfig, ov: ControlConfig, action: StackAction = StackAction.Default) {
    this._instance = instance;
    this._nv = nv;
    this._ov = ov;
    this._action = action;
  }

  Efficient() {
    return !!this._instance.config;
  }

  async Undo() {
    this._instance.disableStack = true;
    switch (this._action) {
      case StackAction.Delete:
        (this._instance.$parent as Control).config.$children.push(this._ov);
        break;
      case StackAction.Create:
        this._instance.Delete(false);
        break;
      default:
        this.Restore();
        break;
    }
    this._instance.$nextTick(() => {
      this._instance.disableStack = false;
    });
  }

  private Restore(config = this._instance.config, nv = this._nv, ov = this._ov) {
    if (!config) return;
    for (const k in nv) {
      if (typeof nv[k] == "object" && !Array.isArray(nv[k])) this.Restore(config[k], nv[k], ov[k]);
      else config[k] = ov[k];
    }
  }
}
