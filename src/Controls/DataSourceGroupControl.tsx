import Control from "@/CoreUI/Designer/Control";
import { ControlDeclare } from "@/Types/ControlDeclare";
import { DesignerDeclare } from "@/Types/DesignerDeclare";
import { UtilsDeclare } from "@/Types/UtilsDeclare";
import { ElMessage, dayjs } from "element-plus";
import { Component } from "vue-facing-decorator";
import TableControl from "./TableControl";
import { defineAsyncComponent, watch } from "vue";
import { CloneStruct } from "@/Utils";
import DevelopmentModules from "@/Utils/DevelopmentModules";
import { DropAddControl } from "@/Utils/Designer";
import { TwoWayBinding } from "@/Utils/Runtime";
import { useVirtualFileSystemStore } from "@/Stores/VirtualFileSystemStore";

const virtualFileSystemStore = useVirtualFileSystemStore();

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
    DropAddControl(e, this);
    e.stopPropagation();
  }

  slideStartCoord: Coord;
  SlideStart(e: MouseEvent) {
    if (e.button == 0 && e.activity != false && this.designerStore.debug)
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
      this.designerStore.SelectControlByConfig(configs);
    }
  }

  async Cancel(e: MouseEvent) {
    this.slideStartCoord = null;
  }

  async created() {
    this.twoWayBindingList = [];
    this.diffData = new Map();
    this.parentFormControl.dataSourceControls.push(this);
  }

  setupDesignerMode(): void {
    super.setupDesignerMode();
    this.eventManager.add(window, "mouseup", this.Cancel);
  }

  mounted() {
    this.config.GetSource = this.GetSource;
    this.config.SaveSource = this.SaveSource;
    this.config.SharedData = this.SharedData;
  }

  render() {
    return super.render(
      <>
        {this.designerStore.debug && (
          <AsyncSvgIcon
            {...{
              name: "GruopMove",
              class:
                "w-[21px] absolute top-[-10px] left-[10px] z-[2] cursor-move bg-white flex border border-solid border-[#067bef] rounded-[5px] [&>svg]:p-[2px] [&>svg]:mt-[-1px]",
              size: 22,
              "data-type": "Move",
              "data-control": true,
            }}
          />
        )}
        <div
          class="w-full h-full overflow-hidden !cursor-auto relative !pointer-events-auto"
          style={{ border: this.designerStore.debug ? "1px dashed #999" : "" }}
          onDrop={this.designerStore.debug && this.Drop}
          onMousedown={this.designerStore.debug && this.SlideStart}
        >
          {this.designerStore.debug && (
            <AsyncSlideSelector
              {...{
                start: this.slideStartCoord,
                onSlideEnd: this.SlideEnd,
              }}
            />
          )}
          {this.config.$children.map((c, i) => {
            let control = this.$.appContext.components[c.type + "Control"];
            return <control key={c.id} config={c} ref={c.name} style={{ zIndex: i }}></control>;
          })}
        </div>
      </>
    );
  }

  async GetSource(param: any) {
    let res: { data: any };
    if (this.designerStore.preview) {
      let { GetFileById } = await DevelopmentModules.Load();

      let sqlFile = GetFileById(virtualFileSystemStore.root, this.config.dataSource);

      res = await this.$Api.GetDataSourceGroupDataInDebug({
        sql: sqlFile.content,
        param: sqlFile.extraData.params,
        args: param || {},
      });
    } else {
      res = await this.$Api.GetDataSourceGroupData({
        id: this.config.dataSource,
        args: param || {},
      });
    }

    // 清空差异数据
    this.diffData = new Map();
    this.data = res.data;
    this.PopulateData();
  }

  // 输出差异数据的定时器
  declare outputDiffDataTimer: NodeJS.Timeout;

  /**
   * 根据类型填充数据
   */
  PopulateData() {
    switch (this.config.sourceType) {
      case "List":
        this.SetTableData();
        break;
      case "Form":
        this.SetFormData();
        break;
    }

    // if (!this.outputDiffDataTimer && !this.designerStore.debug)
    //   this.outputDiffDataTimer = setInterval(() => {
    //     console.log(this.config.name, this.diffData);
    //   }, 1000 * 2);
  }

  // 数据源数据被修改时的数据差异集合
  declare diffData: Map<any, any>;

  /**
   * 获取或创建差异数据
   */
  GetOrCreateDiffData(obj: any) {
    let data = this.diffData.get(obj);
    if (!data) {
      data = CloneStruct(obj);
      // 删除 Table 控件中用于选中的字段，以保持数据的干净
      delete data.$__check__$;

      this.diffData.set(obj, data);
    }
    return data;
  }

  /**
   * 修改数据差异的数据状态
   */
  UpdateDataStatus(obj: any, status: ControlDeclare.DataStatus, originControlName?: string) {
    let data = this.GetOrCreateDiffData(obj);

    // 如果新状态是删除，并且旧状态是新增，则直接删除数据
    if (
      status == ControlDeclare.DataStatus.Delete &&
      data[ControlDeclare.DataStatusField] == ControlDeclare.DataStatus.New
    ) {
      this.diffData.delete(obj);
    }

    data[ControlDeclare.DataStatusField] = status;

    // 如果有共享控件，并且不是共享控件发起的更新，则将数据同步到共享控件
    this.sharedControl && !originControlName && this.sharedControl.UpdateDataStatus(obj, status, this.config.name);
  }

  /**
   * 更新数据差异，参数：对象，字段，新值，旧值
   */
  UpdateDiffData(obj: any, field: string, newValue: any, oldValue: any, originControlName?: string) {
    let data = this.GetOrCreateDiffData(obj);
    data[field] = newValue;

    // 如果没有数据状态字段，则认为是编辑状态
    if (data[ControlDeclare.DataStatusField] == undefined) {
      data[ControlDeclare.DataStatusField] = ControlDeclare.DataStatus.Edit;
      // 初次将添加旧值
      if (Object.prototype.hasOwnProperty.call(data, `#${field}`) == false) {
        data[`#${field}`] = oldValue;
      }
    }

    // 如果有共享控件，并且不是共享控件发起的更新，则将数据同步到共享控件
    this.sharedControl &&
      !originControlName &&
      this.sharedControl.UpdateDiffData(obj, field, newValue, oldValue, this.config.name);
  }

  // 当前数据源数据
  data: any;
  /**
   * 填充列表数据
   */
  private SetTableData() {
    let table = this.config.$children.find((c) => c.type == "Table") as TableConfig;
    if (table) {
      let control = this.$refs[table.name] as TableControl;

      // 循环 data 为 data 创建 双向绑定 watch
      for (const d of this.data) {
        for (const key in d) {
          let stopWatch = watch(
            () => d[key],
            (newValue, oldValue) => {
              this.UpdateDiffData(d, key, newValue, oldValue);
            }
          );
          this.twoWayBindingList.push(stopWatch);
        }
      }

      control.SetData(this.data);
    }
  }

  // 双向绑定监听列表
  declare twoWayBindingList: Function[];
  /**
   * 填充表单数据
   */
  private SetFormData() {
    this.twoWayBindingList.forEach((stop) => stop());
    this.twoWayBindingList = [];

    if (this.data.length) this.PopulateChildControls(this.config);
  }

  // 当类型为 Form 时，填充的数据对象索引
  populateIndex = 0;

  /**
   * 填充子控件的数据
   */
  private PopulateChildControls(config: ControlConfig) {
    let data = this.data[this.populateIndex];

    for (const c of config.$children) {
      let field = c.sourceField;
      if (field) {
        if (data && field in data) {
          c.value = this.FormatValue(data[field], c.type);
          const stop = TwoWayBinding.call(this, c, "value", data, field);
          this.twoWayBindingList.push(stop);
        } else {
          c.value = undefined;
        }
      } else if (c.$children?.length) {
        this.PopulateChildControls(c);
      }
    }
  }

  /**
   * 格式化字段值
   */
  private FormatValue(value: any, type: string) {
    if (value == null) return value;
    switch (type) {
      case "Number":
        return Number(value);
      case "Date":
        return dayjs(value).format("YYYY-MM-DD");
      default:
        return value?.toString();
    }
  }

  /**
   * 验证共享数据控件
   */
  private ValidateSharedDataControl(control: DataSourceGroupControl) {
    if (!control) {
      ElMessage({ message: "被共享的控件不存在，请检查控件名称！", type: "error" });
      return;
    }
    if (control.config.type != "DataSourceGroup") {
      ElMessage({ message: "无法向非数据源控件共享数据！", type: "error" });
      return;
    }
    return true;
  }

  // 共享的关联控件，A 中是 B，B 中是 A
  declare sharedControl: DataSourceGroupControl;
  /**
   * 共享数据
   * @param control 目标控件
   * @returns
   */
  SharedData(control: DataSourceGroupControl) {
    if (!this.ValidateSharedDataControl(control)) return;
    this.sharedControl = control;
    // 互相引用
    control.sharedControl = this;

    console.log("开始共享数据");
    console.log(`当前控件：${this.config.name}，共享控件：${control.config.name}`);

    // 如果 data 为空，则报错
    if (!this.data) {
      ElMessage({ message: "当前数据源组数据为空，无法共享数据（请检查数据源是否已获取完成）！", type: "error" });
      return;
    }

    // 赋值 data
    control.data = this.data;
    // 填充被共享控件的数据
    control.PopulateData();
  }

  /**
   * 保存时验证表单
   * @returns 是否验证通过
   */
  private Validate() {
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

  async SaveSource(sender: ControlConfig) {
    if (!this.Validate()) return;
    let data = this.GetSaveDataBySourceType();
    this.Save(sender, data);
  }

  /**
   * 根据数据源类型获取要保存的数据
   */
  GetSaveDataBySourceType() {
    switch (this.config.sourceType) {
      case "Form":
        return [this.diffData.values().next().value];
      case "List":
        return Array.from(this.diffData.values());
      default:
        return [];
    }
  }

  /**
   * 保存数据
   * @param sender 发送者
   * @param data 要保存的数据
   */
  private async Save(sender: ControlConfig, data: any[]) {
    if (!this.diffData.size) return;
    if (sender) sender.loading = true;
    try {
      let response = await this.SaveData(data);
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
      if (sender) sender.loading = false;
    }
  }

  /**
   * 保存数据
   */
  private async SaveData(data: any[]) {
    let { GetFileById } = await DevelopmentModules.Load();
    if (this.designerStore.preview) {
      let sqlFile = GetFileById(virtualFileSystemStore.root, this.config.dataSource);
      return await this.$Api.SaveDataSourceGroupDataInDebug({
        sql: sqlFile.content,
        tableName: sqlFile.extraData.table,
        fields: sqlFile.extraData.fields,
        primaryFields: sqlFile.extraData.primaryFields,
        data,
      });
    } else {
      return await this.$Api.SaveDataSourceGroupData({
        id: this.config.dataSource,
        data,
      });
    }
  }

  unmounted() {
    this.sharedControl = null;

    while (this.twoWayBindingList.length) {
      this.twoWayBindingList.pop()();
      this.twoWayBindingList.splice(0, 1);
    }
    this.twoWayBindingList = null;

    delete this.config.GetSource;
    delete this.config.SaveSource;
    delete this.config.SharedData;

    this.data = null;
  }

  static GetDefaultConfig(): DataSourceGroupConfig {
    return {
      width: 200,
      height: 180,
      type: "DataSourceGroup",
      container: true,
      dataSource: "",
      sourceType: "Form",
      readonly: false,
    };
  }
}

export async function GetProps(config: DataSourceGroupConfig, instance: DataSourceGroupControl) {
  let { GetAllSqlFiles } = await DevelopmentModules.Load();
  let { baseProps } = await DevelopmentModules.Load();

  let sqlFiles = GetAllSqlFiles(virtualFileSystemStore.root);

  const fieldMap: ConfiguratorItem[] = [
    // 过滤掉 禁用 和 必填 属性
    ...baseProps.filter((p) => p.field != "disabled" && p.field != "required"),
    {
      name: "数据源",
      des: "该组绑定的数据源",
      type: DesignerDeclare.InputType.ElSelect,
      field: "dataSource",
      options: sqlFiles.map((s) => {
        return { label: s.name, value: s.id };
      }),
    },
  ];
  if (config.dataSource) {
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

export async function GetEvents() {
  let { baseEvents } = await DevelopmentModules.Load();
  const eventMap: ConfiguratorItem[] = [...baseEvents];
  return eventMap;
}
