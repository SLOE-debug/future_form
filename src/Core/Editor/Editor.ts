import { VritualFileSystemDeclare } from "@/Types/VritualFileSystemDeclare";
import { GetParentByFile } from "@/Utils/VirtualFileSystem/Index";
import { Path } from "@/Utils/VirtualFileSystem/Path";
import store from "@/Vuex/Store";
import * as monaco from "monaco-editor";
import * as actions from "monaco-editor/esm/vs/platform/actions/common/actions";

type IFile = VritualFileSystemDeclare.IFile;
type ICompareFile = VritualFileSystemDeclare.ICompareFile;

export default class Editor {
  ele: HTMLElement;
  editor: monaco.editor.IStandaloneCodeEditor;
  models: Map<string, monaco.editor.ITextModel> = new Map();
  model2File: Map<monaco.editor.ITextModel, IFile> = new Map();
  modelStates: Map<string, monaco.editor.ICodeEditorViewState> = new Map();

  constructor() {
    this.DefineTheme();
    this.SetTokenizer();
    this.SetTypeScriptProjectConfig();
    this.ConfigureAutoComplete();
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
    monaco.editor.defineTheme("sql", {
      base: "vs-dark",
      inherit: true,
      rules: [{ token: "params", foreground: "3dc9b0", fontStyle: "bold" }],
      colors: {
        "editor.foreground": "#d4d4d4",
      },
    });
  }

  // 自定义 typescript 提供者
  async CustomTypeScriptProvider(model: monaco.editor.ITextModel, _position: monaco.Position) {
    const selection = this.editor.getSelection();
    const position = selection.getStartPosition();

    // 判断当前光标是否停留在 from 的引号中
    let content = model.getLineContent(position.lineNumber);
    let match = content.match(/from\s+['|"](.*)['|"]/); // 例：'./Main'
    if (match) {
      let col = position.column - 1;
      // 获取引号的位置
      let frist = content.indexOf('"');
      if (frist == -1) frist = content.indexOf("'");
      let last = content.lastIndexOf('"');
      if (last == -1) last = content.lastIndexOf("'");

      let refPath = match[1]; // 例：./Main
      let currentPath = model.uri.path; // 例：/index.ts
      let refAbsolutePath = Path.GetAbsolutePath(currentPath, refPath); // 例：/Main

      // 判断光标是否在引号中
      if (col > frist && col < last) {
        let refModel = this.models.get(refAbsolutePath + ".ts");
        if (refModel) {
          store.dispatch("VirtualFileSystem/SelectFile", this.model2File.get(refModel));
        }
      } else {
        // 光标不在引号中
        let word = model.getWordAtPosition(position);
        if (word) {
          let refModel = this.models.get(refAbsolutePath + ".ts");
          if (refModel) {
            let value = refModel.getValue();
            let index = value.indexOf(" " + word.word + " ") + 1;
            if (index != -1) {
              let start = refModel.getPositionAt(index);
              let end = refModel.getPositionAt(index + word.word.length);
              await store.dispatch("VirtualFileSystem/SelectFile", this.model2File.get(refModel));
              this.editor.setSelection(
                new monaco.Selection(start.lineNumber, start.column, end.lineNumber, end.column)
              );
            }
          }
        }
      }
    }
  }

  /**
   * 加载声明文件
   */
  LoadDeclareFile(declareModule: any, namespace: string) {
    let declare = declareModule.default;
    let namespaceRegex = new RegExp(`export namespace ${namespace} \\{`, "g");

    declare = declare.replace(namespaceRegex, "");
    declare = declare.replace(/export /g, "");
    let lastIndex = declare.lastIndexOf("}");
    declare = declare.substring(0, lastIndex);

    // // 将 declare 字符串中的 "BarKit[]" 替换成 BarKit[]
    // declare = declare.replace(`"BarKit[]"`, "BarKit[]");

    monaco.languages.typescript.typescriptDefaults.addExtraLib(declare, namespace + ".d.ts");
  }

  /**
   * 设置TypeScript项目配置
   */
  private SetTypeScriptProjectConfig() {
    // 设置TypeScript编译器配置
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      baseUrl: ".",
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    });

    // 加载控件声明文件
    this.LoadDeclareFile(require("!!raw-loader!@/Types/ControlDeclare"), "ControlDeclare");
    // 加载事件声明文件
    this.LoadDeclareFile(require("!!raw-loader!@/Types/EventDeclare"), "EventDeclare");

    // 设置TypeScript编译器配置
    monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
    // 设置TypeScript定义提供者
    monaco.languages.registerDefinitionProvider("typescript", {
      provideDefinition: this.CustomTypeScriptProvider.bind(this),
    });
  }

  /**
   * 设置各个语法高亮
   */
  private SetTokenizer() {
    let ts = monaco.languages.getLanguages().find((m) => m.id == "typescript") as unknown as { loader: Function };
    ts.loader = (function (func: Function) {
      return async function (this: any) {
        let res = (await func.apply(this, arguments)) as {
          language: { tokenizer: { [x: string]: any[] }; keywords: string[] };
        };

        res.language.tokenizer.common.unshift([
          /([\w]+)(?=\()/,
          {
            cases: { "@keywords": "keyword", "@default": "method" },
          },
        ]);

        res.language.tokenizer.root.unshift([/class |extends |new /, "keyword", "@className"]);
        res.language.tokenizer.root.unshift([/console/, "typeIdentifier"]);
        res.language.tokenizer.className = [
          [/[a-zA-Z][\w\$]*/, "typeIdentifier", "@pop"],
          ["[ ]", "white"],
        ];

        return res;
      };
    })(ts.loader);

    let sql = monaco.languages.getLanguages().find((m) => m.id == "sql") as any;
    sql.loader = (function (func: Function) {
      return async function (this: any) {
        let res = await func.apply(this, arguments);
        (res.language.tokenizer.root as any[]).unshift([/:\w+/, "params"]);
        return res;
      };
    })(sql.loader);
  }

  /**
   * 创建编辑器
   */
  CreateEditor() {
    this.editor = monaco.editor.create(this.ele, {
      theme: "typescript",
      quickSuggestions: {
        strings: true, // 在字符串中启用自动完成
        comments: false, // 在注释中禁用自动完成
        other: true, // 在其他文本中启用自动完成
      },
      unicodeHighlight: {
        ambiguousCharacters: false,
      },
      automaticLayout: true,
    });

    this.editor.onDidChangeModelContent(this.ModelContentChanged.bind(this));

    this.ConfigureContextMenuAndShortcut();
  }

  // 模型改变时回调数组
  modelChangeCallbacks: Function[] = [];

  /**
   * 模型内容改变
   * @param func 回调
   */
  OnModelChange(func: Function) {
    this.modelChangeCallbacks.push(func);
  }

  /**
   * 模型内容改变
   */
  ModelContentChanged() {
    if (!store.get.VirtualFileSystem.CurrentFile) return;
    store.get.VirtualFileSystem.CurrentFile.isUnsaved =
      this.editor.getValue() != store.get.VirtualFileSystem.CurrentFile.content;
    this.modelChangeCallbacks.forEach((m) => m());
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
          // console.log(node.element);

          let shouldRemove = ids.includes(node.element?.command?.id);
          if (shouldRemove) {
            v._remove(node);
          }
        } while ((node = node.next));
        break;
      }
    }
  }

  // 是否已配置
  isConfigured = false;

  /**
   * 保存文件
   */
  Save() {
    store.get.VirtualFileSystem.CurrentFile.content = this.editor.getValue();
    store.get.VirtualFileSystem.CurrentFile.isUnsaved = false;
    store.dispatch("VirtualFileSystem/SaveRoot");
  }

  /**
   * 保存所有文件
   */
  SaveAll() {
    let dirs = [store.get.VirtualFileSystem.Root];
    while (dirs.length) {
      let dir = dirs.pop();
      for (const file of dir.files) {
        if (file.isUnsaved) {
          let model = this.models.get(file.GetFullName());
          file.content = model.getValue();
          file.isUnsaved = false;
        }
        if (file.specialFile) {
          file.children.forEach((f) => {
            if (f.isUnsaved) {
              let model = this.models.get(f.GetFullName());
              f.content = model.getValue();
              f.isUnsaved = false;
            }
          });
        }
      }
      dirs.push(...dir.directories);
    }
    store.dispatch("VirtualFileSystem/SaveRoot");
  }

  /**
   * 配置右键菜单和快捷键
   */
  ConfigureContextMenuAndShortcut() {
    if (this.isConfigured) return;
    // 删除格式化文档和跳转到定义
    this.RemoveContextMenuById(["editor.action.formatDocument", "editor.action.revealDefinition"]);

    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, this.Save.bind(this));
    this.editor.addCommand(monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, function () {}, "");

    // F5 运行
    this.editor.addCommand(monaco.KeyCode.F5, () => {
      let event = new KeyboardEvent("keydown", { key: "F5" });
      window.dispatchEvent(event);
    });

    // 为 Ctrl + . 添加一个空的动态绑定，防止默认行为
    (this.editor as any)._standaloneKeybindingService.addDynamicKeybinding(
      "-editor.action.quickFix",
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Period,
      () => {}
    );

    // Alt + . 触发 Quick Fix
    this.editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.Period, () => {
      this.editor.trigger("anyString", "editor.action.quickFix", {});
    });

    // Ctrl + K, Ctrl + D 格式化文档
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
    // F12 跳转到定义
    this.editor.addAction({
      id: "GoToDefinition",
      label: "跳转到定义",
      contextMenuGroupId: "navigation",
      contextMenuOrder: 0,
      keybindings: [monaco.KeyCode.F12],
      run: () => {
        this.editor.trigger("anyString", "editor.action.revealDefinition", {});
      },
    });
    // Shift + F7 查看设计器
    this.editor.addAction({
      id: "ViewDesigner",
      label: "查看设计器",
      contextMenuGroupId: "navigation",
      contextMenuOrder: 0,
      keybindings: [monaco.KeyMod.Shift | monaco.KeyCode.F7],
      run: () => {
        let parent = GetParentByFile(store.get.VirtualFileSystem.CurrentFile) as IFile;
        if (parent?.suffix == VritualFileSystemDeclare.FileType.FormDesigner) {
          store.dispatch("VirtualFileSystem/SelectFile", parent);
        } else {
          ElMessage({ message: "出现错误！当前文件貌似没有设计器！", type: "error" });
        }
      },
    });
    this.isConfigured = true;
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

        let match = content.match(/from\s+['|"]/);
        if (match && (content[position.column - 1] == "'" || content[position.column - 1] == '"')) {
          return {
            suggestions: this.CreateFilePathSuggestions(range),
          };
        }

        // 尝试匹配 import
        let importMatch = content.match(/import\s*\(\s*['|"]/);
        if (importMatch && (content[position.column - 1] == "'" || content[position.column - 1] == '"')) {
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

    if ("log".startsWith(content.trim())) {
      suggestions.push({
        label: "log",
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: "console.log(${1})",
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: "输出",
        range,
      });
    }

    return suggestions;
  }

  /**
   * 创建文件路径建议
   * @param range 范围
   * @returns 建议
   */
  CreateFilePathSuggestions(range: monaco.Range) {
    let currentFile = store.state.VirtualFileSystem.CurrentFile;

    let suggestions = [];
    let dirs = [store.state.VirtualFileSystem.Root];
    while (dirs.length) {
      let dir = dirs.pop();

      for (const file of dir.files) {
        // 如果 file 的后缀是 sql
        if (file.suffix == VritualFileSystemDeclare.FileType.Sql) continue;

        let insertPath = Path.GetRelativePath(currentFile.GetFullName(), file.GetFullName());
        let name = Path.RemoveSuffix(file.name);

        if (file.children.length) {
          for (const f of file.children) {
            let insertPath = Path.GetRelativePath(currentFile.GetFullName(), f.GetFullName());
            let name = Path.RemoveSuffix(f.name);
            suggestions.push({
              label: name,
              kind: monaco.languages.CompletionItemKind.File,
              insertText: insertPath,
              detail: insertPath,
              sortText: "0",
              range,
            });
          }
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

  // 后缀对应的语言
  suffix2Language = {
    ts: "typescript",
    txt: "plaintext",
    "form.ts": "typescript",
    sql: "sql",
  };

  // 后缀对应的主题
  suffix2Theme = {
    ts: "ts",
    "form.ts": "ts",
    sql: "sql",
  };

  /**
   * 获取或创建模型
   * @param file 文件
   * @returns 模型
   */
  GetOrCreateModel(file: IFile) {
    let fullName = file.GetFullName();

    let theme = this.suffix2Theme[file.suffix];
    if (theme) {
      monaco.editor.setTheme(theme);
    }

    let model = this.models.get(fullName);
    if (model) return model;

    let language = this.suffix2Language[file.suffix];

    model = monaco.editor.createModel(
      file.content,
      language || "plaintext",
      monaco.Uri.parse(`inmemory:///${fullName}`)
    );

    this.models.set(fullName, model);
    this.model2File.set(model, file);
    return model;
  }

  /**
   * 刷新model
   */
  RefreshModel(file: IFile) {
    let fullName = file.GetFullName();
    let model = this.models.get(fullName);
    if (model) {
      model.setValue(file.content);
    }
  }

  /**
   * 创建所有模型
   */
  CreateAllFileModel() {
    let dirs = [store.get.VirtualFileSystem.Root];

    while (dirs.length) {
      let dir = dirs.pop();
      for (const file of dir.files) {
        this.GetOrCreateModel(file);
        if (file.specialFile) {
          file.children.forEach((f) => {
            this.GetOrCreateModel(f);
          });
        }
      }
      dirs.push(...dir.directories);
    }
  }

  /**
   * 重建所有模型
   */
  RebuildAllModel() {
    this.DisposeAllModel();
    this.CreateAllFileModel();
  }

  /**
   * 切换版本
   */
  SwitchVersion() {
    let dirs = [store.get.VirtualFileSystem.Root];
    let path2File = new Map<string, IFile>();

    while (dirs.length) {
      let dir = dirs.pop();
      for (const file of dir.files) {
        let fullName = file.GetFullName();
        path2File.set(fullName, file);

        if (file.specialFile) {
          file.children.forEach((f) => {
            let fullName = f.GetFullName();
            path2File.set(fullName, f);
          });
        }
      }
      dirs.push(...dir.directories);
    }

    let oldVersionPaths = Array.from(this.models.keys());
    let newVersionPaths = Array.from(path2File.keys());

    // 删除不在新版本的文件
    for (const fullName of oldVersionPaths) {
      if (!newVersionPaths.includes(fullName)) {
        let model = this.models.get(fullName);
        model.dispose();
        this.models.delete(fullName);
        this.model2File.delete(model);
      }
    }

    // 添加或更新新版本中的文件对应的模型
    for (const path of newVersionPaths) {
      let file = path2File.get(path);
      if (this.models.has(path)) {
        // 如果旧模型存在，更新其内容
        let model = this.models.get(path);
        model.setValue(file.content);
        this.model2File.set(model, file);
      } else {
        // 如果旧模型不存在，创建新模型
        this.GetOrCreateModel(file);
      }
    }
  }

  /**
   * 切换文件
   * @param newFile 新文件
   * @param oldFile 旧文件
   */
  SwitchFile(newFile: IFile, oldFile: IFile) {
    if (!this.editor) this.CreateEditor();

    setTimeout(() => {
      if (oldFile) this.modelStates.set(oldFile.GetFullName(), this.editor.saveViewState());

      let fullName = newFile.GetFullName();
      let state = this.modelStates.get(fullName);
      let model = this.GetOrCreateModel(newFile);
      this.editor.setModel(model);
      if (state) this.editor.restoreViewState(state);
    }, 0);
  }

  // 对比文件的ele
  compareEle: HTMLElement;
  // 对比文件的编辑器
  compareEditor: monaco.editor.IStandaloneDiffEditor;

  /**
   * 对比文件
   */
  CompareFile(file: ICompareFile) {
    // 通过当前ele克隆出一个新的ele，插入到ele同层

    let codeType = "typescript";
    let originContent = file.originContent;
    let content = file.content;

    if (file.suffix == VritualFileSystemDeclare.FileType.FormDesigner) {
      codeType = "json";
      originContent = JSON.stringify(file.originExtraData, null, "\t");
      content = JSON.stringify(file.extraData, null, "\t");
    }

    this.compareEle = document.createElement("div");
    this.compareEle.style.position = "absolute";
    this.compareEle.style.zIndex = "99999";
    this.compareEle.style.top = "0";
    this.compareEle.style.left = "0";
    this.compareEle.style.width = "100%";
    this.compareEle.style.height = "100%";
    this.ele.parentElement.appendChild(this.compareEle);
    const originalModel = monaco.editor.createModel(originContent, codeType);
    const modifiedModel = monaco.editor.createModel(content, codeType);

    this.compareEditor = monaco.editor.createDiffEditor(this.compareEle, {
      originalEditable: true,
      automaticLayout: true,
    });
    this.compareEditor.setModel({
      original: originalModel,
      modified: modifiedModel,
    });

    const originalEditor = this.compareEditor.getOriginalEditor();
    const modifiedEditor = this.compareEditor.getModifiedEditor();

    originalEditor.updateOptions({ readOnly: true });
    modifiedEditor.updateOptions({ readOnly: true });
  }

  /**
   * 释放对比文件
   */
  DisposeCompareFile() {
    // 删除对比文件的ele
    this.compareEle.remove();
    // 释放对比编辑器的所有model
    this.compareEditor.getOriginalEditor().getModel()?.dispose();
    this.compareEditor.getModifiedEditor().getModel()?.dispose();

    this.compareEditor.dispose();
    this.compareEle.remove();
  }

  /**
   * 释放所有model资源
   */
  DisposeAllModel() {
    for (const { 0: k, 1: model } of this.models) {
      model.dispose();
    }

    this.models.clear();
    this.model2File.clear();
    this.modelStates.clear();
  }

  /**
   * 释放资源
   */
  Dispose() {
    this.DisposeAllModel();
    this.editor?.dispose();
    this.editor = null;
  }
}
