import Control from "@/CoreUI/Designer/Control";
import { ControlDeclare} from "@/Types/ControlDeclare";
import { DesignerDeclare } from "@/Types/DesignerDeclare";
import { baseProps, baseEvents } from "@/Utils/Designer/Controls";
import { ElInputNumber } from "element-plus";
import { Component } from "vue-facing-decorator";

type NumberConfig = ControlDeclare.NumberConfig;
type ConfiguratorItem = DesignerDeclare.ConfiguratorItem;

@Component
export default class NumberControl extends Control {
  declare config: NumberConfig;

  render() {
    return super.render(
      <ElInputNumber
        v-model={this.config.value}
        controls-position={this.config.controlsAlign}
        class={css.number}
        size="small"
        disabled={this.disabled}
      ></ElInputNumber>
    );
  }

  static GetDefaultConfig(): NumberConfig {
    return {
      width: 130,
      height: 25,
      type: "Number",
      value: 0,
      controlsAlign: "",
    };
  }
}

export function GetProps() {
  const fieldMap: ConfiguratorItem[] = [
    ...baseProps,
    {
      name: "属性值",
      des: "数字控件的属性值",
      type: DesignerDeclare.InputType.ElInputNumber,
      field: "value",
      min: -Infinity,
    },
    {
      name: "按钮位置",
      des: "数字控件的控制按钮位置",
      type: DesignerDeclare.InputType.ElSelect,
      options: [
        { label: "默认", value: "" },
        { label: "右侧", value: "right" },
      ],
      field: "controlsAlign",
    },
  ];
  return fieldMap;
}

export function GetEvents() {
  const eventMap: ConfiguratorItem[] = [...baseEvents];
  return eventMap;
}
