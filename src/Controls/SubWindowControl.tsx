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
type ControlConfig = ControlDeclare.ControlConfig;

type ConfiguratorItem = DesignerDeclare.ConfiguratorItem;

@Component
export default class SubWindowControl extends Control {
  declare config: SubWindowConfig;

  subWinInstanceId: string = null;

  /**
   * 监听subWinInstanceId的变化，意味着子窗体被刷新
   */
  @Watch("subWinInstanceId")
  onSubWinInstanceIdChanged(val: string) {
    this.contentLoading = true;
    this.rootConfig = [this.$Store.get.Window.Windows[val].config];
  }

  @Provide
  rootConfig: ControlConfig[];

  async created() {
    if (!this.$Store.get.Designer.Debug || this.$Store.get.Designer.Preview) {
      let id = this.config.subWindowId;
      // 从服务器懒加载这个文件，并将其安装到当前浏览器中
      await Compiler.GetPublishFile(id, "fileId");
      let url = Compiler.fileId2BlobUrlMap.get(id);
      // 动态加载子窗体
      import(/* webpackIgnore: true */ url).then(async (m) => {
        let subWin = m.default as typeof BaseWindow;
        if (m.default.name != this.config.createClassName) {
          subWin = m[this.config.createClassName] as typeof BaseWindow;
        }
        this.subWinInstanceId = await new subWin(undefined).ShowSubWindow();
      });
    }
  }

  unmounted() {
    // 关闭子窗体
    if (this.subWinInstanceId) {
      this.$Store.dispatch("Window/CloseWindow", this.subWinInstanceId);
    }
  }

  /**
   * 是否正在加载窗体
   */
  contentLoading = true;
  render() {
    return super.render(
      <div
        class={css.subWin + (this.$Store.get.Designer.Debug ? " " + css.debugViewBox : "")}
        style={{
          width: this.config.width + "px",
          height: this.config.height + "px",
          overflowX: "hidden",
        }}
        onClick={(e) => {
          this.$Store.get.Window.Windows[this.subWinInstanceId].focusIndex--;
          this.$Store.dispatch("Window/SetFocusWindow", this.subWinInstanceId);
        }}
        v-loading={this.contentLoading}
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
                locate: { index: 0 },
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
      form: null,
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
  ];
  return fieldMap;
}

export async function GetEvents() {
  let { baseEvents } = await UtilControl();
  const eventMap: ConfiguratorItem[] = [...baseEvents];
  return eventMap;
}
