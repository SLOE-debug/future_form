import Control from "@/CoreUI/Designer/Control";
import WindowControlBar from "@/CoreUI/Designer/WindowControlBar";
import { ControlDeclare } from "@/Types/ControlDeclare";
import { DesignerDeclare } from "@/Types/DesignerDeclare";
import { UtilsDeclare } from "@/Types/UtilsDeclare";
import { baseProps, baseEvents } from "@/Utils/Designer/Controls";
import { FindControlsByType } from "@/Utils/Designer/Designer";
import { defineAsyncComponent } from "vue";
import { Component, Prop, Provide } from "vue-facing-decorator";
import DataSourceGroupControl from "./DataSourceGroupControl";

type ControlConfig = ControlDeclare.ControlConfig;

type ConfiguratorItem = DesignerDeclare.ConfiguratorItem;
type Coord = UtilsDeclare.Coord;

const AsyncSlideSelector = defineAsyncComponent(() => import("@/CoreUI/Designer/Components/SlideSelector"));

@Component
export default class FormControl extends Control {
  @Prop
  compiledCode: string;
  @Prop
  id: string;
  @Prop
  instanceId: string;
  @Prop({ default: false })
  preview: boolean;
  @Prop
  className: string;
  @Prop({ default: false })
  autoRelease: boolean;

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

  instance: {
    $Window: FormControl;
    $refs: any;
    Dispose: () => void;
  };

  @Provide
  rootConfig;

  dataSourceControls: DataSourceGroupControl[] = [];
  windowBar: WindowControlBar;
  createEventPromise: Promise<any>;
  async created() {
    this.rootConfig = this.config.$children;
    if (this.$parent.$options.__vfdConstructor == WindowControlBar) {
      this.windowBar = this.$parent as WindowControlBar;
      this.windowBar.form = this;
      this.windowBar.contentLoading = false;
    }

    this.$Store.get.Designer.Debug && !this.preview && this.$Store.dispatch("Designer/SetFormDesigner", this);

    if (!this.$Store.get.Designer.Debug || this.preview) {
      // this.instance = CreateInstance(
      //   this.compiledCode,
      //   this,
      //   this.className,
      //   WinGlobal,
      //   this.windowBar ? this.windowBar.baseToolkits : []
      // );
      // this.$Store.dispatch("SetWindowInstance", { id: this.instanceId, instance: this.instance });
    }
    if (this.events.onCreated) {
      this.createEventPromise = this.events.onCreated();
      await this.createEventPromise;
    }
  }

  mounted() {
    this.$nextTick(() => {
      this.events.onMounted && this.events.onMounted();
    });
  }

  unmounted() {
    super.unmounted();
    this.$Store.get.Designer.Debug && !this.preview && this.$Store.dispatch("Designer/SetFormDesigner", null);
    this.dataSourceControls = null;
    this.windowBar = null;
    this.autoRelease && this.instance?.Dispose();
    this.instance = null;
  }

  KeyDown(e: KeyboardEvent) {
    if (e.key == "Enter" && !this.$Store.get.Designer.Debug && this.config.enterBtn) {
      let btn = this.instance.$refs[this.config.enterBtn];
      if (btn) btn.events.onClick && btn.events.onClick(this, e);
    }
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

  static GetDefaultConfig(): ControlConfig {
    return {
      name: "PageForm",
      width: 700,
      height: 500,
      type: "Form",
      title: "默认标题",
      bgColor: "#F1F1F1",
      enterBtn: "",
      $children: [],
    };
  }
}

export function GetProps(config: ControlConfig) {
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
  ];
  return fieldMap;
}

export function GetEvents() {
  const eventMap: ConfiguratorItem[] = [
    ...baseEvents,
    {
      name: "创建",
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
    {
      name: "自定义按钮",
      des: "窗体标题栏的自定义按钮事件总线",
      type: DesignerDeclare.InputType.ElSelect,
      field: "barToolKitEventBus",
      paramTypes: [
        ["barKit", "BarKit"],
        ["type", "string"],
        ["e", "any"],
      ],
    },
  ];
  return eventMap;
}
