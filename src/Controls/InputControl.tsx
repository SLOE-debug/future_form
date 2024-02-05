import Control from "@/CoreUI/Designer/Control";
import { ControlDeclare } from "@/Types/ControlDeclare";
import { DesignerDeclare } from "@/Types/DesignerDeclare";
import { baseProps, baseEvents } from "@/Utils/Designer/Controls";
import { ElInput } from "element-plus";
import { Component } from "vue-facing-decorator";

type InputConfig = ControlDeclare.InputConfig;
type ConfiguratorItem = DesignerDeclare.ConfiguratorItem;

@Component
export default class InputControl extends Control {
  declare config: InputConfig;

  render() {
    return super.render(
      <ElInput
        style={{ width: "100%", height: "100%", overflow: "hidden" }}
        v-model={this.config.value}
        placeholder={this.config.placeholder}
        clearable={this.config.clearable}
        inputStyle={{
          textIndent: (this.config.textarea ? 0 : this.config.textIndent) + "px",
        }}
        class={css.input}
        formatter={(v: string) => {
          if (this.config.formatter) {
            let regex = new RegExp(this.config.formatter, "g");
            return v.replace(regex, this.config.formatterReplace);
          }
          return v;
        }}
        type={this.config.textarea ? "textarea" : "text"}
        resize="none"
        disabled={this.disabled}
        {...{
          maxlength: this.config.maxlength,
        }}
      ></ElInput>
    );
  }

  static GetDefaultConfig(): InputConfig {
    return {
      width: 130,
      height: 25,
      type: "Input",
      value: "",
      placeholder: "",
      clearable: false,
      textIndent: 5,
      textarea: false,
      formatter: "",
      formatterReplace: "",
      maxlength: Infinity,
    };
  }
}

export function GetProps(config: InputConfig) {
  const fieldMap: ConfiguratorItem[] = [
    ...baseProps,
    { name: "属性值", des: "输入框的属性值", type: DesignerDeclare.InputType.ElInput, field: "value" },
    { name: "占位符", des: "输入框的占位符", type: DesignerDeclare.InputType.ElInput, field: "placeholder" },
    { name: "最大长度", des: "输入框的最大长度", type: DesignerDeclare.InputType.ElInputNumber, field: "maxlength" },
  ];
  if (config.textarea) {
    fieldMap.push(
      ...[
        { name: "清除按钮", des: "输入框的一键清除按钮", type: DesignerDeclare.InputType.ElSwitch, field: "clearable" },
        {
          name: "首字缩进",
          des: "输入框的首字缩进单位",
          type: DesignerDeclare.InputType.ElInputNumber,
          field: "textIndent",
          min: 0,
        },
      ]
    );
  }

  fieldMap.push(
    ...[
      { name: "文本域", des: "多行文本输入框", type: DesignerDeclare.InputType.ElSwitch, field: "textarea" },
      {
        name: "格式化",
        des: "输入框输入时的格式化正则",
        type: DesignerDeclare.InputType.ElInput,
        field: "formatter",
      },
      {
        name: "替换正则",
        des: "输入框输入时格式化正则的替换正则",
        type: DesignerDeclare.InputType.ElInput,
        field: "formatterReplace",
      },
    ]
  );

  return fieldMap;
}

export function GetEvents() {
  const eventMap: ConfiguratorItem[] = [...baseEvents];
  return eventMap;
}
