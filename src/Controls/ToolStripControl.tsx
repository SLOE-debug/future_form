import SvgIcon from "@/Components/SvgIcon";
import Control from "@/CoreUI/Designer/Control";
import { ControlDeclare } from "@/Types/ControlDeclare";
import { DesignerDeclare } from "@/Types/DesignerDeclare";
import { baseEvents, baseProps } from "@/Utils/Designer/Controls";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import {
  ElAutoResizer,
  ElButton,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElSelect,
  ElSelectV2,
  ElTableV2,
} from "element-plus";
import { AnyColumns } from "element-plus/es/components/table-v2/src/types";
import { Component, Watch } from "vue-facing-decorator";
import { JSX } from "vue/jsx-runtime";

type ToolStripConfig = ControlDeclare.ToolStripConfig;
type ToolStripItem = ControlDeclare.ToolStripItem;
type ConfiguratorItem = DesignerDeclare.ConfiguratorItem;

@Component
export default class ToolStripControl extends Control {
  declare config: ToolStripConfig;

  // 下拉按钮的下拉项
  dropDownItems = [
    {
      label: "按钮",
      type: "button",
      icon: "image",
    },
    {
      label: "文本",
      type: "label",
      icon: "font",
    },
    {
      label: "分割线",
      type: "split",
      icon: "minus",
    },
    {
      label: "下拉框",
      type: "select",
      icon: "caret-down",
    },
  ];

  // type2Alias
  private type2Alias = {
    button: "btn",
    label: "lbl",
    select: "sel",
  };

  /**
   * 新建名称
   */
  CreateName(type: "button" | "label" | "select" | "split" = "button") {
    let alias = this.type2Alias[type];
    if (alias == undefined) return;
    let otherItems = this.config.items.filter((item) => item.type == type);
    let index = otherItems.length + 1;
    let name = `${this.config.name}_${alias}${index}`;
    // 判断是否有重名
    while (this.config.items.find((item) => item.name == name)) {
      index++;
      name = `${this.config.name}_${alias}${index}`;
    }
    return name;
  }

  /**
   * 下拉按钮的点击事件
   */
  DropDownClick(type: "button" | "label" | "select" | "split" = "button") {
    let item: any = {
      type: type,
      events: {},
    };
    let name = this.CreateName(type);
    if (name) item.name = name;
    switch (type) {
      case "button":
        item.showTextHeight = 60;
        item.showTextWidth = 60;
        item.iconSize = 14;
        item.text = "按钮";
        item.width = 24;
        item.height = 24;
        item.customIcon = "image";
        break;
      case "label":
        item.text = "文本";
        break;
      case "select":
        item.width = 100;
        item.height = 24;
        item.placeholder = "选择框";
        item.options = [];
        break;
    }

    this.config.items.push(item);
  }

  /**
   * debug模式下，显示工具条的配置
   */
  RenderConfigurator() {
    return (
      <ElDropdown
        splitButton
        size="small"
        trigger="click"
        onClick={() => this.DropDownClick()}
        onCommand={(command) => this.DropDownClick(command)}
      >
        {{
          default: () => (
            <FontAwesomeIcon
              icon="image"
              style={{
                fontSize: "12px",
              }}
            />
          ),
          dropdown: () => (
            <ElDropdownMenu>
              {this.dropDownItems.map((item) => (
                <ElDropdownItem
                  icon={
                    <FontAwesomeIcon
                      icon={item.icon}
                      style={{
                        fontSize: "12px",
                        // 如果是 split，则旋转 90 度
                        transform: item.type == "split" ? "rotate(90deg)" : "",
                      }}
                    />
                  }
                  command={item.type}
                >
                  {item.label}
                </ElDropdownItem>
              ))}
            </ElDropdownMenu>
          ),
        }}
      </ElDropdown>
    );
  }

  /**
   * 按钮渲染器
   */
  ButtonRenderer(item: ToolStripItem) {
    return (
      <ElButton
        size="small"
        class={css.button}
        style={{
          width: (this.config.showText ? item.showTextWidth : item.width) + "px",
          height: (this.config.showText ? item.showTextHeight : item.height) + "px",
        }}
        ref={item.name}
        onClick={(e) => {
          item.events.onClick && item.events.onClick(item, e);
        }}
      >
        {{
          default: () => this.config.showText && item.text,
          icon: () => {
            if (!item.icon && !item.faIcon) return;
            // 是否是 file 开头的图标
            let isFile = item.icon && item.icon.startsWith("file:");
            if (isFile) {
              return (
                <SvgIcon
                  {...{
                    name: item.icon.replace("file:", ""),
                    size: item.iconSize,
                    style: {
                      fontSize: item.iconSize + "px",
                    },
                  }}
                />
              );
            }

            return (
              <FontAwesomeIcon
                icon={item.faIcon ? item.faIcon : item.icon}
                style={{
                  fontSize: item.iconSize + "px",
                }}
              />
            );
          },
        }}
      </ElButton>
    );
  }

  /**
   * 通过 item 的配置，获取表格下拉框的列样式
   */
  GetTableSelectColumnsStyle(item: ToolStripItem) {
    return {
      display: "grid",
      "grid-template-columns": item.columns.map((col) => col.width + "px").join(" "),
    };
  }

  /**
   * 下拉框渲染器
   */
  SelectRenderer(item: ToolStripItem) {
    return (
      <ElSelectV2
        key={item.name}
        class={css.select}
        style={{
          width: item.width + "px",
          height: item.height + "px",
        }}
        filterable
        clearable={item.clearable}
        loading={item.loading}
        loadingText={item.loadingText || "加载中"}
        placeholder={item.placeholder}
        v-model={item.value}
        options={item.options}
        remote={item.remote}
        popperClass={css.selectPopper}
        remoteMethod={(e) => {
          let { systemRemoteMethod, remoteMethod } = item;
          // 执行 remoteMethod 并获取返回值，返回值来指示是否需要继续执行 systemRemoteMethod
          if (remoteMethod) {
            let result = remoteMethod(item, e);
            if (result == false) return;
          }
          // 如果有 systemRemoteMethod，则执行
          systemRemoteMethod && systemRemoteMethod(item, e);
        }}
        ref={item.name}
        onChange={(e) => {
          item.events.onChange && item.events.onChange(item, e);
        }}
      >
        {{
          default: (e) => {
            let m = e.item.m;
            // 如果显示方式是 table，则显示列
            if (item.display == "table") {
              return (
                <span style={this.GetTableSelectColumnsStyle(item)}>
                  {item.columns.map((col) => {
                    return (
                      <span class={css.clip} title={m[col.field]}>
                        {m[col.field]}
                      </span>
                    );
                  })}
                </span>
              );
            }
            return null;
          },
          header: () => {
            // 如果显示方式是 table，则显示列头
            if (item.display == "table") {
              return (
                <div style={this.GetTableSelectColumnsStyle(item)}>
                  {item.columns.map((col) => (
                    <div>{col.title}</div>
                  ))}
                </div>
              );
            }
            return null;
          },
        }}
      </ElSelectV2>
    );
  }

  // item 的 checked WeakMap
  itemCheckedMap = new WeakMap();

  /**
   * 渲染工具条的items
   */
  RenderItems() {
    return this.config.items.map((item) => {
      let itemJsx: JSX.Element;

      switch (item.type) {
        case "button":
          itemJsx = this.ButtonRenderer(item);
          break;
        case "label":
          itemJsx = <div class={css.label}>{item.text}</div>;
          break;
        case "select":
          itemJsx = this.SelectRenderer(item);
          break;
        case "split":
          itemJsx = <div class={css.split}></div>;
          break;
      }

      // 如果是debug模式
      if (this.$Store.get.Designer.Debug) {
        itemJsx.props = itemJsx.props || {};
        itemJsx.props.style = itemJsx.props.style || {};

        // 禁用控件的事件
        itemJsx.props.style.pointerEvents = "none";
        // 显示配置
        itemJsx = (
          <div
            class={this.itemCheckedMap.get(item) ? css.debugFlag : ""}
            style={{
              color: this.config.color,
            }}
            onClick={(e) => {
              this.config.items.forEach((i) => {
                this.itemCheckedMap.set(i, false);
              });
              this.itemCheckedMap.set(item, true);
              this.$Store.dispatch("Designer/RenderControlConfigurator", this);
              e.activity = false;
            }}
          >
            {itemJsx}
          </div>
        );
      }

      return itemJsx;
    });
  }

  render() {
    return super.render(
      <div
        class={css.toolStrip}
        style={{
          color: this.config.color,
          fontSize: this.config.fontSize + "px",
        }}
        onClick={(e) => {
          if (e.activity == false) return;
          this.config.items.forEach((item) => {
            this.itemCheckedMap.set(item, false);
          });
        }}
      >
        {this.RenderItems()}
        {/* 如果是debug模式，显示配置 */}
        {this.$Store.get.Designer.Debug && this.RenderConfigurator()}
      </div>
    );
  }

  Delete(pushStack = true) {
    // 如果当前的 items 中有选中的项，则删除选中的项
    let index = this.config.items.findIndex((item) => this.itemCheckedMap.get(item));
    if (index >= 0) {
      this.config.items.splice(index, 1);
    } else {
      return super.Delete(pushStack);
    }
  }

  /**
   * 获取当前控件的基类样式
   */
  get baseStyle() {
    let style: any = {
      height: "auto",
      backgroundColor: this.config.bgColor,
    };

    // 反向的停靠位置
    let reverseDock = this.config.dock == "top" ? "bottom" : this.config.dock == "left" ? "right" : "left";
    // 如果需要显示分区线
    if (this.config.showSplit) {
      style["border-" + reverseDock] = "1px solid #ccc";
    }
    switch (this.config.dock) {
      case "top":
      case "bottom":
        style.width = "100%";
        style.padding = "2px";
        style.left = 0;
        style[this.config.dock] = 0;
        style[this.config.dock == "top" ? "bottom" : "top"] = "auto";
        break;
      case "left":
        style.left = 0;
        break;
      case "right":
        style.right = 0;
        break;
    }

    return style;
  }

  /**
   * 通过当前的Dock属性，计算出当前控件的样式
   */
  // SetStyleByDock(style: any) {
  //   // 反向的停靠位置
  //   let reverseDock = this.config.dock == "top" ? "bottom" : this.config.dock == "left" ? "right" : "left";

  //   // 如果需要显示分区线
  //   if (this.config.showSplit) {
  //     style["border-" + reverseDock] = "1px solid #ccc";
  //   }

  //   switch (this.config.dock) {
  //     case "top":
  //     case "bottom":
  //       style.width = "100%";
  //       style.padding = "2px";
  //       delete style.height;
  //       style.left = 0;
  //       style[this.config.dock] = 0;
  //       style[this.config.dock == "top" ? "bottom" : "top"] = "auto";

  //       break;
  //     case "left":
  //       style.left = 0;
  //       break;
  //     case "right":
  //       style.right = 0;
  //       break;
  //   }
  // }

  static GetDefaultConfig(): ToolStripConfig {
    return {
      width: 70,
      height: 25,
      fontSize: 12,
      type: "ToolStrip",
      dock: "top",
      bgColor: "#fff",
      items: [],
      showText: false,
      showSplit: true,
    };
  }
}

// 按钮属性
function GetButtonProps(item: any) {
  return [
    // 按钮文本
    {
      name: "按钮文本",
      field: { ref: item, key: "text" },
      des: "工具条控件的按钮文本",
      type: DesignerDeclare.InputType.ElInput,
    },
    // 宽度
    {
      name: "宽度",
      field: { ref: item, key: "width" },
      des: "工具条控件的按钮宽度",
      type: DesignerDeclare.InputType.ElInputNumber,
    },
    // 高度
    {
      name: "高度",
      field: { ref: item, key: "height" },
      des: "工具条控件的按钮高度",
      type: DesignerDeclare.InputType.ElInputNumber,
    },
    // 显示文本时的宽度
    {
      name: "显示文本宽度",
      field: { ref: item, key: "showTextWidth" },
      des: "工具条控件的按钮显示文本时的宽度",
      type: DesignerDeclare.InputType.ElInputNumber,
    },
    // 显示文本时的高度
    {
      name: "显示文本高度",
      field: { ref: item, key: "showTextHeight" },
      des: "工具条控件的按钮显示文本时的高度",
      type: DesignerDeclare.InputType.ElInputNumber,
    },
    // 图标
    {
      name: "图标",
      field: { ref: item, key: "icon" },
      des: "工具条控件的按钮图标",
      type: DesignerDeclare.InputType.ElSelect,
      options: require
        .context("@/Assets/Icons/Svg", true, /\.svg$/)
        .keys()
        .map((key) => {
          return {
            label: key.replace(/\.\/|\.svg/g, ""),
            value: "file:" + key.replace(/\.\/|\.svg/g, ""),
          };
        }),
    },
    // 自定义图标
    {
      name: "自定义图标",
      field: { ref: item, key: "customIcon" },
      des: "工具条控件的按钮自定义图标",
      type: DesignerDeclare.InputType.ElInput,
    },
    // 图标大小
    {
      name: "图标大小",
      field: { ref: item, key: "iconSize" },
      des: "工具条控件的按钮图标大小",
      type: DesignerDeclare.InputType.ElInputNumber,
    },
  ];
}

export function GetProps(config: ToolStripConfig, instance: ToolStripControl) {
  let base = baseProps.filter((item) => item.field != "width" && item.field != "height");
  const fieldMap: ConfiguratorItem[] = [
    ...base,
    // 字体大小
    {
      name: "字体大小",
      field: "fontSize",
      des: "工具条控件的字体大小",
      type: DesignerDeclare.InputType.ElInputNumber,
    },
    // 停靠位置
    {
      name: "停靠位置",
      field: "dock",
      des: "工具条控件的停靠位置",
      type: DesignerDeclare.InputType.ElSelect,
      options: [
        { label: "顶部", value: "top" },
        { label: "底部", value: "bottom" },
        { label: "左侧", value: "left" },
        { label: "右侧", value: "right" },
        { label: "无", value: "none" },
      ],
    },
    // 按钮是否显示文本
    {
      name: "按钮文本",
      field: "showText",
      des: "工具条控件的按钮是否显示文本",
      type: DesignerDeclare.InputType.ElSwitch,
    },
    // 是否显示区分的线
    {
      name: "分割线",
      field: "showSplit",
      des: "工具条控件的是否显示分割线",
      type: DesignerDeclare.InputType.ElSwitch,
    },
  ];

  // 获取当前选中的子控件
  const item = config.items.find((item) => instance.itemCheckedMap.get(item));
  switch (item?.type) {
    case "button":
      fieldMap.push(
        // 按钮属性
        ...GetButtonProps(item)
      );
      break;
    case "label":
      fieldMap.push(
        // 文本
        {
          name: "文本",
          field: { ref: item, key: "text" },
          des: "工具条控件的文本",
          type: DesignerDeclare.InputType.ElInput,
        }
      );
      break;
    case "select":
      fieldMap.push(
        // 宽度
        {
          name: "宽度",
          field: { ref: item, key: "width" },
          des: "工具条控件的下拉框宽度",
          type: DesignerDeclare.InputType.ElInputNumber,
        },
        // 高度
        {
          name: "高度",
          field: { ref: item, key: "height" },
          des: "工具条控件的下拉框高度",
          type: DesignerDeclare.InputType.ElInputNumber,
        },
        // 占位符
        {
          name: "占位符",
          field: { ref: item, key: "placeholder" },
          des: "工具条控件的下拉框占位符",
          type: DesignerDeclare.InputType.ElInput,
        },
        // 选项
        {
          name: "选项",
          field: { ref: item, key: "options" },
          des: "工具条控件的下拉框选项",
          type: DesignerDeclare.InputType.Options,
        }
      );
      break;
  }

  return fieldMap;
}

export function GetEvents(instance: ToolStripConfig) {
  const eventMap: ConfiguratorItem[] = [...baseEvents];

  // 获取当前选中的子控件
  const item = instance.items.find((item) => item.checked);
  switch (item?.type) {
    case "button":
      eventMap.push(
        // 点击事件
        {
          name: "点击",
          field: { ref: item, key: "onClick" },
          des: "工具条控件的按钮点击事件",
          type: DesignerDeclare.InputType.ElSelect,
          paramTypes: [["e", "MouseEvent"]],
        }
      );
      break;
    case "select":
      eventMap.push(
        // 选中事件
        {
          name: "改变",
          field: { ref: item, key: "onChange" },
          des: "工具条控件的下拉框改变事件",
          type: DesignerDeclare.InputType.ElSelect,
        }
      );
      break;
  }

  return eventMap;
}
