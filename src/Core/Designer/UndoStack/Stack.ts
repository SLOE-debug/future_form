import { ControlDeclare } from "@/Types/ControlDeclare";
import Control from "@/CoreUI/Designer/Control";
import store from "@/Vuex/Store";

type ControlConfig = ControlDeclare.ControlConfig;

export enum StackAction {
  /**
   * 默认行为
   */
  Default,
  /**
   * 删除行为
   */
  Delete,
  /**
   * 创建行为
   */
  Create,
  /**
   * 切换容器行为
   */
  SwitchContainer,
}

export class Stack {
  private _instance: Control;
  private _ov: ControlConfig;
  private _nv: ControlConfig;
  action: StackAction;

  constructor(instance: Control, nv: ControlConfig, ov: ControlConfig, action: StackAction = StackAction.Default) {
    this._instance = instance;
    this._nv = nv;
    this._ov = ov;
    this.action = action;

    // let actionStr = Object.keys(StackAction).find((key) => StackAction[key] == action);
    // console.log("新的堆栈", actionStr);
  }

  Efficient() {
    // 当前_instance是否已卸载
    if (this._instance.isUnmounted) return false;
    return true;
  }

  /**
   * 撤销
   */
  async Undo() {
    // 如果当前_instance已卸载，则获取新的_instance
    if (!this.Efficient()) {
      this._instance = await store.dispatch("Designer/GetControlByName", this._nv.name);
    }

    this._instance.disableStack = true;
    switch (this.action) {
      case StackAction.Delete:
        (this._instance.$parent as Control).config.$children.push(this._ov);
        break;
      case StackAction.Create:
        this._instance.Delete(false);
        break;
      case StackAction.SwitchContainer:
        await this._instance.SwitchContainer(this._ov.fromContainer);
        // 如果_ov拥有“最近一次的”标记，则不还原位置
        if ("last" in this._ov) break;
        this._instance.config.top = this._ov.top;
        this._instance.config.left = this._ov.left;
        break;
      default:
        this.Restore();
        break;
    }
    this._instance.$nextTick(() => {
      this._instance.disableStack = false;
    });
  }

  /**
   * 重新赋值旧数据
   */
  private Restore(config = this._instance.config, nv = this._nv, ov = this._ov) {
    if (!config) return;
    for (const k in nv) {
      if (typeof nv[k] == "object" && !Array.isArray(nv[k])) this.Restore(config[k], nv[k], ov[k]);
      else config[k] = ov[k];
    }
  }
}
