import FormControl from "@/Controls/FormControl";
import { CreateControlByType } from "./Designer";
import { DataConsistencyProxyCreator } from "@/Core/Designer/DataConsistency/DataConsistencyProxy";
import { EventDeclare } from "@/Types/EventDeclare";
import store from "@/Vuex/Store";
import { GetFileById } from "../VirtualFileSystem/Index";

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
  constructor(id: string) {
    let file = GetFileById(id);
    console.log(file.extraData);
  }
  Show() {
    console.log("显示");
  }
}
