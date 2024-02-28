import Control from "@/CoreUI/Designer/Control";
import { ControlDeclare } from "@/Types/ControlDeclare";
import { DesignerDeclare } from "@/Types/DesignerDeclare";
import { baseProps, AddDataSourceProps, baseEvents } from "@/Utils/Designer/Controls";
import { ElSelectV2, ElTooltip } from "element-plus";
import { Component, Watch } from "vue-facing-decorator";

type SelectConfig = ControlDeclare.SelectConfig;
type ConfiguratorItem = DesignerDeclare.ConfiguratorItem;

@Component
export default class SelectControl extends Control {
  declare config: SelectConfig;

  colWidths = [];

  @Watch("config.options")
  optionsChange(nv: any[]) {
    if (!this.config.displayField?.length) return;
    this.config.displayField.forEach((f, i) => {
      let str = "";
      f = this.Desuffix(f);
      nv.forEach(({ m }) => {
        if (m[f]?.toString().length > str.length) {
          str = m[f]?.toString();
        }
      });
      this.colWidths[i] = this.CalculateVWWidthForText(str);
    });
  }

  async created() {
    this.$PaleData = {};
  }

  mounted() {
    this.config.GetSources = this.GetInnerSource;
  }

  unmounted() {
    this.$PaleData = null;
  }

  Vw2Px(vw: number): number {
    const screenWidth = window.innerWidth;
    const oneVwInPx = screenWidth / 100;
    const pxValue = vw * oneVwInPx;
    return pxValue;
  }

  CalculateVWWidthForText(text: string, fontSizeInPixels: number = 14): number {
    const stringLength = text.split("").reduce((length, char) => {
      if (char.charCodeAt(0) <= 127) {
        return length + 0.6;
      } else {
        return length + 1;
      }
    }, 0);
    const screenWidthInPixels = window.innerWidth;
    const textWidthInPixels = stringLength * fontSizeInPixels;
    const vwWidth = (textWidthInPixels / screenWidthInPixels) * 100;
    return vwWidth;
  }

  Desuffix(field: string) {
    return field?.replace(/\[|\]/g, "");
  }

  charWidth = 0.4;
  DisplayTable(fields: string[], item: any) {
    return (
      <div>
        {fields.map((f, i) => {
          f = this.Desuffix(f);

          let wide = this.colWidths[i] > 15;
          let width = "";

          if (fields.length == 1 && this.Vw2Px(this.colWidths[0]) < this.config.width)
            width = this.config.width - this.Vw2Px(1) + "px";
          else if (wide) width = "12vw";
          else width = this.colWidths[i] + "vw";

          if (wide)
            return (
              <ElTooltip content={item[f]} showAfter={500}>
                <span class={css.option + " " + css.wide} style={{ width }}>
                  {item[f] || ""}
                </span>
              </ElTooltip>
            );

          return (
            <span class={css.option} style={{ width }}>
              {item[f] || ""}
            </span>
          );
        })}
      </div>
    );
  }

  isRemoteData = false;
  async GetInnerSource(params) {
    this.isRemoteData = true;
    let data = await super.GetInnerSource(params);

    this.$PaleData.options = data.map((m) => {
      return {
        label: m[this.Desuffix(this.config.displayField[0])],
        value: m[this.Desuffix(this.config.dataField)].toString(),
        m,
      };
    });

    this.$forceUpdate();
    return data;
  }

  tiggerEnter = false;
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
        popper-class={this.isRemoteData ? css.customPopper : ""}
        options={this.$PaleData.options || []}
        onVisible-change={(v) => {
          setTimeout(() => {
            this.tiggerEnter = v;
          }, 300);
        }}
        {...{
          onKeyup: (e: KeyboardEvent) => {
            if (this.tiggerEnter && e.key === "Enter") {
              let ls = this.$PaleData.options;
              let target = e.target as HTMLInputElement;
              if (this.config.filterable)
                ls = this.$PaleData.options.filter((o) => o.label?.indexOf(target.value) >= 0);
              if (ls.length) {
                this.config.value = ls[0].value;
                e.currentTarget.dispatchEvent(new Event("click"));
              }
            }
          },
        }}
      >
        {({ item }) => {
          if (this.isRemoteData) {
            return this.DisplayTable(this.config.displayField, item.m);
          } else {
            return <span style={{ width: "100%" }}>{item.label}</span>;
          }
        }}
      </ElSelectV2>
    );
  }

  // DeclarationPatch() {
  //   if (!!this.config.dataSource) {
  //     let params = this.$Store.get.Designer.Sources.find((s) => s.name == this.config.dataSource).params || [];
  //     if (!params.length) return `{ GetSource() }`;
  //     else
  //       return `{ GetSource(data: {${params.map((p) => {
  //         return `${p.name}: ${p.type};`;
  //       })}}) }`;
  //   }
  //   return "";
  // }

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
    };
  }
}

export function GetProps(config: SelectConfig) {
  const fieldMap: ConfiguratorItem[] = [
    ...baseProps,
    { name: "选项", des: "下拉框的选项", type: DesignerDeclare.InputType.Options, field: "options" },
    { name: "属性值", des: "下拉框的属性值", type: DesignerDeclare.InputType.ElInput, field: "value" },
    { name: "清空按钮", des: "是否可以清空选项", type: DesignerDeclare.InputType.ElSwitch, field: "clearable" },
    { name: "占位符", des: "下拉框的占位符", type: DesignerDeclare.InputType.ElInput, field: "placeholder" },
    { name: "筛选", des: "下拉框是否支持筛选", type: DesignerDeclare.InputType.ElSwitch, field: "filterable" },
  ];

  AddDataSourceProps(fieldMap, config);

  return fieldMap;
}

export function GetEvents() {
  const eventMap: ConfiguratorItem[] = [...baseEvents];
  return eventMap;
}
