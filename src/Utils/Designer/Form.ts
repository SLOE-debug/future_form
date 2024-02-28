import FormControl from "@/Controls/FormControl";
import { CreateControlByType } from "./Designer";
import { DataConsistencyProxyCreator } from "@/Core/Designer/DataConsistency/DataConsistencyProxy";
import { EventDeclare } from "@/Types/EventDeclare";
import store from "@/Vuex/Store";
import { GetFileById } from "../VirtualFileSystem/Index";
import { ControlDeclare } from "@/Types/ControlDeclare";

type BarKit = EventDeclare.BarKit;
type WindowGlobalVariate = any;

export const WinGlobal: WindowGlobalVariate = DataConsistencyProxyCreator({ ref_no: "", wideScreen: true });

export class BaseForm {
  declare $Window: FormControl;
  declare $refs: any;
  declare $WinGlobal: WindowGlobalVariate;
  declare $baseToolkits: BarKit[];

  constructor(_winGlobal, _baseToolkits) {
    this.$WinGlobal = _winGlobal;
    this.$baseToolkits = _baseToolkits;
  }

  CreateControl(type: string) {
    return CreateControlByType.call(this.$Window, type + "Control");
  }

  async ShowWindow(className: string, dialog: boolean = false) {
    return new Promise(async (resolve, rekect) => {
      let res = await this.$Window.$Api.GetFormByClassName({ className: className });
      if (res.data) {
        let id = await store.dispatch("Designer/CreateWindow", { config: res.data, dialog });
        let complete = setInterval(() => {
          let instance = store.get.Window.WindowInstances[id];
          if (instance) {
            clearInterval(complete);
            resolve(instance);
          }
        }, 10);
      } else {
        ElMessage({ message: `未找到名为 ${className} 的窗体`, type: "error" });
        resolve(null);
      }
    });
  }

  async WaitWindow() {
    return new Promise(async (resolve, rekect) => {
      let closed = setInterval(() => {
        if (!store.get.Window.WindowInstances[this.$Window.instanceId]) {
          clearInterval(closed);
          resolve(null);
        }
      }, 10);
    });
  }

  // async GetListByExpression(exp: string, paramters?: object) {
  //   const { globalApi } = await CustomAxios;
  //   return (await globalApi.GetListByExpression({ exp, paramters: paramters || {} })).data;
  // }

  Refresh() {
    this.$Window.windowBar.RenderContentJsx();
  }

  Close() {
    store.dispatch("CloseWindow", this.$Window.instanceId);
  }

  Dispose() {
    let members = Object.keys(this);
    for (const k of members) {
      this[k] = null;
    }
  }
}

export class BaseWindow {
  /**
   * 窗体配置
   */
  formConfig: ControlDeclare.FormConfig;
  /**
   * 构造函数
   * @param id 窗体id
   */
  constructor(id: string) {
    let file = GetFileById(id);
    if (file) {
      this.formConfig = file.extraData;
    }
  }

  /**
   * 显示窗体
   */
  Show(dialog: boolean = false) {
    store.dispatch("Window/CreateWindow", { config: this.formConfig, dialog, instance: this });
  }
  /**
   * 显示窗体以对话框形式
   */
  ShowDialog() {
    this.Show(true);
  }
  /**
   * 绑定窗体事件及控件
   * @param config 窗体配置
   * @param form 窗体实例
   */
  BindWindowEventAndControl(config: ControlDeclare.FormConfig, form: FormControl) {
    // 绑定窗体的事件
    let eventNames = Object.keys(config).filter((k) => k.slice(0, 2) == "on");
    for (let i = 0; i < eventNames.length; i++) {
      let name = eventNames[i];
      let controlEvent = config[name].toString();
      if (controlEvent && this[controlEvent]) {
        form.events[name] = this[controlEvent].bind(this);
      }
    }
    // 绑定窗体的控件
    form.$nextTick(() => {
      this.BindControlInstance(config, this, form);
    });
  }
  /**
   * 绑定控件实例
   * @param config 控件配置
   * @param instance 控件实例
   * @param container 控件容器
   */
  private BindControlInstance(config: ControlDeclare.ControlConfig, instance, container) {
    for (let i = 0; i < config.$children.length; i++) {
      let c = config.$children[i];
      instance[c.name] = c;
      // instance.$refs[c.name] = container.$refs[c.name];

      let eventNames = Object.keys(c).filter((k) => k.slice(0, 2) == "on");
      for (let i = 0; i < eventNames.length; i++) {
        let name = eventNames[i];
        let controlEvent = c[name].toString();
        if (controlEvent && instance[controlEvent] && Object.prototype.hasOwnProperty.call(container.$refs, c.name))
          container.$refs[c.name].events[name] = instance[controlEvent].bind(instance);
      }
      if (c.$children?.length && Object.prototype.hasOwnProperty.call(container.$refs, c.name)) {
        this.BindControlInstance(c, instance, container.$refs[c.name]);
      }
    }
  }

  /**
   * 释放资源
   */
  Dispose() {
    this.formConfig = null;
    let members = Object.keys(this);
    for (const k of members) {
      this[k] = null;
    }
  }
}
