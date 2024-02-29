import { editor } from "@/CoreUI/Editor/EditorPage";
import { CompileDeclare } from "@/Types/CompileDeclare";
import { VritualFileSystemDeclare } from "@/Types/VritualFileSystemDeclare";
import { Path } from "@/Utils/VirtualFileSystem/Path";
import store from "@/Vuex/Store";
import * as monaco from "monaco-editor";
import * as ts from "typescript";

type CompiledFile = CompileDeclare.CompiledFile;
type IFile = VritualFileSystemDeclare.IFile;

export default class Compiler {
  // 导入映射
  private static importMap: Map<string, string> = new Map();

  // 编译后的文件列表
  private static CompiledFiles: CompiledFile[] = [];

  // scriptDom 列表
  private static scriptList: HTMLScriptElement[] = [];

  // 获取启动文件
  static get StartupFile() {
    return this.CompiledFiles.find((f) => f.path == "Startup");
  }

  /**
   * 获取编译后的文件
   * @returns 编译后的文件
   */
  static async Compile() {
    let models = monaco.editor.getModels();
    let worker = await monaco.languages.typescript.getTypeScriptWorker();

    // 排序 models，保证 Startup.ts 文件在最前
    let compiledFiles: CompiledFile[] = [];

    // 编译所有模块
    for (let i = 0; i < models.length; i++) {
      const m = models[i];
      if (m.getLanguageId() == "sql") continue;

      let compiledFile: CompiledFile = {
        id: editor.model2File.get(m)!.id,
        path: Path.RemoveSuffix(m.uri.path).substring(1),
        content: "",
        refs: [],
      };

      let client = await worker(m.uri);
      let out = await client.getEmitOutput(m.uri.toString());
      let code = out.outputFiles[0].text;

      this.ObfuscateAndGenerateRefMap(code, compiledFile, m.uri.path);

      compiledFiles.push(compiledFile);
    }

    this.CompiledFiles = compiledFiles;
  }

  /**
   * 混淆代码并生成引用映射
   * @param code 未编译的代码
   * @param file 编译文件
   * @param path 文件路径
   */
  private static ObfuscateAndGenerateRefMap(code: string, file: CompiledFile, path: string) {
    const JavaScriptObfuscator = require("javascript-obfuscator");
    // 匹配源代码中的 import 行, 使用 gm 格式的正则
    const importReg = /import\s+.*\s+from\s+.*/gm;
    const match = code.match(importReg);
    if (match) {
      match.forEach((refStr) => {
        const ref = refStr.match(/from\s+['|"](.*)['|"]/);
        if (ref) {
          let refPath = ref[1]; // 例：./Main
          let currentPath = path; // 例：/index.ts
          let refAbsolutePath = Path.GetAbsolutePath(currentPath, refPath); // 例：/Main

          file.refs.push({ refPath, absPath: refAbsolutePath });
        }
      });
    }

    let confuseCode = code;
    if (!store.get.Designer.Debug) {
      var obfuscationResult = JavaScriptObfuscator.obfuscate(code, {
        splitStrings: true,
        splitStringsChunkLength: 4,
      });
      confuseCode = obfuscationResult.getObfuscatedCode();
    }

    file.content = confuseCode;
  }

  /**
   * 安装编译后的文件
   * @param file 文件
   * @param files 文件列表
   */
  static Install(file: CompiledFile) {
    for (const ref of file.refs) {
      if (!this.importMap.has(ref.absPath)) {
        let refFile = this.CompiledFiles.find((f) => f.path == ref.absPath);
        if (refFile) {
          this.Install(refFile);
        }
      }
    }
    if (!this.importMap.has(file.path)) {
      file.refs.forEach((ref) => {
        file.content = file.content.replace(ref.refPath, this.importMap.get(ref.absPath));
      });
      const blob = new Blob([file.content], { type: "text/javascript" });
      const scriptURL = URL.createObjectURL(blob);
      this.importMap.set(file.path, scriptURL);
      const script = document.createElement("script");
      script.type = "module";
      script.src = scriptURL;
      document.body.appendChild(script);
      Compiler.scriptList.push(script);
    }
  }

  /**
   * 懒加载编译文件
   */
  static LazyLoad(id: string) {
    // 如果没有编译文件，待续...

    const file = this.CompiledFiles.find((f) => f.id == id);
    if (file) {
      console.log(file);

      this.Install(file);
    }
  }

  /**
   * 释放资源
   */
  static Dispose() {
    Compiler.scriptList.forEach((s) => {
      document.body.removeChild(s);
      URL.revokeObjectURL(s.src);
    });
    Compiler.scriptList = [];
  }
}
