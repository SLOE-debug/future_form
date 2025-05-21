import DataSourceGroupControl from "@/Controls/DataSourceGroupControl";
import FormControl from "@/Controls/FormControl";
import { sourceArgsPrefix } from "@/Utils/BasicUtils";
import { globalCache } from "@/Utils/Caches";
import DevelopmentModules from "@/Utils/DevelopmentModules";
import { ComponentBase, Vue, Prop } from "vue-facing-decorator";
import Control from "./Control";
import { ControlDeclare, UtilsDeclare } from "@/Types";

// type ControlConfig = ControlDeclare.ControlConfig;
// type DataSourceControlConfig = ControlDeclare.DataSourceControlConfig;
type EventHandlers = UtilsDeclare.EventHandlers;

@ComponentBase
export default class DataSourceControl extends Control {
  //   @Prop
  //   config: ControlConfig & DataSourceControlConfig;
  //   declare parentFormControl: FormControl;
  //   GetParentFormControl(control: DataSourceControl = this): FormControl {
  //     if (!("config" in control)) return null;
  //     if (control?.config?.type == "Form") return control as FormControl;
  //     return this.GetParentFormControl(control.$parent as Control);
  //   }

  //   declare parentDataSourceControl: DataSourceGroupControl;
  //   GetParentDataSourceGroupControl(control: Control = this.$parent as Control): DataSourceGroupControl {
  //     if (!("config" in control)) return null;
  //     if (control?.config.type == "Form") return null;
  //     if (control?.config.type == "DataSourceGroup") return control as DataSourceGroupControl;
  //     return this.GetParentDataSourceGroupControl(control.$parent as Control);
  //   }

  declare events: EventHandlers;
  async created() {
    this.events = {};
    // this.parentFormControl = this.GetParentFormControl();
    // this.parentDataSourceControl = this.GetParentDataSourceGroupControl();

    // if (this.$Store.get.Designer.Debug) return;

    // if (this.config.dataSource) {
    //   await this.parentFormControl.createEventPromise;

    //   this.parentFormControl.$nextTick(() => {
    //     let sourceParams = {};
    //     for (let k in this.config) {
    //       if (k.startsWith(sourceArgsPrefix)) {
    //         let name = k.split(sourceArgsPrefix)[1];
    //         sourceParams[name] = this.parentFormControl.instance.$refs[this.config[k]].config.value;
    //       }
    //     }

    //     this.GetInnerSource(sourceParams);
    //   });
    // }
  }

  async GetInnerSource(params) {
    // 优先从缓存中获取数据源
    let promise = globalCache.dataSourceCache.get(this.config.dataSource);
    if (!promise) {
      promise = new Promise(async (resolve) => {
        let methodName = "GetSource";
        // 请求参数
        let reqParams: any = { id: this.config.dataSource, args: params };

        // 如果是预览模式，则请求 GetSourceInDebug
        if (this.$Store.get.Designer.Preview) {
          let { GetFileById } = await DevelopmentModules.Load();

          methodName = "GetSourceInDebug";
          let file = GetFileById(this.config.dataSource);
          reqParams = { sql: file.content, param: file.extraData.params, args: params };
        }

        resolve((await this.$Api[methodName](reqParams)).data);
      });
      globalCache.dataSourceCache.set(this.config.dataSource, promise);
    }
    return await promise;
  }

  //   unmounted() {
  //     this.parentDataSourceControl = null;
  //     this.parentFormControl = null;
  //     for (const k in this.events) {
  //       this.events[k] = null;
  //     }
  //     this.events = null;
  //   }
}
