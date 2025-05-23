import { ControlDeclare, UtilsDeclare } from "@/Types";
import { ComponentBase, Prop, Vue } from "vue-facing-decorator";
import type FormControl from "@/Controls/FormControl";
import { EventManager } from "@/Utils";
import { JSX } from "vue/jsx-runtime";
import { ElMessage } from "element-plus";
import DevelopmentModules from "@/Utils/DevelopmentModules";
import { GetParentDataSourceGroupControl, GetParentFormControl } from "@/Utils/Designer/Controls";
import DragHandler, { DraggableConfig } from "@/Utils/Designer/DragHandler";
import ContainerManager from "@/Utils/Designer/ContainerManager";
import { onUnmounted, watch } from "vue";
import { IsControlNameExists } from "@/Utils/Designer/Designer";
import { useDesignerStore } from "@/Stores/designerStore";

type ControlConfig = ControlDeclare.ControlConfig;
type DataSourceControlConfig = ControlDeclare.DataSourceControlConfig;

type EventHandlers = UtilsDeclare.EventHandlers;

/**
 * 深度克隆对象，排除指定的属性
 * @param obj 要克隆的对象
 * @param excludeKeys 要排除的属性名数组
 * @returns 克隆后的对象
 */
export function DeepClone<T>(obj: T, excludeKeys: string[] = ["instance", "$children"]): T {
  // 处理基本类型、null和undefined
  if (obj === null || obj === undefined || typeof obj !== "object") {
    return obj;
  }

  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map((item) => DeepClone(item, excludeKeys)) as unknown as T;
  }

  // 处理日期对象
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  // 创建新对象
  const result = {} as T;

  // 复制所有非排除的属性
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && !excludeKeys.includes(key)) {
      result[key as keyof T] = DeepClone(obj[key as keyof T], excludeKeys);
    }
  }

  return result;
}

@ComponentBase
export default class Control extends Vue {
  @Prop
  config: ControlConfig & DataSourceControlConfig;

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

  get parentFormControl() {
    return GetParentFormControl(this);
  }

  get parentDataSourceControl() {
    return GetParentDataSourceGroupControl(this);
  }

  get disabled() {
    const { config } = this;
    const parentDS = this.parentDataSourceControl;

    if (config?.limit && parentDS?.config?.limit) {
      return parentDS.config.readonly || config.disabled;
    }

    return config.disabled;
  }

  get designerStore() {
    return useDesignerStore();
  }

  // 当前控件是否被选中
  selected = false;
  // 是否禁用设计模式下的堆栈
  disableStack = false;

  // 生产或预览模式
  get isProductionOrPreview() {
    return !this.designerStore.debug || this.designerStore.preview;
  }
  // 设计模式且非预览模式
  get isDesignerMode() {
    return this.designerStore.debug && !this.designerStore.preview;
  }

  /**
   * 取消选中时触发的事件，在 Vuex 的 Designer 模块中调用
   */
  unSelected() {}

  get cursorStyle() {
    if (!this.designerStore.debug) return "";
    return this.config.type != "Form" ? "pointer" : "auto";
  }

  // 拖拽处理类
  dragHandler: DragHandler;
  // 空间容器关系管理类
  containerManager: ContainerManager;
  // 事件管理器
  eventManager: EventManager = new EventManager();

  // 设计器模式下控件的功能
  setupDesignerMode() {
    this.dragHandler = new DragHandler(this.config as DraggableConfig, {
      bigShot: () => this.bigShot,
      handles: {
        lt: this.lt,
        t: this.t,
        rt: this.rt,
        r: this.r,
        rb: this.rb,
        b: this.b,
        lb: this.lb,
        l: this.l,
      },
    });
    this.containerManager = new ContainerManager(this);
    this.eventManager.add(
      window,
      "mouseup",
      (e: MouseEvent) => {
        this.containerManager.HandleContainerOnMouseUp(e);
      },
      this
    );
    this.eventManager.addBatch(
      window,
      {
        mousemove: this.dragHandler.Adjust,
        mouseup: this.dragHandler.Cancel,
      },
      this.dragHandler
    );

    // 监听配置的变化
    const configWatch = watch(
      () => DeepClone(this.config),
      (nv, ov) => {
        // 如果非 debug 模式 或 ov 为空
        if (!this.designerStore.debug || !ov) return;
        // 是否非选中状态或者禁用堆栈
        if (!this.selected || this.disableStack) return;
        this.handleConfigChange(nv, ov);
      },
      { deep: true }
    );
    onUnmounted(() => {
      configWatch();
    });
  }

  // 延迟添加到堆栈的 Timeout
  pushStackTimeout: NodeJS.Timeout;
  // 记录 config 的初始值
  // 为了解决用户快速操作控件时，最终被执行的 pushStackTimeout 的 ov 将是最近一次的 config，而不是用户最初操作时的 config
  originalConfig: ControlConfig;

  /**
   * 处理配置的变化
   * @param nv 新的配置
   * @param ov 旧的配置
   */
  async handleConfigChange(nv: ControlConfig, ov: ControlConfig) {
    // // 是否与大人物的父容器控件不一致
    // const { fromContainer } = this.config;
    // const { fromContainer: ovFromContainer } = ov;
    // const bigShotControl = this.$Store.get.Designer.BigShotControl;
    // const { fromContainer: bigShotFromContainer } = bigShotControl?.config || {};
    // const isNotSameParentContainer = fromContainer !== bigShotFromContainer && !!bigShotControl;
    // // 是否是 新旧 fromContainer 不一致，且大人物为空
    // const isModifyFromContainer = fromContainer != ovFromContainer && !bigShotControl;
    // console.log("是否与大人物的父容器控件不一致", isNotSameParentContainer);
    // console.log("是否是 新旧 fromContainer 不一致，且大人物为空", isModifyFromContainer);
    // if (isNotSameParentContainer && !isModifyFromContainer) {
    //   console.log(nv, ov);
    // }

    // 如果存在名称冲突，则不执行
    if (await this.handleNameConflict(nv, ov)) return;

    const { Stack } = await DevelopmentModules.Load();

    // 保存当前控件的初始值
    if (!this.originalConfig) {
      this.originalConfig = ov;
    }

    // 先清除之前的延迟添加到堆栈的 Timeout
    clearTimeout(this.pushStackTimeout);
    // 延迟 150ms 执行
    this.pushStackTimeout = setTimeout(() => {
      // logDiff(nv, this.originalConfig);
      this.designerStore.AddStack(new Stack(this, nv, this.originalConfig));
      // 还原初始值
      this.originalConfig = null;
    }, 150);
  }

  /**
   * 处理名称冲突
   * @param nv 新的配置
   * @param ov 旧的配置
   * @returns
   */
  async handleNameConflict(nv: ControlConfig, ov: ControlConfig) {
    // 如果是 name 的修改，且名称冲突，则不执行
    if (nv.name != ov.name && IsControlNameExists(nv)) {
      // 禁用堆栈
      this.disableStack = true;
      // 弹出提示
      ElMessage({ message: `名称属性具有唯一性！\r\n与其他控件的名称冲突：${nv.name}！名称已被还原！`, type: "error" });
      // 还原名称
      this.config.name = ov.name;
      this.$nextTick(() => {
        // 恢复堆栈
        this.disableStack = false;
      });
      return true;
    }
    return false;
  }

  events: EventHandlers = {};
  mounted() {
    this.config.limit = true;
    if (this.isDesignerMode) this.setupDesignerMode();
  }

  // 是否已卸载的标识
  isUnmounted = false;

  unmounted() {
    this.eventManager?.removeAll();
    this.eventManager = null;
    this.containerManager = null;
    this.isUnmounted = true;
    this.events = {};
  }

  Pick(e: MouseEvent) {
    if (e.activity == false) return;

    let controls = [this] as Control[];
    let isForm = this.config.type == "Form";
    let otherControls = this.designerStore.selectedControls.filter((c) => c.config.type != "Form");
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

    this.designerStore.SelectControl(controls);
  }

  async Delete(pushStack = true) {
    const { Stack, StackAction, RemoveControlDeclareToDesignerCode } = await DevelopmentModules.Load();
    // 如果当前窗体是 Form，则不允许删除
    if (this.config.type == "Form") {
      ElMessage({ message: "不允许删除窗体！", type: "error" });
      return;
    }
    // 获取父控件
    const parentControl = this.$parent as Control;
    // 获取当前控件在父控件的子控件数组中的索引
    const index = parentControl.config.$children.findIndex((c) => c.id == this.config.id);
    // 如果 pushStack 为 true，则将当前控件添加到堆栈
    if (pushStack) {
      this.designerStore.AddStack(
        new Stack(parentControl, null, DeepClone(this.config, ["instance"]), StackAction.Delete)
      );
    }
    // 移除控件的声明
    RemoveControlDeclareToDesignerCode(this.config.name);
    // 渲染控件配置器
    this.designerStore.RenderControlConfigurator();
    // 删除控件
    let removedControl = parentControl.config.$children.splice(index, 1)[0];
    return { children: parentControl.config.$children, index, del: removedControl };
  }

  Clone(parent: ControlConfig = null) {
    if (this.designerStore.selectedControls.find((c) => c.config.name == this.config.fromContainer) && !parent) return;

    let conf = DeepClone(this.config, []);
    conf.$children = conf.$children?.map((c) => (this.$refs[c.name] as Control).Clone(conf));
    return conf;
  }

  /**
   * 获取基础样式，用于在子类中重写，在 render 中覆盖
   */
  get baseStyle() {
    let style: any = {};

    // 如果非 debug 模式且 visible 为 false，则隐藏
    if (this.config.visible == false && !this.designerStore.debug) {
      style.display = "none";
    }
    return style;
  }

  /**
   * 获取子类 render 中 ele 的样式
   */
  get eleStyle() {
    let style: any = {
      // display: this.designerStore.debug || this.config.visible || this.config.type == "Form" ? "" : "none",
      pointerEvents: this.designerStore.debug ? "none" : "all",
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
        class={`${css.control}`}
        data-type={"Move"}
        style={{
          top: this.config.top + "px",
          left: this.config.left + "px",
          width: this.config.width + "px",
          height: this.config.height + "px",
          cursor: this.cursorStyle,
          ...this.baseStyle,
        }}
        {...{
          "data-name": this.config.name,
        }}
        onMousedown={(e) => {
          if (this.designerStore.debug) {
            this.Pick(e);
            this.dragHandler.BeginAdjust(e);
          }
          this.error = false;
        }}
        onClick={(e) => {
          this.events.onClick && this.events.onClick(this.config, e);
        }}
      >
        {<ele style={this.eleStyle} key={this.config.id}></ele>}
        {this.error && <div class={css.error}></div>}
        {this.designerStore.debug && this.selected && this.dragHandler.HelpPoint()}
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
}
