import FormControl from "@/Controls/FormControl";
import { DataConsistencyProxyCreator } from "@/Core/Designer/DataConsistency/DataConsistencyProxy";
import store from "@/Vuex/Store";
import { ControlDeclare } from "@/Types/ControlDeclare";
import Compiler from "@/Core/Compile/Compiler";
// import { EventDeclare } from "@/Types/EventDeclare";

// type BarKit = EventDeclare.BarKit;
type WindowGlobalVariate = any;

export const WinGlobal: WindowGlobalVariate = DataConsistencyProxyCreator({ ref_no: "", wideScreen: true });

export class BaseWindow {
  /**
   * 窗体配置
   */
  formConfig: ControlDeclare.FormConfig;

  /**
   * 窗体控件的引用
   */
  $refs: { [x: string]: any } = {};

  // // 窗体控制条上的按钮组
  // barKit: EventDeclare.BarKit[] = [];

  // 窗体ID
  id: string;

  /**
   * 构造函数
   * @param id 窗体id
   */
  constructor(_id: string) {
    this.id = _id;
  }

  // 是否已经加载过窗体的Config
  isLoaded: boolean = false;

  /**
   * 加载窗体的Config
   */
  async LoadConfig() {
    if (this.isLoaded) return;
    let file = await Compiler.LazyLoad(this.id);
    if (file) {
      this.formConfig = file.extraData;
    }
    this.isLoaded = true;
  }

  /**
   * 弹出提示
   * @param message 提示信息
   * @param type 提示类型
   * @param duration 显示时间
   */
  Alert(message: string, type: any = "info", duration: number = 3000) {
    ElMessage({ message, type, duration });
  }

  /**
   * 显示窗体
   */
  async Show(dialog: boolean = false, subWindow: boolean = false) {
    await this.LoadConfig();
    return await store.dispatch("Window/CreateWindow", { config: this.formConfig, dialog, subWindow, instance: this });
  }

  /**
   * 显示窗体以对话框形式
   */
  async ShowDialog() {
    return await this.Show(true);
  }
  /**
   * 显示子窗体
   */
  async ShowSubWindow() {
    return await this.Show(false, true);
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
      // 为了验证方便，将控件的引用挂载到窗体实例上
      instance.$refs[c.name] = container.$refs[c.name];

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
