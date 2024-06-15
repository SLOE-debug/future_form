import Control from "@/CoreUI/Designer/Control";
import { ControlDeclare } from "@/Types/ControlDeclare";
import { DesignerDeclare } from "@/Types/DesignerDeclare";
import { ElDatePicker } from "element-plus";
import { Component } from "vue-facing-decorator";

// 仅在开发模式下导入的模块
const UtilControl = () => import("@/Utils/Designer/Controls");

type DateConfig = ControlDeclare.DateConfig;
type ConfiguratorItem = DesignerDeclare.ConfiguratorItem;

@Component
export default class DateControl extends Control {
  declare config: DateConfig;

  render() {
    return super.render(
      <ElDatePicker
        class={`${css.date} ${this.$Store.get.Designer.Debug ? css.eventNone : ""}`}
        v-model={this.config.value}
        placeholder={this.config.placeholder}
        startPlaceholder={this.config.startPlaceholder || " "}
        endPlaceholder={this.config.endPlaceholder || " "}
        disabled={this.disabled}
      ></ElDatePicker>
    );
  }

  static GetDefaultConfig(): DateConfig {
    return {
      width: 130,
      height: 25,
      type: "Date",
      value: "",
      placeholder: "",
      startPlaceholder: "",
      endPlaceholder: "",
    };
  }
}

export async function GetProps() {
  let { baseProps } = await UtilControl();

  const fieldMap: ConfiguratorItem[] = [
    ...baseProps,
    {
      name: "属性值",
      des: "时间控件的属性值",
      type: DesignerDeclare.InputType.ElInput,
      field: "value",
    },
    {
      name: "占位符",
      des: "时间控件的输入占位符",
      type: DesignerDeclare.InputType.ElInput,
      field: "placeholder",
    },
    {
      name: "开始占位",
      des: "时间控件的开始日期输入占位符",
      type: DesignerDeclare.InputType.ElInput,
      field: "startPlaceholder",
    },
    {
      name: "结束占位",
      des: "时间控件的结束日期输入占位符",
      type: DesignerDeclare.InputType.ElInput,
      field: "endPlaceholder",
    },
  ];
  return fieldMap;
}

export async function GetEvents() {
  let { baseEvents } = await UtilControl();

  const eventMap: ConfiguratorItem[] = [...baseEvents];
  return eventMap;
}
