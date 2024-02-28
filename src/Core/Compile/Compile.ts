import { CompileDeclare } from "@/Types/CompileDeclare";
import { Path } from "@/Utils/VirtualFileSystem/Path";
import * as monaco from "monaco-editor";
type CompiledFile = CompileDeclare.CompiledFile;

export default class Compiler {
  // 导入映射
  importMap: Map<string, string> = new Map();

  // scriptDom 列表
  static scriptList: HTMLScriptElement[] = [];

  /**
   * 获取编译后的文件
   * @returns 编译后的文件
   */
  async GetCompiledFiles() {
    let models = monaco.editor.getModels();
    let worker = await monaco.languages.typescript.getTypeScriptWorker();

    const JavaScriptObfuscator = require("javascript-obfuscator");

    let compiledFiles: CompiledFile[] = [];

    // 编译所有模块
    for (let i = 0; i < models.length; i++) {
      const m = models[i];
      if (m.getLanguageId() == "sql") continue;

      let compiledFile: CompiledFile = {
        name: Path.RemoveSuffix(m.uri.path).substring(1),
        content: "",
        refs: [],
      };

      let client = await worker(m.uri);
      let out = await client.getEmitOutput(m.uri.toString());

      // 匹配源代码中的 import 行, 使用 gm 格式的正则
      const importReg = /import\s+.*\s+from\s+.*/gm;
      const match = out.outputFiles[0].text.match(importReg);
      if (match) {
        match.forEach((refStr) => {
          const ref = refStr.match(/from\s+['|"](.*)['|"]/);
          if (ref) {
            let refPath = ref[1]; // 例：./Main
            let currentPath = m.uri.path; // 例：/index.ts
            let refAbsolutePath = Path.GetAbsolutePath(currentPath, refPath); // 例：/Main

            compiledFile.refs.push({ refPath, absPath: refAbsolutePath });
          }
        });
      }

      var obfuscationResult = JavaScriptObfuscator.obfuscate(out.outputFiles[0].text, {
        splitStrings: true,
        splitStringsChunkLength: 4,
      });
      let confuseCode = obfuscationResult.getObfuscatedCode();

      compiledFile.content = confuseCode;
      compiledFiles.push(compiledFile);
    }

    return compiledFiles;
  }

  /**
   * 运行编译后的文件
   * @param compiledFiles 编译后的文件
   */
  async RunCompiledFiles(compiledFiles: CompiledFile[]) {
    let files = [...compiledFiles];
    while (files.length) {
      let m = files.shift();
      // 测试当前 file 中的 refs 是否都已经加载
      let isAllLoaded = m.refs.every((ref) => {
        return this.importMap.has(ref.absPath);
      });
      if (!isAllLoaded) {
        files.push(m);
        continue;
      }
      // 如果都加载了，则加载当前文件
      m.refs.forEach((ref) => {
        m.content = m.content.replace(ref.refPath, this.importMap.get(ref.absPath));
      });
      const blob = new Blob([m.content], { type: "text/javascript" });
      const scriptURL = URL.createObjectURL(blob);
      this.importMap.set(m.name, scriptURL);
      const script = document.createElement("script");
      script.type = "module";
      script.src = scriptURL;
      document.body.appendChild(script);
      Compiler.scriptList.push(script);
    }
  }

  static Dispose() {
    Compiler.scriptList.forEach((s) => {
      document.body.removeChild(s);
      URL.revokeObjectURL(s.src);
    });
    Compiler.scriptList = [];
  }
}
