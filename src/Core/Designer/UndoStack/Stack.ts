import { ControlDeclare } from "@/Types/ControlDeclare";
import Control from "@/CoreUI/Designer/Control";
import { useDesignerStore } from "@/Stores/DesignerStore";
import { DesignerDeclare } from "@/Types";
import GlobalContainerManager from "@/Utils/Designer/GlobalContainerManager";

const designerStore = useDesignerStore();

type ControlConfig = ControlDeclare.ControlConfig;

export class Stack {
  private _controlId: string;
  private _ov: ControlConfig;
  private _nv: ControlConfig;
  action: DesignerDeclare.StackAction;

  constructor(
    instance: Control,
    nv: ControlConfig,
    ov: ControlConfig,
    action: DesignerDeclare.StackAction = DesignerDeclare.StackAction.Default
  ) {
    this._controlId = instance.config.id;
    this._nv = nv;
    this._ov = ov;
    this.action = action;
  }

  Efficient() {
    // 通过ID获取当前控件实例并检查是否已卸载
    const instance = this.getInstance();
    if (!instance || instance.isUnmounted) return false;
    return true;
  }

  /**
   * 通过ID获取控件实例
   */
  private getInstance(): Control | null {
    let name = designerStore.flatConfigs.entities[this._controlId]?.name;
    return designerStore.GetControlByName(name) || null;
  }

  /**
   * 撤销
   */
  async Undo() {
    let instance = this.getInstance();

    // 如果当前实例已卸载或不存在，则尝试通过名称获取新的实例
    if (!instance || instance.isUnmounted) {
      instance = designerStore.GetControlByName(this._nv.name);
      if (!instance) {
        console.warn(`无法找到控件实例，ID: ${this._controlId}, Name: ${this._nv.name}`);
        return;
      }
      // 更新控件ID
      this._controlId = instance.config.id;
    }

    instance.disableStack = true;
    try {
      switch (this.action) {
        case DesignerDeclare.StackAction.Delete:
          // 当行为为删除时，instance 为删除时传入的父级，_ov 为被删除的完整控件配置
          this.restoreDeletedControl(this._ov, instance.config.id);
          break;
        case DesignerDeclare.StackAction.Create:
          instance.Delete(false);
          break;
        case DesignerDeclare.StackAction.SwitchContainer:
          await GlobalContainerManager.switchContainer(instance, this._ov.fromContainer);
          // // 如果_ov拥有"最近一次的"标记，则不还原位置
          // if ("last" in this._ov) break;
          instance.config.top = this._ov.top;
          instance.config.left = this._ov.left;
          break;
        default:
          this.Restore(instance);
          break;
      }
      instance.$nextTick(() => {
        instance.disableStack = false;
      });
    } catch (error) {
      console.error("撤销操作失败:", error);
      instance.disableStack = false;
    }
  }

  /**
   * 恢复被删除的控件到拍平配置中
   */
  private restoreDeletedControl(deletedConfig: ControlConfig, parentId: string) {
    // 递归恢复控件及其所有子控件到拍平配置
    const restoreToFlatConfig = (config: ControlConfig) => {
      // 恢复控件到 entities
      designerStore.flatConfigs.entities[config.id] = config;

      // 如果有子控件，递归恢复
      if (config.$children && config.$children.length > 0) {
        // 恢复子控件映射
        designerStore.flatConfigs.childrenMap[config.id] = config.$children.map((child) => child.id);

        // 递归恢复每个子控件
        config.$children.forEach((child) => restoreToFlatConfig(child));
      }
    };

    // 恢复被删除的控件及其所有子控件
    restoreToFlatConfig(deletedConfig);

    // 将被删除的控件添加到父控件的子控件映射中
    if (!designerStore.flatConfigs.childrenMap[parentId]) {
      designerStore.flatConfigs.childrenMap[parentId] = [];
    }
    designerStore.flatConfigs.childrenMap[parentId].push(deletedConfig.id);
  }

  /**
   * 重新赋值旧数据
   */
  private Restore(instance?: Control) {
    const targetInstance = instance || this.getInstance();
    if (!targetInstance) {
      console.warn("无法找到控件实例进行还原操作");
      return;
    }

    this.restoreConfig(targetInstance.config, this._nv, this._ov);
  }

  /**
   * 递归还原配置
   */
  private restoreConfig(config: any, nv: any, ov: any) {
    if (!config) return;
    for (const k in nv) {
      if (typeof nv[k] == "object" && !Array.isArray(nv[k])) {
        this.restoreConfig(config[k], nv[k], ov[k]);
      } else {
        config[k] = ov[k];
      }
    }
  }

  /**
   * 释放资源，清理引用以防止内存泄漏
   */
  Dispose() {
    // 清理配置对象引用
    this._ov = null as any;
    this._nv = null as any;
    // 保留 _controlId 和 action，因为这些是基本类型
  }

  /**
   * 获取控件ID
   */
  get controlId(): string {
    return this._controlId;
  }
}
