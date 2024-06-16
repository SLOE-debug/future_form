import Control from "@/CoreUI/Designer/Control";
import WindowControlBar from "@/CoreUI/Designer/WindowControlBar";
import { ControlDeclare } from "@/Types/ControlDeclare";
import { DesignerDeclare } from "@/Types/DesignerDeclare";
import { UtilsDeclare } from "@/Types/UtilsDeclare";
import { defineAsyncComponent } from "vue";
import { Component, Prop, Provide } from "vue-facing-decorator";
import DataSourceGroupControl from "./DataSourceGroupControl";
import store from "@/Vuex/Store";
import { BaseWindow } from "@/Utils/Designer/Form";
import SubWindowControl from "./SubWindowControl";

// 仅在开发模式下导入的模块
const UtilControl = () => import("@/Utils/Designer/Controls");
const UtilDesigner = () => import("@/Utils/Designer/Designer");

type FormConfig = ControlDeclare.FormConfig;

type ConfiguratorItem = DesignerDeclare.ConfiguratorItem;
type Coord = UtilsDeclare.Coord;

const AsyncSlideSelector = defineAsyncComponent(() => import("@/CoreUI/Designer/Components/SlideSelector"));

@Component
export default class FormControl extends Control {
  /**
   * 窗体实例ID
   */
  @Prop
  instanceId: string;

  slideStartCoord: Coord;
  SlideStart(e: MouseEvent) {
    if (e.button == 0 && e.activity != false && this.$Store.get.Designer.Debug)
      this.slideStartCoord = { x: e.clientX, y: e.clientY };
  }

  SlideEnd(e) {
    if (!e || !e.width || !e.height) return;

    let configs = this.$Store.get.Designer.FormConfig.$children.filter((c) => {
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

  /**
   * 通知 窗体控制条/子窗体 控件加载完成
   */
  NotifyControlLoaded() {
    let parent = this.$parent.$options.__vfdConstructor;
    if (parent == WindowControlBar) {
      let windowBar = this.$parent as WindowControlBar;
      windowBar.contentLoading = false;
    }
    if (parent == SubWindowControl) {
      let subWin = this.$parent as SubWindowControl;
      subWin.contentLoading = false;
    }
  }

  instance: BaseWindow;

  @Provide
  rootConfig;

  dataSourceControls: DataSourceGroupControl[] = [];
  createEventPromise: Promise<any>;
  async created() {
    this.rootConfig = this.config.$children;

    this.$Store.get.Designer.Debug &&
      !this.$Store.get.Designer.Preview &&
      (await this.$Store.dispatch("Designer/SetFormDesigner", this));

    if (!this.$Store.get.Designer.Debug || this.$Store.get.Designer.Preview) {
      let { instance, config } = this.$Store.get.Window.Windows[this.instanceId];
      instance.BindWindowEventAndControl(config, this);
      instance.$Window = this;

      this.instance = instance;
    }
    if (this.events.onCreated) {
      this.createEventPromise = this.events.onCreated();
      await this.createEventPromise;
    }

    this.NotifyControlLoaded();
  }

  mounted() {
    this.$nextTick(() => {
      this.events.onMounted && this.events.onMounted();
    });
  }

  beforeUnmount() {
    this.$Store.get.Designer.Debug &&
      !this.$Store.get.Designer.Preview &&
      this.$Store.dispatch("Designer/SetFormDesigner", null);
  }

  async unmounted() {
    super.unmounted();
    this.dataSourceControls = null;
    this.instance = null;
  }

  KeyDown(e: KeyboardEvent) {
    if (e.key == "Enter" && !this.$Store.get.Designer.Debug && this.config.enterBtn) {
      let btn = this.instance.$refs[this.config.enterBtn];
      if (btn) btn.events.onClick && btn.events.onClick(this, e);
    }
  }

  get baseStyle() {
    return {
      minWidth: "inherit",
      minHeight: "inherit",
    };
  }

  render() {
    return super.render(
      <div class={css.form} style={{ width: "100%", height: "100%" }} onMousedown={this.SlideStart}>
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
    );
  }

  static GetDefaultConfig(): FormConfig {
    return {
      name: store.get.VirtualFileSystem.CurrentFile.name.replace(".form.ts", ""),
      width: 700,
      height: 500,
      type: "Form",
      title: "默认标题",
      bgColor: "#F1F1F1",
      enterBtn: "",
      maximize: false,
      showMaximize: true,
      showClose: true,
      $children: [],
    };
  }
}

export async function GetProps(config: FormConfig) {
  let { baseProps } = await UtilControl();
  let { FindControlsByType } = await UtilDesigner();

  const fieldMap: ConfiguratorItem[] = [
    {
      name: "标题",
      des: "窗体的标题",
      type: DesignerDeclare.InputType.ElInput,
      field: "title",
    },
    ...baseProps.filter(
      (p) =>
        p.field != "name" &&
        p.field != "visible" &&
        p.field != "readonly" &&
        p.field != "disabled" &&
        p.field != "required"
    ),
    {
      name: "回车按钮",
      des: "用户按下回车时的按钮",
      type: DesignerDeclare.InputType.ElSelect,
      field: "enterBtn",
      options: FindControlsByType(config, "Button").map((m) => {
        return {
          label: m.name,
          value: m.name,
        };
      }),
    },
    // 是否最大化
    {
      name: "最大化",
      des: "窗体是否最大化",
      type: DesignerDeclare.InputType.ElSwitch,
      field: "maximize",
    },
    // 是否显示最大化按钮
    {
      name: "显示最大化按钮",
      des: "窗体是否显示最大化按钮",
      type: DesignerDeclare.InputType.ElSwitch,
      field: "showMaximize",
    },
    // 是否显示关闭按钮
    {
      name: "显示关闭按钮",
      des: "窗体是否显示关闭按钮",
      type: DesignerDeclare.InputType.ElSwitch,
      field: "showClose",
    },
    // 自定义的渲染顺序
    {
      name: "自定义渲染顺序",
      des: "窗体的自定义渲染顺序，-1永远在最底层，0永远在最顶层",
      type: DesignerDeclare.InputType.ElInputNumber,
      field: "customRenderIndex",
      max: Infinity,
      min: -Infinity,
      precision: 0,
    },
  ];
  return fieldMap;
}

export async function GetEvents() {
  let { baseEvents } = await UtilControl();

  const eventMap: ConfiguratorItem[] = [
    ...baseEvents,
    {
      name: "开始创建",
      des: "窗体的开始创建事件",
      type: DesignerDeclare.InputType.ElSelect,
      field: "created",
    },
    {
      name: "创建完成",
      des: "窗体的创建完成事件",
      type: DesignerDeclare.InputType.ElSelect,
      field: "mounted",
    },
    // 获取焦点
    {
      name: "获取焦点",
      des: "窗体获取焦点事件",
      type: DesignerDeclare.InputType.ElSelect,
      field: "focus",
    },
  ];
  return eventMap;
}
