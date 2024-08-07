import Control from "@/CoreUI/Designer/Control";
import { ControlDeclare } from "@/Types/ControlDeclare";
import { DesignerDeclare } from "@/Types/DesignerDeclare";
import { Component, Provide, Watch } from "vue-facing-decorator";
import FormControl from "./FormControl";
import Compiler from "@/Core/Compile/Compiler";
import { BaseWindow } from "@/Utils/Designer/Form";

// 仅在开发模式下导入的模块
const UtilControl = () => import("@/Utils/Designer/Controls");
const UtilVFS = () => import("@/Utils/VirtualFileSystem/Index");
const AsyncTs = () => import("typescript");

type SubWindowConfig = ControlDeclare.SubWindowConfig;
type ConfiguratorItem = DesignerDeclare.ConfiguratorItem;

@Component
export default class SubWindowControl extends Control {
  declare config: SubWindowConfig;
  declare $refs: any;

  subWinInstanceId: string = null;

  /**
   * 监听subWinInstanceId的变化，意味着子窗体被刷新
   */
  @Watch("subWinInstanceId")
  onSubWinInstanceIdChanged(val: string) {
    this.contentLoading = true;
  }

  /**
   * 展示子窗体
   */
  async ShowSubWindow() {
    if (!!this.subWinInstanceId) return;
    this.contentLoading = true;
    let id = this.config.subWindowId;
    // 从服务器懒加载这个文件，并将其安装到当前浏览器中
    await Compiler.GetPublishFile(id, "fileId");
    let url = Compiler.fileId2BlobUrlMap.get(id);

    let m = await import(/* webpackIgnore: true */ url);
    let subWin = m.default as typeof BaseWindow;
    if (m.default.name != this.config.createClassName) {
      subWin = m[this.config.createClassName] as typeof BaseWindow;
    }
    this.subWinInstanceId = await new subWin(undefined).ShowSubWindow();
  }

  async created() {
    this.config.ShowSubWindow = this.ShowSubWindow.bind(this);
  }

  unmounted() {
    this.config.ShowSubWindow = null;
    // 关闭子窗体
    if (this.subWinInstanceId) {
      this.$Store.dispatch("Window/CloseWindow", this.subWinInstanceId);
    }
  }

  get baseStyle() {
    let style: any = {};

    let winControl = this.parentFormControl.windowControlBar;
    let {
      config: { width, height },
    } = this.parentFormControl;

    // 开发模式下，没有 windowControlBar，所以不需要计算
    if (winControl) {
      let {
        maximize,
        containerStyle: { minHeight, minWidth },
      } = winControl;

      if (maximize) {
        width = minWidth.replace("px", "") - 0;
        height = minHeight.replace("px", "") - 0;
      }
    }

    // 是否是全部
    if (this.config.padding.includes("all")) {
      return {
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      };
    }

    this.config.padding.sort();

    // 上下左右
    for (const p of this.config.padding) {
      switch (p) {
        case "top":
          // 如果有height属性，则设置高度
          style = {
            ...style,
            top: 0,
            minHeight: style.minHeight ? "100%" : this.config.height + this.config.top + "px",
          };
          break;
        case "bottom":
          style = {
            ...style,
            minHeight: this.config.height + (height - (this.config.top + this.config.height)) + "px",
          };
          break;
        case "left":
          style = { ...style, left: 0, minWidth: this.config.width + this.config.left + "px" };
          break;
        case "right":
          style = {
            ...style,
            minWidth: style.minWidth
              ? "100%"
              : this.config.width + (width - (this.config.left + this.config.width)) + "px",
          };
          break;
      }
    }

    // 如果有最小高度，则设置最大高度为最小高度
    if (style.minHeight) style.maxHeight = style.minHeight;
    if (style.minWidth) style.maxWidth = style.minWidth;

    return {
      ...style,
      ...super.baseStyle,
    };
  }

  /**
   * 是否正在加载窗体
   */
  contentLoading = false;
  render() {
    return super.render(
      <div
        class={css.subWin + (this.$Store.get.Designer.Debug ? " " + css.debugViewBox : "")}
        style={{
          width: "100%",
          height: "100%",
          overflowX: "hidden",
          minWidth: "inherit",
          minHeight: "inherit",
        }}
        onClick={(e) => {
          this.$Store.get.Window.Windows[this.subWinInstanceId].focusIndex--;
          this.$Store.dispatch("Window/SetFocusWindow", this.subWinInstanceId);
        }}
        v-loading={this.contentLoading && !this.$Store.get.Designer.Debug}
        element-loading-text="正在加载窗体..."
        element-loading-background="black"
      >
        {this.$Store.get.Designer.Debug ? (
          <>
            <span>控件名称：{this.config.name}</span>
            <br />
            <span>绑定窗体：{this.config.subWindowId}</span>
          </>
        ) : (
          this.subWinInstanceId &&
          this.$Store.get.Window.Windows[this.subWinInstanceId] && (
            <FormControl
              {...{
                // locate: { index: 0 },
                config: this.$Store.get.Window.Windows[this.subWinInstanceId].config,
                instanceId: this.subWinInstanceId,
                key: this.subWinInstanceId,
                ref: "form",
              }}
            ></FormControl>
          )
        )}
      </div>
    );
  }

  static GetDefaultConfig(): SubWindowConfig {
    return {
      width: 240,
      height: 240,
      type: "SubWindow",
      subWindowId: "",
      createClassName: "",
      padding: [],
    };
  }
}

export async function GetProps(config: SubWindowConfig, instance: SubWindowControl) {
  let { baseProps } = await UtilControl();
  let { GetAllFormFiles, GetFileById } = await UtilVFS();
  let ts = await AsyncTs();

  let subWins = GetAllFormFiles();
  const fieldMap: ConfiguratorItem[] = [
    ...baseProps.filter(
      (p) =>
        p.field != "readonly" &&
        p.field != "disabled" &&
        p.field != "required" &&
        p.field != "bgColor" &&
        p.field != "errorMessage" &&
        p.field != "color"
    ),
    {
      name: "窗体",
      des: "子窗体渲染的窗体",
      type: DesignerDeclare.InputType.ElSelect,
      field: "subWindowId",
      options: subWins.map((s) => {
        return { label: s.name, value: s.children[0].id };
      }),
      onChange: (value: string) => {
        let file = GetFileById(value);
        if (!file) return;
        let sourceFile = ts.createSourceFile("temp.ts", file.content, ts.ScriptTarget.ESNext, true);
        // 递归通过 ts 来寻找继承自 Page 的类名
        let className = "";
        function GetClassName(node) {
          if (node.kind == ts.SyntaxKind.ClassDeclaration) {
            let heritageClauses = node.heritageClauses;
            if (heritageClauses) {
              heritageClauses.forEach((h) => {
                h.types.forEach((t) => {
                  if (t.expression.getText() == "Page") {
                    className = node.name.getText();
                  }
                });
              });
            }
          }
          ts.forEachChild(node, GetClassName);
        }
        ts.forEachChild(sourceFile, GetClassName);
        config.createClassName = className;
      },
    },
    // 填充，上下左右
    {
      name: "填充",
      des: "子窗体的填充",
      type: DesignerDeclare.InputType.ElSelect,
      field: "padding",
      options: [
        { label: "上", value: "top" },
        { label: "下", value: "bottom" },
        { label: "左", value: "left" },
        { label: "右", value: "right" },
        { label: "全部", value: "all" },
      ],
      multiple: true,
    },
  ];
  return fieldMap;
}

export async function GetEvents() {
  let { baseEvents } = await UtilControl();
  const eventMap: ConfiguratorItem[] = [...baseEvents];
  return eventMap;
}
