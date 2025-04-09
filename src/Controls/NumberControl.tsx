import Control from "@/CoreUI/Designer/Control";
import { ControlDeclare } from "@/Types/ControlDeclare";
import { DesignerDeclare } from "@/Types/DesignerDeclare";
import { CacheFunction } from "@/Utils/Index";
import { ElInputNumber } from "element-plus";
import { Component } from "vue-facing-decorator";

// 仅在开发模式下导入的模块
const UtilControl = CacheFunction(() => import("@/Utils/Designer/Controls"));

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
        class="w-full h-full [&>span]:!w-[20%]"
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

export async function GetProps() {
  let { baseProps } = await UtilControl();

  const fieldMap: ConfiguratorItem[] = [
    ...baseProps,
    {
      name: "值",
      des: "数字控件的值",
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

export async function GetEvents() {
  let { baseEvents } = await UtilControl();

  const eventMap: ConfiguratorItem[] = [...baseEvents];
  return eventMap;
}
