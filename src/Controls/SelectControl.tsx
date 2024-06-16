import Control from "@/CoreUI/Designer/Control";
import { ControlDeclare } from "@/Types/ControlDeclare";
import { DesignerDeclare } from "@/Types/DesignerDeclare";
import { ElSelectV2 } from "element-plus";
import { Component } from "vue-facing-decorator";

// 仅在开发模式下导入的模块
const UtilControl = () => import("@/Utils/Designer/Controls");

type SelectConfig = ControlDeclare.SelectConfig;
type ConfiguratorItem = DesignerDeclare.ConfiguratorItem;

@Component
export default class SelectControl extends Control {
  declare config: SelectConfig;
  mounted() {
    this.config.GetSources = this.GetInnerSource;
  }

  Desuffix(field: string) {
    return field?.replace(/\[|\]/g, "");
  }

  async GetInnerSource(params) {
    let data = await super.GetInnerSource(params);
    this.config.options = data.map((m) => {
      return {
        label: m[this.Desuffix(this.config.displayField)],
        value: m[this.Desuffix(this.config.dataField)].toString(),
        m,
      };
    });
  }

  /**
   * 获取表格下拉框的列样式
   */
  GetTableSelectColumnsStyle() {
    return {
      display: "grid",
      "grid-template-columns": this.config.columns.map((col) => col.width + "px").join(" "),
    };
  }

  render() {
    return super.render(
      <ElSelectV2
        class={`${css.select} ${this.$Store.get.Designer.Debug ? css.eventNone : ""}`}
        v-model={this.config.value}
        clearable={this.config.clearable}
        placeholder={this.config.placeholder || " "}
        filterable={this.config.filterable}
        disabled={this.disabled}
        key={this.config.id}
        popperClass={["selectPopper", this.config.display == "table" ? "tableSelectPopper" : ""].join(" ")}
        options={this.config.options || []}
      >
        {{
          default: ({ item: { label, m } }) => {
            if (this.config.display == "table") {
              return (
                <span style={this.GetTableSelectColumnsStyle()}>
                  {this.config.columns.map((col) => {
                    return (
                      <span class={css.clip} title={m[col.field]}>
                        {m[col.field]}
                      </span>
                    );
                  })}
                </span>
              );
            }
            return label;
          },
          header:
            this.config.display == "table"
              ? () => {
                  return (
                    <div class={css.tableHeader} style={this.GetTableSelectColumnsStyle()}>
                      {this.config.columns.map((col) => (
                        <div>{col.title}</div>
                      ))}
                    </div>
                  );
                }
              : null,
        }}
      </ElSelectV2>
    );
  }

  static GetDefaultConfig(): SelectConfig {
    return {
      width: 130,
      height: 25,
      type: "Select",
      options: [],
      value: "",
      clearable: false,
      placeholder: "",
      filterable: false,
      display: "list",
      columns: [],
    };
  }
}

export async function GetProps(config: SelectConfig) {
  let { baseProps, AddDataSourceProps } = await UtilControl();

  const fieldMap: ConfiguratorItem[] = [
    ...baseProps,
    { name: "选项", des: "下拉框的选项", type: DesignerDeclare.InputType.Options, field: "options" },
    { name: "值", des: "下拉框的值", type: DesignerDeclare.InputType.ElInput, field: "value" },
    { name: "清空按钮", des: "是否可以清空选项", type: DesignerDeclare.InputType.ElSwitch, field: "clearable" },
    { name: "占位符", des: "下拉框的占位符", type: DesignerDeclare.InputType.ElInput, field: "placeholder" },
    { name: "筛选", des: "下拉框是否支持筛选", type: DesignerDeclare.InputType.ElSwitch, field: "filterable" },
    // 显示方式
    {
      name: "显示方式",
      des: "下拉框的显示方式",
      type: DesignerDeclare.InputType.ElSelect,
      field: "display",
      options: [
        { label: "列表", value: "list" },
        { label: "表格", value: "table" },
      ],
    },
    // 显示列配置
    {
      name: "显示列",
      des: "下拉框的显示列",
      type: DesignerDeclare.InputType.Columns,
      field: "columns",
      extra: {
        // 下拉框的列配置
        isSelectColumn: true,
      },
    },
  ];

  AddDataSourceProps(fieldMap, config);

  return fieldMap;
}

export async function GetEvents() {
  let { baseEvents } = await UtilControl();

  const eventMap: ConfiguratorItem[] = [...baseEvents];
  return eventMap;
}
