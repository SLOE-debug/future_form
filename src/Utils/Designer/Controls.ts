import { ControlDeclare, DesignerDeclare } from "@/Types";
import { GetFields } from "./Designer";
import { GetAllSqlFiles } from "../VirtualFileSystem/Index";
import { dataSourceParamPrefix } from "..";
import type Control from "@/CoreUI/Designer/Control";
import type FormControl from "@/Controls/FormControl";
import { useDesignerStore } from "@/Stores/DesignerStore";
import { useVirtualFileSystemStore } from "@/Stores/VirtualFileSystemStore";

const designerStore = useDesignerStore();
const virtualFileSystemStore = useVirtualFileSystemStore();

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
  ToolStrip: "tsp",
};

/**
 * 控件类型
 */
export const baseProps: ConfiguratorItem[] = [
  // top
  {
    name: "上边距",
    des: "控件上边距",
    type: DesignerDeclare.InputType.ElInputNumber,
    field: "top",
    min: -Infinity,
    max: Infinity,
  },
  // left
  {
    name: "左边距",
    des: "控件左边距",
    type: DesignerDeclare.InputType.ElInputNumber,
    field: "left",
    min: -Infinity,
    max: Infinity,
  },
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
    des: "控件是否受到数据源控件的只读限制",
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
  const stack = [designerStore.formConfig];
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
  let sqlFiles = GetAllSqlFiles(virtualFileSystemStore.root);
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
      options: sqlFiles.map((s) => {
        return { label: s.name, value: s.id };
      }),
    },
  ];

  if (config.dataSource) {
    let source = sqlFiles.find((m) => m.id == config.dataSource);
    let fields = GetFields(source.content).map((m) => m.field) as string[];
    let params = source.extraData.params;

    let paramsMap = params.map((m, i) => {
      return {
        name: m.name,
        des: "该数据源的参数",
        type: DesignerDeclare.InputType.ElSelect,
        field: dataSourceParamPrefix + m.name,
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

/**
 * 获取当前 control 父窗体控件
 */
export function GetParentFormControl(control: Control): FormControl {
  let current = control;

  while (current) {
    current = GetParentControl(current);
    if (!current) return null;
    if (current.config?.type === "Form") return current as any;
  }

  return null;
}

/**
 * 获取当前 control 父数据源控件
 */
export function GetParentDataSourceGroupControl(control: Control): any {
  let current = control;

  while (current) {
    // 使用 GetParentControl 获取下一个父控件
    current = GetParentControl(current);
    if (!current) return null;
    // 如果遇到表单控件，停止查找
    if (current.config?.type === "Form") return null;
    // 检查是否是数据源控件
    if (current.config?.type === "DataSourceGroup") return current;
  }

  return null;
}

/**
 * 获取当前 control 的父控件（深度判断是否源自 Control.tsx）
 */
export function GetParentControl(control: Control): Control | null {
  let current: any = control.$parent;

  while (current) {
    // 跳过异步组件包装器
    if (current.$options?.name === "AsyncComponentWrapper") {
      current = current.$parent;
      continue;
    }

    // 检查是否有 config 属性
    if (!("config" in current)) {
      current = current.$parent;
      continue;
    }

    // 检查是否有 Control 的特征方法/属性
    if (
      current.config &&
      typeof current.Delete === "function" &&
      typeof current.Clone === "function" &&
      "selected" in current
    ) {
      return current as Control;
    }

    current = current.$parent;
  }

  return null;
}

/**
 * 获取控件基础属性配置项
 * @param config 控件配置
 * @param control 控件实例
 * @returns 控件基础配置项数组
 */
export function GetBaseControlProps(config: ControlConfig, control: Control): ConfiguratorItem[] {
  const fieldMap: ConfiguratorItem[] = [];
  if (control.parentDataSourceControl && control.parentDataSourceControl.config.sourceType == "Form") {
    fieldMap.push({
      name: "字段名",
      des: "控件的绑定字段名称",
      type: DesignerDeclare.InputType.ElInput,
      field: "sourceField",
    });
  }
  return fieldMap;
}

/**
 * 获取控件默认配置
 * @returns 控件默认配置
 */
export function GetDefaultConfig(): ControlConfig {
  return {
    top: 0,
    left: 0,
    width: 20,
    height: 20,
    type: "*",
    transparent: 1,
    round: 0,
    border: 0,
    visible: true,
    readonly: false,
    limit: true,
    disabled: false,
    required: false,
    errorMessage: "",
    $children: [],
  };
}
/**
 * 深度克隆对象，排除指定的属性
 * @param obj 要克隆的对象
 * @param excludeKeys 要排除的属性名数组
 * @returns 克隆后的对象
 */
export function DeepClone<T>(obj: T, excludeKeys: string[] = ["instance", "$children"]): T {
  // 处理基本类型、null和undefined
  if (obj === null || obj === undefined || typeof obj !== "object") {
    return obj;
  }

  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map((item) => DeepClone(item, excludeKeys)) as unknown as T;
  }

  // 处理日期对象
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  // 创建新对象
  const result = {} as T;

  // 复制所有非排除的属性
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && !excludeKeys.includes(key)) {
      result[key as keyof T] = DeepClone(obj[key as keyof T], excludeKeys);
    }
  }

  return result;
}
