import Control from "@/CoreUI/Designer/Control";
import { ControlDeclare } from "@/Types/ControlDeclare";
import { DesignerDeclare } from "@/Types/DesignerDeclare";
import { CacheFunction } from "@/Utils/Index";
import { ElButton } from "element-plus";
import { Component } from "vue-facing-decorator";

// 仅在开发模式下导入的模块
const UtilControl = CacheFunction(() => import("@/Utils/Designer/Controls"));

type ButtonConfig = ControlDeclare.ButtonConfig;
type ConfiguratorItem = DesignerDeclare.ConfiguratorItem;

@Component
export default class ButtonControl extends Control {
  declare config: ButtonConfig;

  render() {
    return super.render(
      <ElButton
        style={{ width: "100%", height: "100%", fontSize: this.config.fontSize + "px", color: this.config.color }}
        type={this.config.style as any}
        disabled={this.disabled}
        loading={this.config.loading}
      >
        {this.config.text}
      </ElButton>
    );
  }

  static GetDefaultConfig(): ButtonConfig {
    return {
      width: 70,
      height: 25,
      type: "Button",
      text: "按钮",
      fontSize: 14,
      style: "",
      color: "#000",
      loading: false,
    };
  }
}

export async function GetProps() {
  let { baseProps } = await UtilControl();

  const fieldMap: ConfiguratorItem[] = [
    ...baseProps.filter((p) => p.field != "bgColor"),
    { name: "文本", des: "按钮显示的文字", type: DesignerDeclare.InputType.ElInput, field: "text" },
    {
      name: "样式",
      des: "按钮的样式",
      type: DesignerDeclare.InputType.ElSelect,
      field: "style",
      options: [
        { label: "Primary", value: "primary" },
        { label: "Success", value: "success" },
        { label: "Info", value: "info" },
        { label: "Warning", value: "warning" },
        { label: "Danger", value: "danger" },
      ],
    },
    {
      name: "字体大小",
      des: "按钮显示字体的大小",
      type: DesignerDeclare.InputType.ElInputNumber,
      field: "fontSize",
      min: 8,
      max: 100,
    },
    { name: "加载中", des: "按钮加载中的状态", type: DesignerDeclare.InputType.ElSwitch, field: "loading" },
  ];
  return fieldMap;
}

export async function GetEvents() {
  let { baseEvents } = await UtilControl();
  const eventMap: ConfiguratorItem[] = [...baseEvents];
  return eventMap;
}
