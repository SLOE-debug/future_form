import Control from "@/CoreUI/Designer/Control";
import WindowControlBar from "@/CoreUI/Designer/WindowControlBar";
import { ControlDeclare } from "@/Types/ControlDeclare";
import { DesignerDeclare } from "@/Types/DesignerDeclare";
import { UtilsDeclare } from "@/Types/UtilsDeclare";
import { defineAsyncComponent } from "vue";
import { Component, Prop } from "vue-facing-decorator";
import DataSourceGroupControl from "./DataSourceGroupControl";
import store from "@/Vuex/Store";
import { BaseWindow } from "@/Utils/Runtime";
import SubWindowControl from "./SubWindowControl";
import DevelopmentModules from "@/Utils/DevelopmentModules";
import { useVirtualFileSystemStore } from "@/Stores/VirtualFileSystemStore";
import { editor } from "@/Utils/Designer";

const virtualFileSystemStore = useVirtualFileSystemStore();

type FormConfig = ControlDeclare.FormConfig;
type ConfiguratorItem = DesignerDeclare.ConfiguratorItem;
type Coord = UtilsDeclare.Coord;

const AsyncSlideSelector = defineAsyncComponent(() => import("@/CoreUI/Designer/Components/SlideSelector"));

@Component
export default class FormControl extends Control {
  /**
   * 窗体实例ID
   */
  @Prop
  instanceId: string;

  /**
   * 窗体控制条
   */
  get windowControlBar() {
    let parent = this.$parent.$options.__vfdConstructor;
    if (parent == WindowControlBar) return this.$parent as WindowControlBar;
    return null;
  }

  slideStartCoord: Coord;
  SlideStart(e: MouseEvent) {
    if (e.button == 0 && e.activity != false && this.designerStore.debug)
      this.slideStartCoord = { x: e.clientX, y: e.clientY };
  }

  SlideEnd(e) {
    if (!e || !e.width || !e.height) return;

    let configs = this.designerStore.formConfig.$children.filter((c) => {
      return (
        c.left < e.left + e.width && c.left + c.width > e.left && c.top < e.top + e.height && c.top + c.height > e.top
      );
    });
    if (configs.length) {
      this.designerStore.SelectControlByConfig(configs);
    }
  }

  async HandleMouseUp(e: MouseEvent) {
    this.slideStartCoord = null;
  }

  /**
   * 通知 窗体控制条/子窗体 控件加载完成
   */
  NotifyControlLoaded() {
    let parent = this.$parent.$options.__vfdConstructor;
    if (parent == WindowControlBar) {
      let windowBar = this.$parent as WindowControlBar;
      windowBar.contentLoading = false;
    }
    if (parent == SubWindowControl) {
      let subWin = this.$parent as SubWindowControl;
      subWin.contentLoading = false;
    }
  }

  // 设置窗体运行时
  setupRuntime() {
    let { instance, config } = this.$Store.get.Window.Windows[this.instanceId];
    if (instance) {
      instance.$Window = this;
      instance.BindWindowEventAndControl(config, this);
      this.instance = instance;
    }
  }

  declare instance: BaseWindow;
  declare dataSourceControls: DataSourceGroupControl[];
  async created() {
    this.dataSourceControls = [];
    // 如果是生产或预览模式，则设置窗体运行时
    if (this.isProductionOrPreview) this.setupRuntime();
    // 触发运行时代码中的窗体 `created` 事件
    if (this.events?.onCreated) {
      await this.events.onCreated?.();
    }

    this.NotifyControlLoaded();
  }

  setupDesignerMode(): void {
    super.setupDesignerMode();
    this.designerStore.SetFormDesigner(this);
    this.eventManager.add(window, "mouseup", this.HandleMouseUp, this);
  }

  async mounted() {
    this.$nextTick(() => {
      this.events.onMounted?.();
    });
  }

  beforeUnmount() {
    this.isDesignerMode && this.designerStore.SetFormDesigner(null);
  }

  async unmounted() {
    super.unmounted();
    // splice 依次删除 dataSourceControls
    while (this.dataSourceControls.length) {
      this.dataSourceControls.splice(0, 1);
    }
    this.dataSourceControls = null;
    this.instance = null;
  }

  KeyDown(e: KeyboardEvent) {
    if (e.key == "Enter" && !this.designerStore.debug && this.config.enterBtn) {
      let btn = this.instance.$refs[this.config.enterBtn];
      if (btn) btn.events.onClick && btn.events.onClick(this, e);
    }
  }

  get baseStyle() {
    return {
      minWidth: "inherit",
      minHeight: "inherit",
    };
  }

  render() {
    return super.render(
      <div class={css.form} style={{ width: "100%", height: "100%" }} onMousedown={this.SlideStart}>
        {this.designerStore.debug && (
          <AsyncSlideSelector
            {...{
              start: this.slideStartCoord,
              onSlideEnd: this.SlideEnd,
            }}
          />
        )}
        {this.config.$children.map((c, i) => {
          let control = this.$.appContext.components[c.type + "Control"];
          return <control key={c.id} config={c} ref={c.name} style={{ zIndex: i }}></control>;
        })}
      </div>
    );
  }

  static GetDefaultConfig(): FormConfig {
    return {
      name: virtualFileSystemStore.currentFile.name.replace(".form.ts", ""),
      width: 700,
      height: 500,
      type: "Form",
      title: "默认标题",
      // 是否显示窗体控制条
      showControlBar: true,
      bgColor: "#F1F1F1",
      enterBtn: "",
      maximize: false,
      showMaximize: true,
      showClose: true,
      $children: [],
      extends: "BaseWindow",
    };
  }
}

export async function GetProps(config: FormConfig) {
  let { baseProps } = await DevelopmentModules.Load();
  let { FindControlsByType } = await DevelopmentModules.Load();
  let { GetAllFormFiles, GetFileById, GetParentByFile } = await DevelopmentModules.Load();
  let { Path } = await DevelopmentModules.Load();
  let { ts } = await DevelopmentModules.Load();

  let windows = GetAllFormFiles(virtualFileSystemStore.root);

  const fieldMap: ConfiguratorItem[] = [
    {
      name: "标题",
      des: "窗体的标题",
      type: DesignerDeclare.InputType.ElInput,
      field: "title",
    },
    ...baseProps.filter(
      (p) =>
        p.field != "name" &&
        p.field != "visible" &&
        p.field != "readonly" &&
        p.field != "disabled" &&
        p.field != "required"
    ),
    {
      name: "回车按钮",
      des: "用户按下回车时的按钮",
      type: DesignerDeclare.InputType.ElSelect,
      field: "enterBtn",
      options: FindControlsByType(config, "Button").map((m) => {
        return {
          label: m.name,
          value: m.name,
        };
      }),
    },
    // 是否显示窗体控制条
    {
      name: "显示控制条",
      des: "窗体是否显示窗体控制条",
      type: DesignerDeclare.InputType.ElSwitch,
      field: "showControlBar",
    },
    // 是否最大化
    {
      name: "最大化",
      des: "窗体是否最大化",
      type: DesignerDeclare.InputType.ElSwitch,
      field: "maximize",
    },
    // 是否需要高度滚动条
    {
      name: "高度滚动条",
      des: "窗体是否需要高度滚动条",
      type: DesignerDeclare.InputType.ElSwitch,
      field: "heightScroll",
    },
    // 是否显示最大化按钮
    {
      name: "显示最大化按钮",
      des: "窗体是否显示最大化按钮",
      type: DesignerDeclare.InputType.ElSwitch,
      field: "showMaximize",
    },
    // 是否显示关闭按钮
    {
      name: "显示关闭按钮",
      des: "窗体是否显示关闭按钮",
      type: DesignerDeclare.InputType.ElSwitch,
      field: "showClose",
    },
    // 自定义的渲染顺序
    {
      name: "自定义渲染顺序",
      des: "窗体的自定义渲染顺序，-1永远在最底层，0永远在最顶层",
      type: DesignerDeclare.InputType.ElInputNumber,
      field: "customRenderIndex",
      max: Infinity,
      min: -Infinity,
      precision: 0,
    },
    // 继承的窗体
    {
      name: "继承窗体",
      des: "继承的窗体，非设计文件将被禁用",
      type: DesignerDeclare.InputType.ElSelect,
      field: "extends",
      onlyDesign: true,
      options: windows.map((w) => {
        return { label: w.name, value: w.children[0].id };
      }),
      onChange: (value: string) => {
        let exportName = "";
        let importStr = "";

        // 如果 value 为空，则继承 BaseWindow
        if (!value) {
          config.extends = "BaseWindow";
          exportName = "BaseWindow";
        }

        let file = GetFileById(virtualFileSystemStore.root, value);

        if (file) {
          // 计算相对路径
          let relativePath = Path.GetRelativePath(
            virtualFileSystemStore.currentFile.GetFullName(),
            file.GetFullName()
          );

          // 导出的名字
          exportName = "ExtendsWindow";
          // 生成 import 语句
          importStr = `import ${exportName} from "${relativePath}";`;
        }

        let pageCode = virtualFileSystemStore.currentFile.content;
        let sourceFile = ts.createSourceFile("temp.ts", pageCode, ts.ScriptTarget.ESNext, true);
        // 递归查找 Page 类继承的类名
        let extendsClass = "";
        ts.forEachChild(sourceFile, (node) => {
          if (ts.isClassDeclaration(node)) {
            // 确保类有名称并且名称是 "Page"
            if (node.name && node.name.escapedText === "Page") {
              // 获取继承的类名
              if (node.heritageClauses) {
                for (let i = 0; i < node.heritageClauses.length; i++) {
                  let clause = node.heritageClauses[i];
                  // 查找 extends 关键字
                  if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
                    extendsClass = clause.types[0].expression.getText();
                    break;
                  }
                }
              }
            }
          }
        });

        if (extendsClass) {
          // 替换继承的类名
          let newContent = pageCode.replace("extends " + extendsClass, "extends " + exportName);
          // 删除原有 import 语句
          newContent = newContent.replace(/import\s+ExtendsWindow\s+from\s+['"].*['"];/, "");

          // 当前文件的id
          let id = virtualFileSystemStore.currentFile.id;

          // 如果有 import 语句，则加上 import 语句
          if (importStr) {
            newContent = importStr + newContent;
            // 替换 constructor() {\r\n\t\tsuper('${this.id}');\r\n\t} 为 constructor() {\r\n\t\tsuper();\r\n\t\tthis.inheritIds.push('xxx');\r\n\t}
            newContent = newContent.replace(
              /constructor\(\)\s*{[^}]*super\('.*'\);[^}]*}/,
              `constructor() {\r\n\t\tsuper();\r\n\t\tthis.inheritIds.push('${id}');\r\n\t}`
            );
          } else {
            // 替换 constructor() {\r\n\t\tsuper();\r\n\t\tthis.inheritIds.push('xxx');\r\n\t} 为 constructor() {\r\n\t\tsuper('${designFile.id}');\r\n\t}
            newContent = newContent.replace(
              /constructor\(\)\s*{[^}]*super\(\);[^}]*}/,
              `constructor() {\r\n\t\tsuper('${id}');\r\n\t}`
            );
          }
          // 更新文件内容
          let model = editor.models.get(virtualFileSystemStore.currentFile.GetFullName());
          model.setValue(newContent);
          virtualFileSystemStore.currentFile.content = model.getValue();
          model.setValue(virtualFileSystemStore.currentFile.content);
        }
      },
    },
  ];
  return fieldMap;
}

export async function GetEvents() {
  let { baseEvents } = await DevelopmentModules.Load();

  const eventMap: ConfiguratorItem[] = [
    ...baseEvents,
    {
      name: "开始创建",
      des: "窗体的开始创建事件",
      type: DesignerDeclare.InputType.ElSelect,
      field: "created",
    },
    {
      name: "创建完成",
      des: "窗体的创建完成事件",
      type: DesignerDeclare.InputType.ElSelect,
      field: "mounted",
    },
    // 获取焦点
    {
      name: "获取焦点",
      des: "窗体获取焦点事件",
      type: DesignerDeclare.InputType.ElSelect,
      field: "focus",
    },
    // 关闭前
    {
      name: "关闭",
      des: "窗体关闭前触发的事件",
      type: DesignerDeclare.InputType.ElSelect,
      field: "beforeClose",
    },
  ];
  return eventMap;
}
