import { VritualFileSytem } from "@/Types/VirtualFileSystem";
import store from "@/Vuex/Store";
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
    this.SetTypeScriptProjectConfig();
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

  private SetTypeScriptProjectConfig() {
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      baseUrl: ".",
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    });
    monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
    monaco.languages.registerDefinitionProvider("typescript", {
      provideDefinition: function (model, position) {
        let contet = model.getLineContent(position.lineNumber);
        let ref = contet.match(/from\s+['](.*)[']/);
        console.log(ref);

        // 这里编写代码来决定如何查找定义
        // 比如，可以解析文件、分析导入语句等
        return {
          uri: model.uri, // 目标文件的 URI
          range: new monaco.Range(0, 0, 0, 0), // 目标位置
        };
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
      provideCompletionItems: (model, position, ctx, token) => {
        let content = model.getLineContent(position.lineNumber);
        let range = new monaco.Range(
          position.lineNumber,
          position.column - 1,
          position.lineNumber,
          position.column - 1
        );

        let match = content.match(/from\s+[']/);
        if (match && (content[position.column - 1] == "'" || content[position.column - 1] == '"')) {
          return {
            suggestions: this.CreateFilePathSuggestions(range),
          };
        }

        return {
          suggestions: this.CreateBasicSuggestions(range, position),
        };
      },
    });
  }

  /**
   * 创建基础建议
   * @param range 范围
   * @returns 建议
   */
  CreateBasicSuggestions(range: monaco.Range, position: monaco.Position) {
    let content = this.editor.getModel().getLineContent(position.lineNumber);
    let suggestions = [];

    if ("import".startsWith(content.trim())) {
      suggestions.push({
        label: "import",
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: "import {} from '${1}'",
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: "import ... from ...",
        sortText: "0",
        range,
      });
    }

    suggestions.push({
      label: "log",
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: "console.log(${1})",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: "输出",
      range,
    });

    return suggestions;
  }

  /**
   * 创建文件路径建议
   * @param range 范围
   * @returns 建议
   */
  CreateFilePathSuggestions(range: monaco.Range) {
    let currentFile = store.state.VirtualFileSystem.CurrentFile;
    let currentPath = currentFile.path; // 例如：''，'' 代表是在根目录

    let suggestions = [];
    let dirs = [store.state.VirtualFileSystem.Root];
    while (dirs.length) {
      let dir = dirs.pop();

      for (const file of dir.files) {
        let relativePath = file.path; // 例如：'home', 这代表是在home目录下
        let insertPath = "";
        let name = file.name.substring(0, file.name.lastIndexOf("."));

        // 生成相对路径
        let relPathArr = relativePath.split("/").filter((m) => m);
        let currentPathArr = currentPath.split("/").filter((m) => m);
        if (currentPathArr.length > relPathArr.length) {
          relPathArr.unshift(...new Array(currentPathArr.length - relPathArr.length).fill(".."));
          insertPath = [...relPathArr, name].join("/");
        } else if (currentPathArr.length == relPathArr.length) {
          insertPath = [".", name].join("/");
        } else {
          insertPath = [".", ...relPathArr, name].join("/");
        }

        suggestions.push({
          label: name,
          kind: monaco.languages.CompletionItemKind.File,
          insertText: insertPath,
          detail: insertPath,
          sortText: "0",
          range,
        });
      }

      dirs.push(...dir.directories);
    }

    return suggestions;
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

    model = monaco.editor.createModel(file.content, "typescript", monaco.Uri.parse(`inmemory:///${fullName}`));
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
