import { ControlDeclare } from "@/Types/ControlDeclare";
import Control from "@/CoreUI/Designer/Control";
import { useDesignerStore } from "@/Stores/designerStore";
import { DesignerDeclare } from "@/Types";

const designerStore = useDesignerStore();

type ControlConfig = ControlDeclare.ControlConfig;

export class Stack {
  private _instance: Control;
  private _ov: ControlConfig;
  private _nv: ControlConfig;
  action: DesignerDeclare.StackAction;

  constructor(
    instance: Control,
    nv: ControlConfig,
    ov: ControlConfig,
    action: DesignerDeclare.StackAction = DesignerDeclare.StackAction.Default
  ) {
    this._instance = instance;
    this._nv = nv;
    this._ov = ov;
    this.action = action;
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
      this._instance = designerStore.GetControlByName(this._nv.name);
    }

    this._instance.disableStack = true;
    switch (this.action) {
      case DesignerDeclare.StackAction.Delete:
        // 当行为为删除时，instance 为删除时传入的父级
        this._instance.config.$children.push(this._ov);
        break;
      case DesignerDeclare.StackAction.Create:
        this._instance.Delete(false);
        break;
      case DesignerDeclare.StackAction.SwitchContainer:
        await this._instance.containerManager.SwitchContainer(this._ov.fromContainer);
        // // 如果_ov拥有“最近一次的”标记，则不还原位置
        // if ("last" in this._ov) break;
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
