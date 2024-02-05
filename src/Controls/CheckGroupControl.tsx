import Control from "@/CoreUI/Designer/Control";
import { ControlDeclare } from "@/Types/ControlDeclare";
import { DesignerDeclare } from "@/Types/DesignerDeclare";
import { baseProps, baseEvents } from "@/Utils/Designer/Controls";
import { ElCheckbox, ElCheckboxGroup } from "element-plus";
import { Component } from "vue-facing-decorator";

type CheckGroupConfig = ControlDeclare.CheckGroupConfig;
type ConfiguratorItem = DesignerDeclare.ConfiguratorItem;

@Component
export default class CheckGroupControl extends Control {
  declare config: CheckGroupConfig;

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
      <ElCheckboxGroup
        v-model={this.config.value}
        style={this.alignStyle}
        onChange={(e) => {
          console.log(e, this.config.value);
        }}
        disabled={this.config.disabled}
      >
        {this.config.options.map((o) => {
          return <ElCheckbox label={o.label} style={{ float: "left", marginRight: this.config.optionRight + "px" }} />;
        })}
      </ElCheckboxGroup>
    );
  }

  static GetDefaultConfig(): CheckGroupConfig {
    let config = {
      width: 70,
      height: 25,
      type: "CheckGroup",
      value: ["选项1"],
      options: [{ label: "选项1" }],
      optionRight: 5,
      align: "",
    };

    return config;
  }
}

export function GetProps() {
  const fieldMap: ConfiguratorItem[] = [
    ...baseProps,
    { name: "选项", des: "多选按钮的选项", type: DesignerDeclare.InputType.Options, field: "options" },
    { name: "属性值", des: "多选按钮的属性值", type: DesignerDeclare.InputType.ElInput, field: "value" },
    {
      name: "对齐方式",
      des: "多选按钮的对齐方式",
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

export function GetEvents() {
  const eventMap: ConfiguratorItem[] = [...baseEvents];
  return eventMap;
}
