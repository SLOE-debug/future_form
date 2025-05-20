import { ControlDeclare } from "@/Types/ControlDeclare";
import { UtilsDeclare } from "@/Types/UtilsDeclare";
import { ComponentBase, Inject, Prop, Vue, Watch } from "vue-facing-decorator";
import FormControl from "@/Controls/FormControl";
import { DesignerDeclare } from "@/Types/DesignerDeclare";
import { BindEventContext, Cache, RegisterEvent, sourceArgsPrefix } from "@/Utils/Index";
import DataSourceGroupControl from "@/Controls/DataSourceGroupControl";
import { JSX } from "vue/jsx-runtime";
import { globalCache } from "@/Utils/Caches";
import { ElMessage } from "element-plus";
import DevelopmentModules from "@/Utils/DevelopmentModules";

// 仅在开发模式下导入的模块
// const UtilDesigner = CacheFunction(() => import("@/Utils/Designer/Designer"));
// const UtilVFS = CacheFunction(() => import("@/Utils/VirtualFileSystem/Index"));
// const CoreUndoStack = CacheFunction(() => import("@/Core/Designer/UndoStack/Stack"));

type ControlConfig = ControlDeclare.ControlConfig;
type DataSourceControlConfig = ControlDeclare.DataSourceControlConfig;
type TabsConfig = ControlDeclare.TabsConfig;

type EventHandlers = UtilsDeclare.EventHandlers;
type Coord = UtilsDeclare.Coord;

type ConfiguratorItem = DesignerDeclare.ConfiguratorItem;
type ContainerInfo = DesignerDeclare.ContainerInfo;

@ComponentBase
export class DataSourceControl extends Vue {
  @Prop
  config: ControlConfig & DataSourceControlConfig;
  declare parentFormControl: FormControl;
  GetParentFormControl(control: DataSourceControl = this): FormControl {
    if (!("config" in control)) return null;
    if (control?.config?.type == "Form") return control as FormControl;
    return this.GetParentFormControl(control.$parent as Control);
  }

  declare parentDataSourceControl: DataSourceGroupControl;
  GetParentDataSourceGroupControl(control: Control = this.$parent as Control): DataSourceGroupControl {
    if (!("config" in control)) return null;
    if (control?.config.type == "Form") return null;
    if (control?.config.type == "DataSourceGroup") return control as DataSourceGroupControl;
    return this.GetParentDataSourceGroupControl(control.$parent as Control);
  }

  declare events: EventHandlers;
  async created() {
    this.events = {};
    this.parentFormControl = this.GetParentFormControl();
    this.parentDataSourceControl = this.GetParentDataSourceGroupControl();

    if (this.$Store.get.Designer.Debug) return;

    if (this.config.dataSource) {
      await this.parentFormControl.createEventPromise;

      this.parentFormControl.$nextTick(() => {
        let sourceParams = {};
        for (let k in this.config) {
          if (k.startsWith(sourceArgsPrefix)) {
            let name = k.split(sourceArgsPrefix)[1];
            sourceParams[name] = this.parentFormControl.instance.$refs[this.config[k]].config.value;
          }
        }

        this.GetInnerSource(sourceParams);
      });
    }
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

  unmounted() {
    this.parentDataSourceControl = null;
    this.parentFormControl = null;
    for (const k in this.events) {
      this.events[k] = null;
    }
    this.events = null;
  }
}

/**
 * 克隆控件配置
 */
export function CloneControlConfig(config: ControlConfig, includeChildren: boolean = false): ControlConfig {
  const clonedConfig: ControlConfig = {
    width: 0,
    height: 0,
    type: "",
  };

  for (const key in config) {
    if (key == "instance") continue;
    if (!includeChildren && key == "$children") continue;

    const value = config[key];
    if (Array.isArray(value)) {
      clonedConfig[key] = value.map((item) => {
        if (typeof item === "object" && item !== null) {
          return CloneControlConfig(item, includeChildren);
        }
        return item;
      });
    } else if (typeof value === "object" && value !== null) {
      clonedConfig[key] = CloneControlConfig(value, includeChildren);
    } else {
      clonedConfig[key] = value;
    }
  }

  return clonedConfig;
}

@ComponentBase
export default class Control extends DataSourceControl {
  disableStack = false;
  get watchConfig() {
    return this.$Store.get.Designer.Debug && CloneControlConfig(this.config);
  }

  pushTimeOut: NodeJS.Timeout;
  declare watchOldValue: ControlConfig;
  @Watch("watchConfig")
  async ConfigChange(nv, ov) {
    // 是否非 debug 模式 或 ov 为空
    let isNotDebugOrOvIsNull = !this.$Store.get.Designer.Debug || !ov;
    // 是否非选中状态或者禁用堆栈
    let isUnSelectedOrDisableStack = !this.selected || this.disableStack;
    // 是否与大人物的父容器控件不一致
    let isNotSameParentContainer =
      this.config.fromContainer !== this.$Store.get.Designer.BigShotControl?.config?.fromContainer &&
      !!this.$Store.get.Designer.BigShotControl;

    // 是否是 新旧 fromContainer 不一致，且大人物为空
    let isModifyFromContainer =
      this.config.fromContainer != ov.fromContainer && !this.$Store.get.Designer.BigShotControl;

    // 如果符合上述条件，则不执行
    if (isNotDebugOrOvIsNull || isUnSelectedOrDisableStack || isNotSameParentContainer) {
      if (!isModifyFromContainer) {
        return;
      }
    }

    // 如果 watchOldValue 为空，则赋值为 ov 旧值，只记录当前控件首次更改时的旧值
    if (!this.watchOldValue) this.watchOldValue = ov;

    // 延迟 150ms 执行
    clearTimeout(this.pushTimeOut);
    this.pushTimeOut = setTimeout(() => {
      this.AddStack(nv, ov);
    }, 150);
  }

  /**
   * 向堆栈中添加当前变更
   */
  async AddStack(nv, ov) {
    let { FindControlsByKeyValue, CreateControlName, UpdateControlDeclareToDesignerCode } = await DevelopmentModules.Load();
    let { Stack } = await DevelopmentModules.Load();

    // 如果当前控件的名称与其他控件的名称冲突，则不执行
    if (
      nv.name != ov.name &&
      !!FindControlsByKeyValue(this.$Store.get.Designer.FormConfig, "name", nv.name, this.config.id)
    ) {
      this.disableStack = true;
      ElMessage({ message: `名称属性具有唯一性！\r\n与其他控件的名称冲突：${nv.name}！`, type: "error" });
      CreateControlName(this.config);

      this.$nextTick(() => {
        this.disableStack = false;
      });
    } else {
      // 如果是名称/数据源变更，都需要更新设计器的代码，以便在设计器的“后台”文件中使用最新的代码声明，前者是为了变量的引用统一，后者是为了数据源的获取参数统一
      if (nv.name != ov.name || nv.sourceName != ov.sourceName) {
        UpdateControlDeclareToDesignerCode(this.watchOldValue.name, nv);
      }

      // 添加到堆栈，记录变更
      await this.$Store.dispatch("Designer/AddStack", new Stack(this, nv, this.watchOldValue));
    }

    this.watchOldValue = null;
  }

  @Prop({ default: true })
  l: boolean;
  @Prop({ default: true })
  r: boolean;
  @Prop({ default: true })
  t: boolean;
  @Prop({ default: true })
  b: boolean;
  @Prop({ default: true })
  lt: boolean;
  @Prop({ default: true })
  rt: boolean;
  @Prop({ default: true })
  rb: boolean;
  @Prop({ default: true })
  lb: boolean;

  @Prop({ default: true })
  move: boolean;

  get disabled() {
    if (this.config.limit == true && this.parentDataSourceControl?.config?.limit == true) {
      return this.parentDataSourceControl?.config?.readonly || this.config.disabled;
    }
    return this.config.disabled;
  }

  selected = false;
  @Watch("selected")
  selectedChange(nv, ov) {
    if (nv) {
      RegisterEvent.call(window, this.winEventHandlers);
    } else {
      RegisterEvent.call(window, this.winEventHandlers, true);
    }
  }

  /**
   * 取消选中时触发的事件，在 Vuex 的 Designer 模块中调用
   */
  unSelected() {}

  get cursor() {
    if (!this.$Store.get.Designer.Debug) return "";
    return this.config.type != "Form" ? "pointer" : "auto";
  }

  declare winEventHandlers;
  mounted() {
    this.config.limit = true;

    if (this.$Store.get.Designer.Debug) {
      this.winEventHandlers = {
        mousemove: this.Adjust,
        mouseup: this.Cancel,
      };
      BindEventContext(this.winEventHandlers, this);

      this.$nextTick(() => {
        !this.selected && this.$Store.dispatch("Designer/SelectControl", [this]);
      });
    }
  }

  // 是否已卸载的标识
  isUnmounted = false;

  unmounted() {
    RegisterEvent.call(window, this.winEventHandlers, true);
    this.winEventHandlers = null;
    this.isUnmounted = true;
  }

  Pick(e: MouseEvent) {
    if (e.activity == false) return;

    let controls = [this] as Control[];
    let isForm = this.config.type == "Form";
    let otherControls = this.$Store.get.Designer.SelectedControls.filter((c) => c.config.type != "Form");
    if (e.shiftKey && !isForm) {
      controls.unshift(...otherControls);
    }
    if (e.altKey && !isForm) {
      let i = otherControls.findIndex((c) => c.config.id == this.config.id);
      if (i != -1) {
        otherControls.splice(i, 1);
        controls = otherControls;
      }
    }
    if (otherControls.length > 1) {
      if (this.selected) {
        let i = otherControls.findIndex((c) => c.config.id == this.config.id);
        if (i != -1) {
          otherControls.splice(i, 1);
          controls.unshift(...otherControls);
        }
      }
    }

    this.$Store.dispatch("Designer/SelectControl", controls);
  }

  offset: number[] = [];
  adjustType: ControlDeclare.AdjustType = null;
  startCoord: Coord;
  BeginAdjust(e: MouseEvent) {
    if (e.activity == false) return;
    e.activity = false;
    if (e.button != 0) return;

    let { offset, type } = (e.target as HTMLDivElement).dataset;

    if (type) this.adjustType = ControlDeclare.AdjustType.Move;
    if (offset) {
      this.adjustType = ControlDeclare.AdjustType.Resize;
      this.offset = offset.split(",").map((s) => parseInt(s));
    }

    this.startCoord = { x: e.clientX, y: e.clientY };
  }

  min = 10;
  Adjust(e: MouseEvent) {
    if (!this.startCoord) return;
    if (e.button != 0 || this.adjustType == null || !this.$Store.get.Designer.Debug) return;

    let { x: sx, y: sy } = this.startCoord || { x: 0, y: 0 };
    let x = e.clientX - sx;
    let y = e.clientY - sy;

    switch (this.adjustType) {
      case ControlDeclare.AdjustType.Resize:
        x = x * this.offset[0];
        y = y * this.offset[1];
        let l = Math.sign(this.offset[0]) == -1;
        let t = Math.sign(this.offset[1]) == -1;

        let w = this.config.width + x >= this.min;
        let h = this.config.height + y >= this.min;

        if (l && w) this.config.left = this.config.left + -x;
        if (t && h) this.config.top = this.config.top - y;

        this.config.width += w ? x : 0;
        this.config.height += h ? y : 0;

        if (this.bigShot) {
          this.$Store.get.Designer.SelectedControls.forEach((c) => {
            if (c.config.id != this.config.id && c.config.fromContainer == this.config.fromContainer) {
              c.config.width = c.config.width + (c.config.width + x >= this.min ? x : 0);
              c.config.height = c.config.height + (c.config.height + y >= this.min ? y : 0);

              if (l && w) c.config.left = c.config.left + -x;
              if (t && h) c.config.top = c.config.top + -y;
            }
          });
        }
        break;
      case ControlDeclare.AdjustType.Move:
        this.config.top += y;
        this.config.left += x;
        if (this.bigShot) {
          this.$Store.get.Designer.SelectedControls.forEach((c) => {
            if (c.config.id != this.config.id && c.config.fromContainer == this.config.fromContainer) {
              c.config.top = c.config.top + y;
              c.config.left = c.config.left + x;
            }
          });
        }
        break;
    }
    this.startCoord = { x: e.clientX, y: e.clientY };
    e.stopPropagation();
  }

  IsContainerVisible(con: ControlConfig, containers: ContainerInfo[]): boolean {
    let parentContainer = containers.find((c) => c.container.name == con.fromContainer)?.container as TabsConfig;
    if (parentContainer && con.fromTabId && parentContainer.value != con.fromTabId) return false;
    if (parentContainer && parentContainer.fromContainer) return this.IsContainerVisible(parentContainer, containers);
    return true;
  }

  NeedlessScrollTopHandler(config: ControlConfig): Coord {
    if (config.scrollTop && typeof config.scrollTop == "object") {
      switch (config.type) {
        case "Tabs":
          return { y: config.scrollTop[config.value] || 0, x: 0 };
      }
    }
    return { x: 0, y: 0 };
  }

  GetAllContainer(
    config: ControlConfig = this.$Store.get.Designer.FormConfig,
    parentPosition: Coord = { x: 0, y: 0 },
    parentScreenPosition: Coord = { x: 0, y: 0 }
  ) {
    let containers: ContainerInfo[] = [];

    let { x: px, y: py } = parentPosition;
    let { x: sx, y: sy } = parentScreenPosition;
    for (const c of config.$children || []) {
      if (c.container) {
        let { x: cx, y: cy } = this.NeedlessScrollTopHandler(c);
        sx += cx;
        sy += cy;

        let container = {
          globalTop: c.top + py,
          globalLeft: c.left + px,
          screenLeft: sx + cx,
          screenTop: sy + cy,
          container: c,
        };

        containers.push(container);
      }
      containers = containers.concat(this.GetAllContainer(c, { x: px + c.left, y: py + c.top }, { x: sx, y: sy }));
    }
    return containers;
  }

  async Cancel(e: MouseEvent) {
    // 判断当前 e.target 的 data-control 是不是为 true
    // let isControl = (e.target as HTMLElement).dataset.control == "true";

    if (e.button != 0 || !this.$Store.get.Designer.Debug) return;

    let { Stack, StackAction } = await DevelopmentModules.Load();

    if (
      this.adjustType == ControlDeclare.AdjustType.Move &&
      this.selected &&
      // !isControl &&
      this.config.type != "ToolStrip"
    ) {
      let rect = (this.$Store.get.Designer.$FormDesigner.$el as HTMLDivElement).getBoundingClientRect();
      let containers = this.GetAllContainer(this.$Store.get.Designer.FormConfig).reverse();
      let { clientX: x, clientY: y } = e;
      x = x - rect.left;
      y = y - rect.top;

      for (const c of this.$Store.get.Designer.SelectedContainerControls) {
        let oldContainer;
        if (c.config.fromContainer)
          oldContainer = containers.find((con) => con.container.name == c.config.fromContainer);
        let newContainer: ContainerInfo;
        for (const m of containers) {
          let { screenLeft, screenTop, globalLeft: l, globalTop: t, container } = m;
          let { width, height } = container;
          let lx = x + screenLeft;
          let ly = y + screenTop;

          if (
            lx >= l &&
            lx <= l + width &&
            ly >= t &&
            ly <= t + height &&
            container.name != c.config.name &&
            this.IsContainerVisible(container, containers)
          ) {
            newContainer = m;
            break;
          }
        }

        if (newContainer != oldContainer) {
          // 禁用 c 的堆栈
          c.disableStack = true;

          let oldConfig = this.watchOldValue;
          // 如果 oldConfig 为空，意味着最近已经添加过一次堆栈了，watchOldValue 已经被清空，则需要克隆当前的配置
          if (!oldConfig) {
            oldConfig = CloneControlConfig(c.config);
            // 为 oldConfig 添加 “最近一次的” 标记
            oldConfig.$last = true;
          }

          c.OutContainer(oldContainer);
          await c.JoinContainer(newContainer);

          // 添加到堆栈
          this.$Store.dispatch(
            "Designer/AddStack",
            new Stack(c, CloneControlConfig(c.config), oldConfig, StackAction.SwitchContainer)
          );
          this.watchOldValue = null;
        }
      }
    }

    this.startCoord = null;
    this.adjustType = null;
  }

  /**
   * 切换容器
   */
  async SwitchContainer(newContainerName) {
    let allContainer = this.GetAllContainer(this.$Store.get.Designer.FormConfig);

    let oldContainer = allContainer.find((c) => c.container.name == this.config.fromContainer);
    let newContainer = allContainer.find((c) => c.container.name == newContainerName);

    this.OutContainer(oldContainer);
    await this.JoinContainer(newContainer);
  }

  OutContainer(container: ContainerInfo) {
    if (!container) return;
    let { globalLeft, globalTop, screenLeft, screenTop } = container;
    this.config.left += globalLeft;
    this.config.top += globalTop - screenTop;
    delete this.config.fromContainer;
    delete this.config.fromTabId;
  }

  async JoinContainer(
    container: ContainerInfo = {
      globalLeft: 0,
      globalTop: 0,
      screenLeft: 0,
      screenTop: 0,
      container: {
        name: undefined,
        value: undefined,
        $children: this.$Store.get.Designer.FormConfig.$children,
      } as any,
    }
  ) {
    let { AddControlDeclareToDesignerCode } = await DevelopmentModules.Load();

    let {
      globalLeft,
      globalTop,
      screenLeft,
      screenTop,
      container: { name, value, $children },
    } = container;

    await this.Delete(false);
    this.config.left -= globalLeft;
    this.config.top -= globalTop - screenTop;
    // 如果要加入的容器是 Tab，则需要将 fromTabId 设置为当前选中的 Tab
    if (value) this.config.fromTabId = value;
    this.config.fromContainer = name;
    $children.push(this.config);

    AddControlDeclareToDesignerCode(this.config);
  }

  HelpPoint() {
    return (
      <>
        <div
          class={`${css.dot} ${css.l} ${css.t} ${css.nwse}`}
          onMousedown={this.BeginAdjust}
          data-offset={[-1, -1]}
          v-show={this.lt}
        ></div>
        <div
          class={`${css.dot} ${css.t} ${css.ns}`}
          onMousedown={this.BeginAdjust}
          data-offset={[0, -1]}
          v-show={this.t}
        ></div>
        <div
          class={`${css.dot} ${css.r} ${css.t} ${css.nesw}`}
          onMousedown={this.BeginAdjust}
          data-offset={[1, -1]}
          v-show={this.rt}
        ></div>
        <div
          class={`${css.dot} ${css.r} ${css.ew}`}
          onMousedown={this.BeginAdjust}
          data-offset={[1, 0]}
          v-show={this.r}
        ></div>
        <div
          class={`${css.dot} ${css.r} ${css.b} ${css.nwse}`}
          onMousedown={this.BeginAdjust}
          data-offset={[1, 1]}
          v-show={this.rb}
        ></div>
        <div
          class={`${css.dot} ${css.b} ${css.ns}`}
          onMousedown={this.BeginAdjust}
          data-offset={[0, 1]}
          v-show={this.b}
        ></div>
        <div
          class={`${css.dot} ${css.l} ${css.b} ${css.nesw}`}
          onMousedown={this.BeginAdjust}
          data-offset={[-1, 1]}
          v-show={this.lb}
        ></div>
        <div
          class={`${css.dot} ${css.l} ${css.ew}`}
          onMousedown={this.BeginAdjust}
          data-offset={[-1, 0]}
          v-show={this.l}
        ></div>
      </>
    );
  }

  async Delete(pushStack = true) {
    let { RemoveControlDeclareToDesignerCode } = await DevelopmentModules.Load();
    let { Stack, StackAction } = await DevelopmentModules.Load();

    // 如果当前窗体是 Form，则不允许删除
    if (this.config.type == "Form") {
      ElMessage({ message: "不允许删除窗体！", type: "error" });
      return;
    }

    let par = this.$parent as Control;
    let i = par.config.$children.findIndex((c) => c.id == this.config.id);
    if (pushStack)
      this.$Store.dispatch(
        "Designer/AddStack",
        new Stack(this, null, CloneControlConfig(this.config, true), StackAction.Delete)
      );

    RemoveControlDeclareToDesignerCode(this.config.name);

    this.$Store.dispatch("Designer/RenderControlConfigurator");

    return { children: par.config.$children, i, del: par.config.$children.splice(i, 1)[0] };
  }

  Clone(parent: ControlConfig = null) {
    if (this.$Store.get.Designer.SelectedControls.find((c) => c.config.name == this.config.fromContainer) && !parent)
      return;

    let conf = CloneControlConfig(this.config, true);
    conf.$children = conf.$children?.map((c) => (this.$refs[c.name] as Control).Clone(conf));
    return conf;
  }

  /**
   * 获取基础样式，用于在子类中重写，在 render 中覆盖
   */
  get baseStyle() {
    let style: any = {};

    // 如果非 debug 模式且 visible 为 false，则隐藏
    if (this.config.visible == false && !this.$Store.get.Designer.Debug) {
      style.display = "none";
    }
    return style;
  }

  /**
   * 获取子类 render 中 ele 的样式
   */
  get eleStyle() {
    let style: any = {
      // display: this.$Store.get.Designer.Debug || this.config.visible || this.config.type == "Form" ? "" : "none",
      pointerEvents: this.$Store.get.Designer.Debug ? "none" : "all",
    };

    if (this.config.transparent) style.opacity = this.config.transparent;

    if (this.config.round) style.borderRadius = this.config.round + "px";
    if (this.config.border) {
      style.borderWidth = this.config.border + "px";
      style.borderStyle = this.config.borderStyle;
      style.borderColor = this.config.borderColor || "auto";
    }
    if (this.config.bgColor) style.backgroundColor = this.config.bgColor;
    if (this.disabled) style.color = this.config.color || "black";

    return style;
  }

  /**大人物(是否是以此为依据对齐/移动/调整的控件) */
  bigShot = false;

  render(ele: JSX.Element) {
    return (
      <div
        class={`${css.control} ${this.bigShot ? css.bigshot : ""}`}
        data-type={"Move"}
        style={{
          top: this.config.top + "px",
          left: this.config.left + "px",
          width: this.config.width + "px",
          height: this.config.height + "px",
          cursor: this.cursor,
          ...this.baseStyle,
        }}
        {...{
          "data-name": this.config.name,
        }}
        onMousedown={(e) => {
          if (this.$Store.get.Designer.Debug) {
            this.Pick(e);
            this.BeginAdjust(e);
          }
          this.error = false;
        }}
        onClick={(e) => {
          this.events.onClick && this.events.onClick(this.config, e);
        }}
      >
        {<ele style={this.eleStyle} key={this.config.id}></ele>}
        {this.error && <div class={css.error}></div>}
        {this.$Store.get.Designer.Debug && this.selected && this.HelpPoint()}
      </div>
    );
  }

  error = false;
  Verify() {
    if (this.config.required && !this.config.value) {
      this.error = true;
      return false;
    }
    return true;
  }

  Focus(form: FormControl) {
    let rect = this.$el.getBoundingClientRect();
    let containerEle = form.$el.parentElement as HTMLDivElement;
    containerEle.scrollTo(0, rect.top);
  }

  static GetDefaultConfig(): ControlConfig {
    return {
      top: 0,
      left: 0,
      width: 20,
      height: 20,
      type: "*",
      transparent: 1,
      round: 0,
      border: 0,
      visible: true,
      readonly: false,
      limit: true,
      disabled: false,
      required: false,
      errorMessage: "",
      $children: [],
    };
  }
}

export function GetProps(config: ControlConfig, control: Control) {
  const fieldMap: ConfiguratorItem[] = [];
  if (control.parentDataSourceControl && control.parentDataSourceControl.config.sourceType == "Form") {
    fieldMap.push({
      name: "字段名",
      des: "控件的绑定字段名称",
      type: DesignerDeclare.InputType.ElInput,
      field: "sourceField",
    });
  }
  return fieldMap;
}
