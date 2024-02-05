import Control from "@/CoreUI/Designer/Control";
import { ControlDeclare } from "@/Types/ControlDeclare";
import { DesignerDeclare } from "@/Types/DesignerDeclare";
import { baseProps, baseEvents } from "@/Utils/Designer/Controls";
import { Component } from "vue-facing-decorator";
import FormControl from "./FormControl";
import { WindowDeclare } from "@/Types/WindowDeclare";

type SubWindowConfig = ControlDeclare.SubWindowConfig;

type ConfiguratorItem = DesignerDeclare.ConfiguratorItem;

type WindowConfig = WindowDeclare.WindowConfig;

@Component
export default class SubWindowControl extends Control {
  declare config: SubWindowConfig;

  subWinConfig: WindowConfig = null;
  async created() {
    if (!this.$Store.get.Designer.Debug) {
      let res = await this.$Api.GetFormByClassName({ className: this.config.subWin });
      if (res.data) {
        this.subWinConfig = res.data;
        this.$nextTick(() => {
          this.config.form = (this.$refs.form as FormControl).instance as any;
        });
      }
    }
  }

  unmounted() {
    this.config.form = null;
    this.subWinConfig = null;
  }

  render() {
    return super.render(
      <div
        class={css.subWin + (this.$Store.get.Designer.Debug ? " " + css.debugViewBox : "")}
        style={{
          width: this.config.width + "px",
          height: this.config.height + "px",
          overflowX: "hidden",
        }}
      >
        {this.$Store.get.Designer.Debug ? (
          <>
            <span>控件名称：{this.config.name}</span>
            <br />
            <span>绑定窗体：{this.config.subWin}</span>
          </>
        ) : (
          this.subWinConfig && (
            <FormControl
              {...{
                config: this.subWinConfig.config,
                id: this.subWinConfig._id,
                key: this.config.id,
                compiledCode: this.subWinConfig.compiledCode,
                className: this.subWinConfig.className,
                ref: "form",
                autoRelease: true,
              }}
            ></FormControl>
          )
        )}
      </div>
    );
  }

  static GetDefaultConfig(): SubWindowConfig {
    return {
      width: 240,
      height: 240,
      type: "SubWindow",
      subWin: "",
      form: null,
    };
  }
}

export function GetProps(config: SubWindowConfig, instance: SubWindowControl) {
  const fieldMap: ConfiguratorItem[] = [
    ...baseProps.filter(
      (p) =>
        p.field != "readonly" &&
        p.field != "disabled" &&
        p.field != "required" &&
        p.field != "bgColor" &&
        p.field != "errorMessage" &&
        p.field != "color"
    ),
    {
      name: "窗体",
      des: "子窗体渲染的窗体",
      type: DesignerDeclare.InputType.ElSelect,
      field: "subWin",
      options: instance.$Store.get.Designer.SubWins.map((s) => {
        return { label: s.name, value: s.className };
      }),
    },
  ];
  return fieldMap;
}

export function GetEvents() {
  const eventMap: ConfiguratorItem[] = [...baseEvents];
  return eventMap;
}
