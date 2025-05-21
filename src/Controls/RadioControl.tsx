import Control from "@/CoreUI/Designer/Control";
import { ControlDeclare } from "@/Types/ControlDeclare";
import { DesignerDeclare } from "@/Types/DesignerDeclare";
import DevelopmentModules from "@/Utils/DevelopmentModules";
import { Cache } from "@/Utils";
import { ElRadio, ElRadioGroup } from "element-plus";
import { Component } from "vue-facing-decorator";

type RadioConfig = ControlDeclare.RadioConfig;
type ConfiguratorItem = DesignerDeclare.ConfiguratorItem;

@Component
export default class RadioControl extends Control {
  declare config: RadioConfig;

  get alignStyle() {
    let style = "position:absolute;";
    switch (this.config.align) {
      case "left":
        return style + "left:0;";
      case "right":
        return style + "right:0;";
      default:
        return "";
    }
  }

  render() {
    return super.render(
      <ElRadioGroup v-model={this.config.value} style={this.alignStyle} disabled={this.disabled}>
        {this.config.options.map((o) => (
          <ElRadio
            label={o.value}
            value={o.value}
            style={{ marginRight: this.config.optionRight + "px", color: "black" }}
          >
            {o.label}
          </ElRadio>
        ))}
      </ElRadioGroup>
    );
  }

  static GetDefaultConfig(): RadioConfig {
    return {
      width: 130,
      height: 29,
      type: "Radio",
      value: "",
      options: [{ label: "选项", value: "0" }],
      optionRight: 5,
      align: "",
    };
  }
}

export async function GetProps() {
  let { baseProps } = await DevelopmentModules.Load();

  const fieldMap: ConfiguratorItem[] = [
    ...baseProps,
    { name: "选项", des: "单选按钮的选项", type: DesignerDeclare.InputType.Options, field: "options" },
    { name: "值", des: "单选按钮的值", type: DesignerDeclare.InputType.ElInput, field: "value" },
    {
      name: "选项边距",
      des: "单选按钮的边距",
      type: DesignerDeclare.InputType.ElInputNumber,
      field: "optionRight",
      min: 0,
    },
    {
      name: "对齐方式",
      des: "单选按钮的对齐方式",
      type: DesignerDeclare.InputType.ElSelect,
      field: "align",
      options: [
        { label: "左对齐", value: "left" },
        { label: "右对齐", value: "right" },
        { label: "居中", value: "center" },
      ],
    },
  ];
  return fieldMap;
}

export async function GetEvents() {
  let { baseEvents } = await DevelopmentModules.Load();

  const eventMap: ConfiguratorItem[] = [...baseEvents];
  return eventMap;
}
