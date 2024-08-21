import Control from "@/CoreUI/Designer/Control";
import { ControlDeclare } from "@/Types/ControlDeclare";
import { DesignerDeclare } from "@/Types/DesignerDeclare";
import { CacheFunction } from "@/Utils/Index";
import { ElInput, dayjs } from "element-plus";
import { Component } from "vue-facing-decorator";

// 仅在开发模式下导入的模块
const UtilControl = CacheFunction(() => import("@/Utils/Designer/Controls"));

type DateConfig = ControlDeclare.DateConfig;
type ConfiguratorItem = DesignerDeclare.ConfiguratorItem;

@Component
export default class DateControl extends Control {
  declare config: DateConfig;

  private originalValue: string = "";
  /**
   * 记录获取焦点时的值
   */
  RecordFocusValue() {
    this.originalValue = this.config.value;
    let input = this.$el.querySelector("input") as HTMLInputElement;
    input && input.select();
  }

  /**
   * 验证时间控件的值是否合法
   */
  Validate(value) {
    // 如果value为空，则不进行验证
    if (!value) {
      return;
    }

    // 验证日期格式是否正确，YYYY-MM-DD
    let valid = dayjs(value, "YYYY-MM-DD", true).isValid();
    // 验证日期格式是否正确，YYYY-M-D
    valid = valid || dayjs(value, "YYYY-M-D", true).isValid();
    // 验证日期格式是否正确，YYYY/MM/DD
    valid = valid || dayjs(value, "YYYY/MM/DD", true).isValid();
    // 验证日期格式是否正确，YYYY.MM.DD
    valid = valid || dayjs(value, "YYYY.MM.DD", true).isValid();
    // 验证日期格式是否正确，YYYYMMDD
    valid = valid || dayjs(value, "YYYYMMDD", true).isValid();
    // 验证日期格式是否正确，YYYY-MMDD
    valid = valid || dayjs(value, "YYYY-MMDD", true).isValid();

    // 如果日期格式不正确，则恢复原始值
    if (!valid) {
      this.config.value = this.originalValue;
      ElMessage({
        message: "请输入正确的日期格式",
        type: "error",
      });
    } else {
      this.config.value = dayjs(value).format("YYYY-MM-DD");
      this.originalValue = this.config.value;
    }
  }

  render() {
    return super.render(
      <ElInput
        class={css.date}
        v-model={this.config.value}
        placeholder={this.config.placeholder}
        disabled={this.disabled}
        onChange={this.Validate}
        onFocus={this.RecordFocusValue}
      >
        {{
          prefix: () => <font-awesome-icon icon={["far", "calendar-days"]} />,
        }}
      </ElInput>
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
      name: "值",
      des: "时间控件的值",
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
