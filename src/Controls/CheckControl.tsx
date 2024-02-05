import Control from "@/CoreUI/Designer/Control";
import { ControlDeclare } from "@/Types/ControlDeclare";
import { DesignerDeclare } from "@/Types/DesignerDeclare";
import { baseProps, baseEvents } from "@/Utils/Designer/Controls";
import { ElCheckbox } from "element-plus";
import { Component } from "vue-facing-decorator";

type CheckConfig = ControlDeclare.CheckConfig;

type ConfiguratorItem = DesignerDeclare.ConfiguratorItem;

@Component
export default class CheckControl extends Control {
  declare config: CheckConfig;

  render() {
    return super.render(
      <ElCheckbox
        style={{ width: "100%", height: "100%" }}
        v-model={this.config.value}
        label={this.config.label}
        trueLabel={this.config.selectValue}
        falseLabel={this.config.unSelectValue}
        disabled={this.disabled}
      ></ElCheckbox>
    );
  }

  static GetDefaultConfig(): CheckConfig {
    let config = {
      width: 70,
      height: 25,
      type: "Check",
      label: "多选框",
      value: "false",
      selectValue: undefined,
      unSelectValue: undefined,
    };

    return config;
  }
}

export function GetProps(config: CheckConfig) {
  let selectValue = (config.selectValue || true).toString();
  let unSelectValue = (config.unSelectValue || true).toString();

  const fieldMap: ConfiguratorItem[] = [
    ...baseProps,
    { name: "标签", des: "多选按钮的显示标签", type: DesignerDeclare.InputType.ElInput, field: "label" },
    {
      name: "属性值",
      des: "多选按钮的属性值",
      type: DesignerDeclare.InputType.ElSelect,
      field: "value",
      options: [
        {
          label: selectValue,
          value: selectValue,
        },
        {
          label: unSelectValue,
          value: unSelectValue,
        },
      ],
    },
    { name: "选中值", des: "多选按钮选中的值", type: DesignerDeclare.InputType.ElInput, field: "selectValue" },
    { name: "未选中值", des: "多选按钮未选择的值", type: DesignerDeclare.InputType.ElInput, field: "unSelectValue" },
  ];
  return fieldMap;
}

export function GetEvents() {
  const eventMap: ConfiguratorItem[] = [...baseEvents];
  return eventMap;
}
