import { editor } from "@/CoreUI/Editor/EditorPage";
import { GlobalApi } from "@/Plugins/Api/ExtendApi";
import { CompileDeclare } from "@/Types/CompileDeclare";
import { VritualFileSystemDeclare } from "@/Types/VritualFileSystemDeclare";
import { Path } from "@/Utils/VirtualFileSystem/Path";
import store from "@/Vuex/Store";
const monacoImport = import("monaco-editor");

type CompiledFile = CompileDeclare.CompiledFile;

export default class Compiler {
  /**
   * 导入映射
   */
  private static import2BlobUrlMap: Map<string, string> = new Map();

  /**
   * 文件ID与BlobUrl的映射
   */
  static fileId2BlobUrlMap: Map<string, string> = new Map();

  /**
   * 编译后的文件列表
   */
  public static CompiledFiles: CompiledFile[] = [];

  /**
   * scriptDom 列表
   */
  private static scriptList: HTMLScriptElement[] = [];

  /**
   * 获取启动文件
   */
  static async GetStartupFile() {
    // 从编译文件中获取启动文件
    let file = this.CompiledFiles.find((f) => f.fullPath == "Startup");
    // 如果没有启动文件，则请求API获取启动文件
    if (!file) {
      let files = (await GlobalApi.GetPublishFileByFileId()).data;
      file = files.find((f) => f.fullPath == "Startup");
      this.CompiledFiles.push(...files);
    }

    return file;
  }

  /**
   * 获取编译后的文件
   * @returns 编译后的文件
   */
  static async Compile(debug: boolean = true) {
    let monaco = await monacoImport;

    let models = monaco.editor.getModels();
    let worker = await monaco.languages.typescript.getTypeScriptWorker();

    let compiledFiles: CompiledFile[] = [];

    // 编译所有模块
    for (let i = 0; i < models.length; i++) {
      const m = models[i];
      // 获取文件的语言
      let language = m.getLanguageId();
      if (language == "sql" && debug) continue;

      let file = editor.model2File.get(m);

      let compiledFile: CompiledFile = {
        fileId: file.id,
        fullPath: Path.RemoveSuffix(m.uri.path).substring(1),
        content: "",
        extraData: file.extraData,
        refs: [],
      };

      if (language == "typescript") {
        let client = await worker(m.uri);

        let out = await client.getEmitOutput(m.uri.toString());
        let code = out.outputFiles[0].text;

        // 获取 import 方法引用的路径
        let regex = /import\(['|"](.*)['|"]\)/g;
        const matches = [...code.matchAll(regex)];

        let res = matches.map((match) => match[1]);
        if (res.length > 0) {
          for (let refPath of res) {
            let absPath = Path.GetAbsolutePath(m.uri.path, refPath);
            // console.log(refPath, absPath);
            // 创建regex，内容为 import(['|"]refPath['|"])，用于替换
            let reg = new RegExp(`import\\(['|"]${refPath}['|"]\\)`, "g");
            code = code.replace(reg, `importAsync("${absPath}")`);
          }
        }

        this.ObfuscateAndGenerateRefMap(code, compiledFile, m.uri.path, debug);
      } else {
        compiledFile.content = m.getValue();
      }

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
  private static ObfuscateAndGenerateRefMap(code: string, file: CompiledFile, path: string, debug: boolean = true) {
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

          // 存在疑问，refs 中是否需要存储文件id
          file.refs.push({ refPath, absPath: refAbsolutePath });
        }
      });
    }

    let confuseCode = code;
    if (!debug) {
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
   * @param InstalledFiles 文件列表
   */
  static Install(file: CompiledFile, InstalledFiles: CompiledFile[] = []) {
    for (const ref of file.refs) {
      if (!this.import2BlobUrlMap.has(ref.absPath)) {
        let refFile = this.CompiledFiles.find((f) => f.fullPath == ref.absPath);
        if (refFile) {
          this.Install(refFile, InstalledFiles);
        }
      }
    }
    if (!this.import2BlobUrlMap.has(file.fullPath)) {
      InstalledFiles.push(file);
      file.refs.forEach((ref) => {
        file.content = file.content.replace(ref.refPath, this.import2BlobUrlMap.get(ref.absPath));
      });
      const blob = new Blob([file.content], { type: "application/javascript" });
      const scriptURL = URL.createObjectURL(blob);
      this.import2BlobUrlMap.set(file.fullPath, scriptURL);
      this.fileId2BlobUrlMap.set(file.fileId, scriptURL);
      const script = document.createElement("script");
      script.type = "module";
      script.src = scriptURL;
      document.body.appendChild(script);
      Compiler.scriptList.push(script);
    }
    return InstalledFiles;
  }

  /**
   * 懒加载编译文件
   */
  static async LazyLoad(param?: string, type: "fileId" | "fullPath" = "fileId") {
    let file = this.CompiledFiles.find((f) => f[type] == param);
    // 如果不是预览模式并且文件不存在，则请求API获取文件
    if (!store.get.Designer.Preview && !file) {
      // Api：GetPublishFileByFileId 或 GetPublishFileByFullPath
      let files = (await GlobalApi[`GetPublishFileBy${type[0].toUpperCase() + type.slice(1)}`]({ [type]: param })).data;
      this.CompiledFiles.push(...files);
      file = this.CompiledFiles.find((f) => f[type] == param);
    }

    if (!this.fileId2BlobUrlMap.has(file.fileId)) {
      this.Install(file);
    }
    return file;
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
    Compiler.import2BlobUrlMap.clear();
    Compiler.fileId2BlobUrlMap.clear();
    Compiler.CompiledFiles = [];
  }
}

// 定义 importAsync 函数，用于懒加载
window.importAsync = async (path: string) => {
  let file = await Compiler.LazyLoad(path, "fullPath");
  let url = Compiler.fileId2BlobUrlMap.get(file.fileId);
  return import(/* webpackIgnore: true */ url);
};
