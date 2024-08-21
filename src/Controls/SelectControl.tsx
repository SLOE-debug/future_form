import Control from "@/CoreUI/Designer/Control";
import { ControlDeclare } from "@/Types/ControlDeclare";
import { DesignerDeclare } from "@/Types/DesignerDeclare";
import { CacheFunction } from "@/Utils/Index";
import { ElSelectV2 } from "element-plus";
import { toRaw } from "vue";
import { Component } from "vue-facing-decorator";

// 仅在开发模式下导入的模块
const UtilControl = CacheFunction(() => import("@/Utils/Designer/Controls"));

type SelectConfig = ControlDeclare.SelectConfig;
type ConfiguratorItem = DesignerDeclare.ConfiguratorItem;

@Component
export default class SelectControl extends Control {
  declare config: SelectConfig;

  // 定义脱离响应的options
  declare options: any[];

  async created() {
    this.options = [];
  }

  mounted() {
    this.config.GetSources = this.GetInnerSource;

    // 如果非数据源模式，直接设置options
    if (!this.config.dataSource) {
      this.SetOptions(this.config.options);
    }
  }

  unmounted() {
    delete this.config.GetSources;
  }

  Desuffix(field: string) {
    return field?.replace(/\[|\]/g, "");
  }

  async GetInnerSource(params) {
    let data = await super.GetInnerSource(params);

    this.SetOptions(
      data.map((m) => {
        return {
          label: m[this.Desuffix(this.config.displayField)],
          value: m[this.Desuffix(this.config.dataField)].toString(),
          m,
        };
      })
    );
  }

  /**
   * 设置 options
   */
  SetOptions(options) {
    this.options = options;
    this.$forceUpdate();
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

  // 行数
  rows = 1;
  // 是否已检测行数
  hasCheckRows = false;
  // 检测行数
  CheckRows(html: string) {
    if (this.hasCheckRows) return;
    // 检查 html 中有多少个br标签
    let brs = html.match(/<br\s?\/>/g);
    if (brs) {
      this.rows = brs.length + 1;
    }
  }

  render() {
    return super.render(
      <ElSelectV2
        class={`${css.select} ${this.$Store.get.Designer.Debug ? css.eventNone : ""}`}
        v-model={this.config.value}
        v-el-select-selectAndDelete={(e) => {
          if (this.config.clearable) this.config.value = "";
        }}
        placeholder={this.config.placeholder || " "}
        filterable={this.config.filterable}
        disabled={this.disabled}
        key={this.config.id}
        ref={this.config.id}
        popperClass={["selectPopper", this.config.display == "table" ? "tableSelectPopper" : ""].join(" ")}
        options={this.options || []}
        persistent={false}
        itemHeight={this.rows * 34}
      >
        {{
          default: (e) => {
            let {
              item: { label, m },
              index,
            } = e;

            if (this.config.display == "table") {
              return (
                <span style={this.GetTableSelectColumnsStyle()}>
                  {this.config.columns.map(({ field, isHtml }) => {
                    let value = m[field];
                    if (isHtml) {
                      if (index == 0) this.CheckRows(value);
                      else this.hasCheckRows = true;
                      return <span class={"clip"} title={value} v-html={value}></span>;
                    }

                    return (
                      <span class={"clip"} title={value}>
                        {value}
                      </span>
                    );
                  })}
                </span>
              );
            }
            return <span title={label}>{label}</span>;
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
      itemHeight: 34,
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

  config.columns = config.columns || [];

  const fieldMap: ConfiguratorItem[] = [
    ...baseProps,
    { name: "选项", des: "下拉框的选项", type: DesignerDeclare.InputType.Options, field: "options" },
    { name: "值", des: "下拉框的值", type: DesignerDeclare.InputType.ElInput, field: "value" },
    { name: "清空按钮", des: "是否可以清空选项", type: DesignerDeclare.InputType.ElSwitch, field: "clearable" },
    { name: "占位符", des: "下拉框的占位符", type: DesignerDeclare.InputType.ElInput, field: "placeholder" },
    { name: "筛选", des: "下拉框是否支持筛选", type: DesignerDeclare.InputType.ElSwitch, field: "filterable" },
    // 行高
    {
      name: "行高",
      des: "下拉框的行高",
      type: DesignerDeclare.InputType.ElInput,
      field: "itemHeight",
    },
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
