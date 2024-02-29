import Control from "@/CoreUI/Designer/Control";
import { ControlDeclare } from "@/Types/ControlDeclare";
import { DesignerDeclare } from "@/Types/DesignerDeclare";
import { baseProps, baseEvents } from "@/Utils/Designer/Controls";
import { Component, Provide } from "vue-facing-decorator";
import FormControl from "./FormControl";
import { WindowDeclare } from "@/Types/WindowDeclare";
import { GetAllFormFiles, GetFileById } from "@/Utils/VirtualFileSystem/Index";
import Compiler from "@/Core/Compile/Compile";
import * as ts from "typescript";

type SubWindowConfig = ControlDeclare.SubWindowConfig;
type ControlConfig = ControlDeclare.ControlConfig;

type ConfiguratorItem = DesignerDeclare.ConfiguratorItem;

type WindowConfig = WindowDeclare.WindowConfig;

@Component
export default class SubWindowControl extends Control {
  declare config: SubWindowConfig;

  subWinConfig: WindowConfig = null;

  subWinInstanceId: string = null;
  subWinInstance = null;

  @Provide
  rootConfig: ControlConfig[];

  async created() {
    if (!this.$Store.get.Designer.Debug || this.$Store.get.Designer.Preview) {
      // 窗体id
      let id = this.config.subWindowId;
      Compiler.LazyLoad(id);

      // let file = GetFileById(this.config.subWin);
      // if (file) {
      //   let files = Compiler.CompileByFile(file, file.children[0]);
      //   Compiler.Install(files[1]);

      //   // this.subWinInstanceId = await this.$Store.dispatch("Window/CreateWindow", {
      //   //   config: file.extraData,
      //   //   dialog: false,
      //   //   instance: this,
      //   // });
      //   // this.$nextTick(() => {
      //   //   this.config.form = (this.$refs.form as FormControl).instance as any;
      //   // });
      // }

      // let res = await this.$Api.GetFormByClassName({ className: this.config.subWin });
      // if (res.data) {
      //   this.subWinConfig = res.data;
      //   this.$nextTick(() => {
      //     this.config.form = (this.$refs.form as FormControl).instance as any;
      //   });
      // }
    }
  }

  unmounted() {
    this.subWinConfig = null;
  }

  render() {
    return super.render(
      <div
        class={css.subWin + (this.$Store.get.Designer.Debug ? " " + css.debugViewBox : "")}
        style={{
          width: this.config.width + "px",
          height: this.config.height + "px",
          overflowX: "hidden",
        }}
      >
        {this.$Store.get.Designer.Debug ? (
          <>
            <span>控件名称：{this.config.name}</span>
            <br />
            <span>绑定窗体：{this.config.subWindowId}</span>
          </>
        ) : (
          this.subWinInstanceId && (
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

export function GetProps(config: SubWindowConfig, instance: SubWindowControl) {
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
      field: "subWin",
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
        instance.config.createClassName = className;
        console.log(className);
      },
    },
  ];
  return fieldMap;
}

export function GetEvents() {
  const eventMap: ConfiguratorItem[] = [...baseEvents];
  return eventMap;
}
