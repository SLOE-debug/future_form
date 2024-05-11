import Control from "@/CoreUI/Designer/Control";
import { ControlDeclare } from "@/Types/ControlDeclare";
import { DesignerDeclare } from "@/Types/DesignerDeclare";
import { UtilsDeclare } from "@/Types/UtilsDeclare";

import { ElMessage } from "element-plus";
import { Component, Provide } from "vue-facing-decorator";
import {
  DataConsistencyProxyCreator,
  DataLink,
  EstablishLink,
} from "@/Core/Designer/DataConsistency/DataConsistencyProxy";
import TableControl from "./TableControl";
import { defineAsyncComponent } from "vue";
import { Stack, StackAction } from "@/Core/Designer/UndoStack/Stack";
import { baseProps, baseEvents } from "@/Utils/Designer/Controls";
import { CreateControlByDragEvent, CreateControlName, CloneStruct } from "@/Utils/Designer/Designer";
import { Guid } from "@/Utils/Index";
import { GetAllSqlFiles, GetFileById } from "@/Utils/VirtualFileSystem/Index";

type ControlConfig = ControlDeclare.ControlConfig;
type DataSourceGroupConfig = ControlDeclare.DataSourceGroupConfig;
type TableConfig = ControlDeclare.TableConfig;

type ConfiguratorItem = DesignerDeclare.ConfiguratorItem;
type Coord = UtilsDeclare.Coord;

const AsyncSlideSelector = defineAsyncComponent(() => import("@/CoreUI/Designer/Components/SlideSelector"));
const AsyncSvgIcon = defineAsyncComponent(() => import("@/Components/SvgIcon"));

@Component
export default class DataSourceGroupControl extends Control {
  declare config: DataSourceGroupConfig;

  Drop(e: DragEvent) {
    let config = CreateControlByDragEvent.call(this, e) as ControlConfig;

    config.id = Guid.NewGuid();
    CreateControlName(config);
    config.top -= config.height / 2;
    config.left -= config.width / 2;
    config.fromContainer = this.config.name;

    this.config.$children.push(config);
    this.$nextTick(() => {
      this.$Store.dispatch(
        "Designer/AddStack",
        new Stack(this.$refs[config.name] as Control, null, null, StackAction.Create)
      );
    });
    e.stopPropagation();
  }

  slideStartCoord: Coord;
  SlideStart(e: MouseEvent) {
    if (e.button == 0 && e.activity != false && this.$Store.get.Designer.Debug)
      this.slideStartCoord = { x: e.clientX, y: e.clientY };
  }

  SlideEnd(e) {
    if (!e || !e.width || !e.height) return;

    let configs = this.config.$children.filter((c) => {
      return (
        c.left < e.left + e.width && c.left + c.width > e.left && c.top < e.top + e.height && c.top + c.height > e.top
      );
    });
    if (configs.length) {
      this.$Store.dispatch("Designer/SelectControlByConfig", configs);
    }
  }

  Cancel(e: MouseEvent) {
    super.Cancel(e);
    this.slideStartCoord = null;
  }

  @Provide
  rootConfig;

  async created() {
    this.rootConfig = this.config.$children;
    this.parentFormControl.dataSourceControls.push(this);
  }

  mounted() {
    this.config.GetSource = this.GetSource;
    this.config.SaveSource = this.SaveSource;
    this.config.SharedData = this.SharedData;
  }

  render() {
    return super.render(
      <>
        {this.$Store.get.Designer.Debug && (
          <AsyncSvgIcon
            {...{
              name: "GruopMove",
              class: css.move,
              size: 22,
              onMousedown: (e) => {
                this.Pick(e);
                this.BeginAdjust(e);
              },
              "data-type": "Move",
            }}
          />
        )}
        <div
          class={css.dataSourceGroup}
          style={{ border: this.$Store.get.Designer.Debug ? "1px dashed #999" : "" }}
          onDrop={this.Drop}
          onMousedown={this.SlideStart}
        >
          {this.$Store.get.Designer.Debug && (
            <AsyncSlideSelector
              {...{
                start: this.slideStartCoord,
                onSlideEnd: this.SlideEnd,
              }}
            />
          )}
          {this.config.$children.map((c, i) => {
            let control = this.$.appContext.components[c.type + "Control"];
            return <control key={c.id} locate={{ index: i }} ref={c.name} style={{ zIndex: i }}></control>;
          })}
        </div>
      </>
    );
  }

  /**
   * 跟踪属性变化
   * @param m 对象
   * @param p 属性名称
   * @param nv 新值
   * @param ov 旧值
   * @returns
   */
  TrackPropertyChange(m, p, nv, ov) {
    if (p == "$__check__$" || nv == ov) return;
    let data = this.diffData.get(m);
    if (!data) {
      data = CloneStruct(m);
      delete data.$__check__$;
      this.diffData.set(m, data);
    }

    // switch (data["#DataType"]) {
    //   case "Insert":
    //     data[`@Insert#${p}`] = nv;
    //     delete data[p];
    //     break;
    //   case "Delete":
    //     break;
    //   default:
    //     data[`@Modify#${p}`] = nv;
    //     data[p] = ov;
    //     break;
    // }

    data[p] = nv;
    // 如果没有任何标记，则标记为修改
    if (!data[ControlDeclare.DataStatusField]) {
      data[ControlDeclare.DataStatusField] = ControlDeclare.DataStatus.Edit;
      // 记录原始数据
      data[`#${p}`] = ov;
    }
  }

  /**
   * 同步数据
   * @param m 对象
   * @param p 属性名称
   * @param nv 新值
   * @param ov 旧值
   */
  SyncTrack(m, p, nv, ov) {
    this.TrackPropertyChange(m, p, nv, ov);
    if (this.sharedControl) this.sharedControl.TrackPropertyChange(m, p, nv, ov);
  }

  async GetSource(param: any) {
    let res;
    if (this.$Store.get.Designer.Preview) {
      let sqlFile = GetFileById(this.config.sourceName);

      res = await this.$Api.GetDataSourceGroupDataInDebug({
        sql: sqlFile.content,
        param: sqlFile.extraData.params,
        args: param || {},
      });
    } else {
      res = await this.$Api.GetDataSourceGroupData({
        id: this.config.sourceName,
        // param: { [this.config.sourceName]: param || {} },
        args: param || {},
      });
    }

    switch (this.config.sourceType) {
      case "List":
        // for (let i = 0; i < 20000; i++) {
        //   res.data.push(CloneStruct(res.data[0]));
        // }
        this.data = res.data.map((m) => {
          return DataConsistencyProxyCreator(m, this.SyncTrack.bind(this));
        });
        break;
      case "Form":
        if (res.data.length) this.data = DataConsistencyProxyCreator(res.data[0], this.SyncTrack.bind(this));
        break;
    }
    this[`Fill${this.config.sourceType}`]();
  }

  data: any;
  diffData: Map<any, any> = new Map();
  FillList() {
    this.diffData = new Map();
    let table = this.config.$children.find((c) => c.type == "Table") as TableConfig;
    if (table) {
      let control = this.$refs[table.name] as TableControl;
      control.SetData(this.data);
    }
  }

  dataLinks: DataLink[] = [];
  FillForm() {
    this.dataLinks?.forEach((l) => l.UnLink());
    this.dataLinks = [];

    this.FillChildren(this.config);
  }

  FillChildren(config: ControlConfig) {
    for (let i = 0; i < config.$children.length; i++) {
      let field = config.$children[i].sourceField;

      if (!!field) {
        if (this.data && field in this.data) {
          config.$children[i] = DataConsistencyProxyCreator(config.$children[i]);
          this.dataLinks.push(EstablishLink(config.$children[i], "value", this.data, field));
          switch (config.$children[i].type) {
            case "Number":
              config.$children[i].value = this.data[field];
              break;
            default:
              config.$children[i].value = this.data[field]?.toString();
              break;
          }
        } else {
          config.$children[i].value = undefined;
        }
      } else if (config.$children[i].$children?.length) {
        this.FillChildren(config.$children[i] as ControlConfig);
      }
    }
  }

  get _SharedData() {
    return this.config.sourceType == "Form" ? this.data : this.data?.find((m) => m.$__check__$);
  }

  sharedControl: DataSourceGroupControl;
  SharedData(control: DataSourceGroupControl) {
    if (!control) {
      ElMessage({ message: "被共享的控件不存在，请检查控件名称！", type: "error" });
      return;
    }
    if (control.config.type != "DataSourceGroup") {
      ElMessage({ message: "无法向非数据源控件共享数据！", type: "error" });
      return;
    }
    this.sharedControl = control;
    this.FillSharedData();
  }

  FillSharedData() {
    if (!this.sharedControl) return;
    this.sharedControl.data = this._SharedData;
    this.sharedControl.diffData = new Map();
    if (this.sharedControl.config.sourceType == "Form") this.sharedControl.FillForm();
    else this.sharedControl.FillList();
  }

  Validate() {
    let res = true;
    for (const c of this.config.$children) {
      let result = (this.parentFormControl.instance.$refs[c.name] as Control)?.Verify();
      if (result == false) {
        if (res) (this.parentFormControl.instance.$refs[c.name] as Control).Focus(this.parentFormControl);
        ElMessage({ message: c.errorMessage || "请检查表单中的必填项！", type: "error" });
        res = false;
      }
    }
    return res;
  }

  async SaveSource(sender: Control) {
    if (!this.Validate()) return;

    let data;
    switch (this.config.sourceType) {
      case "Form":
        data = [this.diffData.values().next().value];
        break;
      case "List":
        data = Array.from(this.diffData.values());
        break;
    }

    this.Save(sender, data);
  }

  private async Save(sender: Control, data: any[]) {
    if (this.diffData.size) {
      if (sender) sender.config.loading = true;
      try {
        let response;

        if (this.$Store.get.Designer.Preview) {
          let sqlFile = GetFileById(this.config.sourceName);
          response = await this.$Api.SaveDataSourceGroupDataInDebug({
            sql: sqlFile.content,
            tableName: sqlFile.extraData.table,
            fields: sqlFile.extraData.fields,
            primaryFields: sqlFile.extraData.primaryFields,
            data,
          });
        } else {
          response = await this.$Api.SaveDataSourceGroupData({
            id: this.parentFormControl.id,
            param: {
              [this.config.sourceName]: data,
            },
          });
        }

        const res = response.data;

        if (res.success) {
          this.diffData = new Map();
          ElMessage({ message: "保存成功！", type: "success" });
        } else {
          ElMessage({ message: res.message, type: "error", dangerouslyUseHTMLString: true });
        }
      } catch (error) {
        ElMessage({ message: "保存数据出错，请联系系统管理员！", type: "error" });
      } finally {
        if (sender) sender.config.loading = false;
      }
    }
  }

  unmounted() {
    this.sharedControl = null;
    this.dataLinks.forEach((l) => l.UnLink());
    this.dataLinks = null;
    this.data = null;
  }

  // DeclarationPatch() {
  //   if (this.config.sourceName) {
  //     let source = this.$Store.get.Designer.FormSources.find((s) => s.name == this.config.sourceName);

  //     let declare = `{ \n\t\tSaveSource(sender: any): Promise<void>`;

  //     if (source?.params.length)
  //       declare += `\n\t\tGetSource(data: { ${source.params.map((p) => {
  //         return `${p.name}: ${p.type};`;
  //       })} }): Promise<void>\n`;
  //     else declare += `\n\t\tGetSource(): Promise<void>\n`;

  //     declare += `\t\tSharedData(control: any);`;
  //     declare += `\n\t}`;
  //     return declare;
  //   }
  //   return "";
  // }

  static GetDefaultConfig(): DataSourceGroupConfig {
    return {
      width: 200,
      height: 180,
      type: "DataSourceGroup",
      container: true,
      sourceName: "",
      sourceType: "Form",
      readonly: false,
      GetSource: null,
      SaveSource: null,
    };
  }
}

export function GetProps(config: DataSourceGroupConfig, instance: DataSourceGroupControl) {
  let sqlFiles = GetAllSqlFiles();

  const fieldMap: ConfiguratorItem[] = [
    ...baseProps.filter((p) => p.field != "disabled" && p.field != "required"),
    {
      name: "数据源",
      des: "该组绑定的数据源",
      type: DesignerDeclare.InputType.ElSelect,
      field: "sourceName",
      options: sqlFiles.map((s) => {
        return { label: s.name, value: s.id };
      }),
    },
  ];
  if (config.sourceName) {
    fieldMap.push({
      name: "源类型",
      des: "该组绑定的数据源类型",
      type: DesignerDeclare.InputType.ElSelect,
      field: "sourceType",
      options: [
        { label: "Form", value: "Form" },
        { label: "List", value: "List" },
      ],
    });
  }
  return fieldMap;
}

export function GetEvents() {
  const eventMap: ConfiguratorItem[] = [...baseEvents];
  return eventMap;
}
