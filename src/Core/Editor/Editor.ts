import { VritualFileSytem } from "@/Types/VirtualFileSystem";
import * as monaco from "monaco-editor";
import * as actions from "monaco-editor/esm/vs/platform/actions/common/actions";

type IFile = VritualFileSytem.IFile;

export default class Editor {
  ele: HTMLElement;
  editor: monaco.editor.IStandaloneCodeEditor;
  models: Map<string, monaco.editor.ITextModel> = new Map();
  modelStates: Map<string, monaco.editor.ICodeEditorViewState> = new Map();

  constructor() {
    this.DefineTheme();
    this.SetTypeScriptTokenizer();
  }

  /**
   * 设置编辑器容器
   * @param _ele 编辑器容器
   */
  SetContianer(_ele: HTMLElement) {
    this.ele = _ele;
  }

  /**
   * 定义主题
   */
  private DefineTheme() {
    monaco.editor.defineTheme("ts", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "typeIdentifier", foreground: "3dc9b0" },
        { token: "method", foreground: "cdc7a6" },
      ],
      colors: {
        "editor.foreground": "#d4d4d4",
      },
    });
  }

  /**
   * 设置TypeScript语法高亮
   */
  private SetTypeScriptTokenizer() {
    let ts = monaco.languages.getLanguages().find((m) => m.id == "typescript") as unknown as { loader: Function };
    ts.loader = (function (func: Function) {
      return async function (this: any) {
        let res = (await func.apply(this, arguments)) as {
          language: { tokenizer: { [x: string]: any[] } };
        };

        res.language.tokenizer.common.unshift([
          /([\w]+)(?=\()/,
          {
            cases: { "@keywords": "keyword", "@default": "method" },
          },
        ]);

        res.language.tokenizer.root.unshift([/class|extends/, "keyword", "@className"]);
        res.language.tokenizer.root.unshift([/console/, "typeIdentifier"]);
        res.language.tokenizer.className = [
          [/[a-zA-Z][\w\$]*/, "typeIdentifier", "@pop"],
          ["[ ]", "white"],
        ];

        return res;
      };
    })(ts.loader);
  }

  /**
   * 创建编辑器
   */
  CreateEditor() {
    this.editor = monaco.editor.create(this.ele, {
      theme: "ts",
      quickSuggestions: {
        strings: true, // 在字符串中启用自动完成
        comments: false, // 在注释中禁用自动完成
        other: true, // 在其他文本中启用自动完成
      },
    });
    this.ConfigureContextMenuAndShortcut();
    this.ConfigureAutoComplete();
  }

  /**
   * 移除右键菜单
   * @param ids 菜单id
   */
  RemoveContextMenuById(ids) {
    for (const { 0: k, 1: v } of actions.MenuRegistry._menuItems) {
      if (k.id == "EditorContext") {
        let node = v._first;
        do {
          let shouldRemove = ids.includes(node.element?.command?.id);
          if (shouldRemove) {
            v._remove(node);
          }
        } while ((node = node.next));
        break;
      }
    }
  }

  /**
   * 配置右键菜单和快捷键
   */
  ConfigureContextMenuAndShortcut() {
    this.RemoveContextMenuById(["editor.action.formatDocument", "editor.action.quickCommand"]);
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      //   this.File.content = this.editor.getValue();
    });

    this.editor.addAction({
      id: "FormattedDocument",
      label: "格式化文档",
      contextMenuGroupId: "1_modification",
      contextMenuOrder: 0,
      keybindings: [
        monaco.KeyMod.chord(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD),
      ],
      run: () => {
        this.editor.trigger("anyString", "editor.action.formatDocument", {});
      },
    });
  }

  /**
   * 配置自动完成
   */
  ConfigureAutoComplete() {
    monaco.languages.registerCompletionItemProvider("typescript", {
      triggerCharacters: ["'", '"'],
      provideCompletionItems: function (model, position, ctx, token) {
        let content = model.getLineContent(position.lineNumber);
        if (content.startsWith("import")) {
          return {
            suggestions: [
              {
                label: "vue",
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: "vue",
                sortText: "0",
                range: new monaco.Range(
                  position.lineNumber,
                  position.column - 1,
                  position.lineNumber,
                  position.column - 1
                ),
              },
            ],
          };
        }

        return {
          suggestions: [
            {
              label: "import",
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: "import {${1}} from '${2}'",
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              detail: "import ... from ...",
              sortText: "0",
              range: new monaco.Range(
                position.lineNumber,
                position.column - 1,
                position.lineNumber,
                position.column - 1
              ),
            },
            {
              label: "log",
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: "console.log(${1})",
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              detail: "输出",
              documentation: "控制台输出方法",
              range: new monaco.Range(
                position.lineNumber,
                position.column - 1,
                position.lineNumber,
                position.column - 1
              ),
            },
          ],
        };
      },
    });
  }

  /**
   * 获取或创建模型
   * @param file 文件
   * @returns 模型
   */
  GetOrCreateModel(file: IFile) {
    let fullName = file.GetFullName();
    let model = this.models.get(fullName);
    if (model) return model;
    model = monaco.editor.createModel(file.content, "typescript", monaco.Uri.parse(`file:///${fullName}`));
    this.models.set(fullName, model);
    return model;
  }

  /**
   * 切换文件
   * @param newFile 新文件
   * @param oldFile 旧文件
   */
  SwitchFile(newFile: IFile, oldFile: IFile) {
    if (!this.editor) this.CreateEditor();
    if (oldFile) this.modelStates.set(oldFile.GetFullName(), this.editor.saveViewState());

    let fullName = newFile.GetFullName();
    let state = this.modelStates.get(fullName);
    let model = this.GetOrCreateModel(newFile);
    this.editor.setModel(model);
    if (state) this.editor.restoreViewState(state);
  }
}
