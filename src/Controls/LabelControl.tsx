import Control from "@/CoreUI/Designer/Control";
import { ControlDeclare } from "@/Types/ControlDeclare";
import { DesignerDeclare } from "@/Types/DesignerDeclare";
import { Component } from "vue-facing-decorator";

// 仅在开发模式下导入的模块
const UtilControl = () => import("@/Utils/Designer/Controls");

type LabelConfig = ControlDeclare.LabelConfig;
type ConfiguratorItem = DesignerDeclare.ConfiguratorItem;

@Component
export default class LabelControl extends Control {
  declare config: LabelConfig;

  get align() {
    let style = "display:flex;";

    switch (this.config.align) {
      case "right":
        return "text-align: right;";
      case "top":
        style += "align-items: start;";
        break;
      case "bottom":
        style += "align-items: end;";
        break;
      case "center":
        style += "align-items: center;justify-content: center;";
        break;
      default:
        return "";
    }
    return style;
  }

  render() {
    return super.render(
      <div style={`width: 100%;height: 100%;fontSize: ${this.config.fontSize}px;${this.align}`}>
        <span style={this.config.align == "center" ? "text-align:center" : ""}>{this.config.text}</span>
      </div>
    );
  }

  static GetDefaultConfig(): LabelConfig {
    return { width: 70, height: 18, type: "Label", text: "标签", fontSize: 14, align: "right" };
  }
}

export async function GetProps() {
  let { baseProps } = await UtilControl();

  const fieldMap: ConfiguratorItem[] = [
    ...baseProps.filter(
      (p) =>
        p.field != "readonly" &&
        p.field != "disabled" &&
        p.field != "required" &&
        p.field != "bgColor" &&
        p.field != "errorMessage"
    ),
    { name: "文本", des: "标签显示的文字", type: DesignerDeclare.InputType.ElInput, field: "text" },
    {
      name: "字体大小",
      des: "标签的字体大小",
      type: DesignerDeclare.InputType.ElInputNumber,
      field: "fontSize",
      min: 8,
      max: 100,
    },
    {
      name: "对齐方式",
      des: "标签的对齐方式",
      type: DesignerDeclare.InputType.ElSelect,
      field: "align",
      options: [
        { label: "左对齐", value: "left" },
        { label: "右对齐", value: "right" },
        { label: "顶对齐", value: "top" },
        { label: "底对齐", value: "bottom" },
        { label: "居中", value: "center" },
      ],
    },
  ];
  return fieldMap;
}

export async function GetEvents() {
  let { baseEvents } = await UtilControl();

  const eventMap: ConfiguratorItem[] = [...baseEvents];
  return eventMap;
}
