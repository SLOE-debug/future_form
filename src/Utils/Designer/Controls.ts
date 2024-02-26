import { ControlDeclare } from "@/Types/ControlDeclare";
import { DesignerDeclare } from "@/Types/DesignerDeclare";
import store from "@/Vuex/Store";
import { GetFields } from "./Designer";
import { editor } from "@/CoreUI/Editor/EditorPage";
import * as ts from "typescript";

type ControlConfig = ControlDeclare.ControlConfig;
type DataSourceControlConfig = ControlDeclare.DataSourceControlConfig;

type ConfiguratorItem = DesignerDeclare.ConfiguratorItem;

/**
 * 控件别名
 */
export const ControlAlias = {
  Button: "btn",
  Label: "lbl",
  Radio: "rdo",
  Input: "ipt",
  Check: "cck",
  Select: "sel",
  Date: "dte",
  Number: "num",
  DataSourceGroup: "dsg",
  Group: "gop",
  SubWindow: "swin",
  Tabs: "tab",
  Table: "tbl",
};

/**
 * 控件类型
 */
export const baseProps: ConfiguratorItem[] = [
  {
    name: "名称",
    des: "控件的唯一名称",
    type: DesignerDeclare.InputType.ElInput,
    field: "name",
  },
  {
    name: "宽度",
    des: "控件的宽度",
    type: DesignerDeclare.InputType.ElInputNumber,
    field: "width",
  },
  {
    name: "高度",
    des: "控件的高度",
    type: DesignerDeclare.InputType.ElInputNumber,
    field: "height",
  },
  {
    name: "透明度",
    des: "控件的透明度",
    type: DesignerDeclare.InputType.ElInputNumber,
    field: "transparent",
    max: 1,
    min: 0,
  },
  {
    name: "圆角",
    des: "控件边缘圆角",
    type: DesignerDeclare.InputType.ElInputNumber,
    field: "round",
    min: 0,
  },
  {
    name: "边框大小",
    des: "控件边框的大小",
    type: DesignerDeclare.InputType.ElInputNumber,
    field: "border",
    min: 0,
  },
  {
    name: "边框样式",
    des: "控件边框的样式",
    type: DesignerDeclare.InputType.ElSelect,
    field: "borderStyle",
    options: [
      { label: "Dotted", value: "dotted" },
      { label: "Dashed", value: "dashed" },
      { label: "Solid", value: "solid" },
      { label: "Double", value: "double" },
      { label: "Groove", value: "groove" },
      { label: "Ridge", value: "ridge" },
      { label: "Inset", value: "inset" },
      { label: "Outset", value: "outset" },
    ],
  },
  {
    name: "边框颜色",
    des: "控件边框的颜色",
    type: DesignerDeclare.InputType.ElColorPicker,
    field: "borderColor",
  },
  {
    name: "文字颜色",
    des: "控件文字的颜色",
    type: DesignerDeclare.InputType.ElColorPicker,
    field: "color",
  },
  {
    name: "背景颜色",
    des: "控件背景的颜色",
    type: DesignerDeclare.InputType.ElColorPicker,
    field: "bgColor",
  },
  {
    name: "显示",
    des: "控件是否显示",
    type: DesignerDeclare.InputType.ElSwitch,
    field: "visible",
  },
  {
    name: "受限",
    des: "控件是否受到DataSourceGroup控件的限制",
    type: DesignerDeclare.InputType.ElSwitch,
    field: "limit",
  },
  {
    name: "只读",
    des: "控件是否只读",
    type: DesignerDeclare.InputType.ElSwitch,
    field: "readonly",
  },
  {
    name: "禁用",
    des: "控件是否禁用",
    type: DesignerDeclare.InputType.ElSwitch,
    field: "disabled",
  },
  {
    name: "必填",
    des: "控件的必填校验",
    type: DesignerDeclare.InputType.ElSwitch,
    field: "required",
  },
  {
    name: "错误信息",
    des: "控件的必填时的报错信息",
    type: DesignerDeclare.InputType.ElInput,
    field: "errorMessage",
  },
];

/**
 * 控件事件
 */
export const baseEvents: ConfiguratorItem[] = [
  {
    name: "单击",
    des: "控件的单击事件",
    type: DesignerDeclare.InputType.ElSelect,
    field: "click",
    paramTypes: [["e", "MouseEvent"]],
  },
];

/**
 * 拍平窗体配置信息
 * @returns 窗体配置信息
 */
function GetFlatConfig() {
  const stack = [store.get.Designer.FormConfig];
  const configs: ControlConfig[] = [];

  while (stack.length > 0) {
    const current = stack.pop();

    if (current.$children && current.$children.length != 0) {
      current.$children.forEach((c) => {
        configs.push(c);
        stack.push(c);
      });
    }
  }
  return configs;
}

/**
 * 添加数据源属性
 * @param fieldMap 配置器的字段配置
 * @param config 控件配置
 */
export function AddDataSourceProps(fieldMap: ConfiguratorItem[], config: ControlConfig & DataSourceControlConfig) {
  let option = fieldMap.splice(
    fieldMap.findIndex((m) => m.name == "选项"),
    1
  );

  let map: ConfiguratorItem[] = [
    ...option,
    {
      name: "数据源",
      des: "下拉框的数据源",
      type: DesignerDeclare.InputType.ElSelect,
      field: "dataSource",
      options: store.get.Designer.Sources.map((m) => {
        return { label: m.name, value: m.name };
      }),
    },
  ];

  if (config.dataSource) {
    let source = store.get.Designer.Sources.find((m) => m.name == config.dataSource);
    let fields = GetFields(source.sql).map((m) => m.field) as string[];

    let paramsMap = source.params.map((m, i) => {
      return {
        name: m.name,
        des: "该数据源的参数",
        type: DesignerDeclare.InputType.ElSelect,
        field: "sourceArgs_" + m.name,
        options: GetFlatConfig().map((c) => {
          return { label: c.name, value: c.name };
        }),
      };
    });

    map = map.concat([
      {
        name: "显示字段",
        des: "下拉框的显示字段",
        type: DesignerDeclare.InputType.ElSelect,
        field: "displayField",
        options: fields.map((m) => {
          if (m.indexOf(".") >= 0) m = m.split(".")[1];
          return { label: m, value: m };
        }),
        multiple: true,
      },
      {
        name: "数据字段",
        des: "下拉框选择时选中的字段",
        type: DesignerDeclare.InputType.ElSelect,
        field: "dataField",
        options: fields.map((m) => {
          if (m.indexOf(".") >= 0) m = m.split(".")[1];
          return { label: m, value: m };
        }),
      },
      ...paramsMap,
    ]);
  }
  fieldMap.splice(4, 0, ...map);
}
