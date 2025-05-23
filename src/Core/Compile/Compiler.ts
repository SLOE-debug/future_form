import { GlobalApi } from "@/Plugins/Api/ExtendApi";
import { CompileDeclare } from "@/Types/CompileDeclare";
import { DeepEquals } from "@/Utils";
import { backupRoot } from "@/Utils/VirtualFileSystem/Index";
import { Path } from "@/Utils/VirtualFileSystem/Path";
import CompareFile from "../VirtualFileSystem/CompareFile";
import DevelopmentModules from "@/Utils/DevelopmentModules";
import { ExtensionLibraries } from "@/Utils/Designer";

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
      file = await Compiler.GetPublishFile("Startup", "fullPath");
    }

    return file;
  }

  /**
   * 获取编译后的文件
   * @returns 编译后的文件
   */
  static async Compile(debug: boolean = true, publishAll: boolean = false) {
    let { monaco } = await DevelopmentModules.Load();
    let { editor } = await DevelopmentModules.Load();

    let models = monaco.editor.getModels();
    let worker = await monaco.languages.typescript.getTypeScriptWorker();

    let compiledFiles: CompiledFile[] = [];

    // 编译所有模块
    for (let i = 0; i < models.length; i++) {
      const m = models[i];

      let file = editor.model2File.get(m);
      // 获取文件的语言
      let language = m.getLanguageId();
      if ((language == "sql" && debug) || !file || file.deleted) continue;

      // 如果 file 是对比文件，则跳过
      if (file instanceof CompareFile) continue;

      // 对比备份的Root
      // 如果 file 的 content 和 extraData 和备份的一样
      // 且如果不是debug模式
      // 且不是发布所有文件
      // 则不编译
      if (!debug && !publishAll) {
        let backupFile = backupRoot.find((f) => f.fullPath == file.GetFullName());
        if (backupFile && backupFile.content == file.content && DeepEquals(backupFile.extraData, file.extraData)) {
          continue;
        }
      }

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

        // 获取 code 中所有的 import(...) 行，替换为 importAsync(...)
        let importFuncReg = /import\(.+?\)/g;
        let match = code.match(importFuncReg);
        if (match) {
          for (let i = 0; i < match.length; i++) {
            // 获取引用的文件路径
            let refPath = match[i].match(/['|"](.+)['|"]/)[1];
            // 通过引用的文件路径和当前文件路径获取绝对路径
            let absPath = Path.GetAbsolutePath(m.uri.path, refPath);
            // 替换 import(...) 为 importAsync(...)
            code = code.replace(match[i], `importAsync('${absPath}')`);
          }
        }

        await this.ObfuscateAndGenerateRefMap(code, compiledFile, m.uri.path, debug);
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
  private static async ObfuscateAndGenerateRefMap(
    code: string,
    file: CompiledFile,
    path: string,
    debug: boolean = true
  ) {
    const JavaScriptObfuscator = await import("javascript-obfuscator").then((m: any) => m.default || m);
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
      let isThirdParty = !!ExtensionLibraries[ref.refPath];
      // 如果是第三方库，则不需要安装，并且需要删除 content 中的 import
      if (isThirdParty) {
        const importReg = new RegExp(`import\\s+.*\\s+from\\s+['|"]${ref.refPath}['|"];?(\r?\n|$)`, "g");
        file.content = file.content.replace(importReg, "$1");
        continue;
      }

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
   * 通过绝对路径或文件ID获取服务器的编译后的文件
   */
  static async GetPublishFile(param: string, type: "fullPath" | "fileId") {
    let file = this.CompiledFiles.find((f) => f[type] == param);
    if (!file) {
      let paramObj = { [type]: param };
      file = (await GlobalApi.GetPublishFile(paramObj)).data as CompiledFile;
      this.CompiledFiles.push(file);
    }
    for (const ref of file.refs) {
      let isExist = this.CompiledFiles.find((f) => f.fullPath == ref.absPath);
      if (!isExist) {
        await Compiler.GetPublishFile(ref.absPath, "fullPath");
      }
    }
    if (!this.fileId2BlobUrlMap.has(file.fileId)) {
      this.Install(file);
    }
    return file;
  }

  /**
   * 通过文件ID删除与编译文件相关的一切
   */
  static async DeleteFile(fileId: string) {
    let file = this.CompiledFiles.find((f) => f.fileId == fileId);
    if (file) {
      // 删除编译文件列表中的文件
      let index = this.CompiledFiles.indexOf(file);
      this.CompiledFiles.splice(index, 1);
      // 获取 blobUrl
      let blobUrl = this.fileId2BlobUrlMap.get(fileId);
      // 删除 blobUrl
      URL.revokeObjectURL(blobUrl);
      // 删除 import2BlobUrlMap 中的映射
      this.import2BlobUrlMap.delete(file.fullPath);
      // 删除 fileId2BlobUrlMap 中的映射
      this.fileId2BlobUrlMap.delete(fileId);
      // 删除 scriptList 中的 script
      let script = this.scriptList.find((s) => s.src == blobUrl);
      if (script) {
        document.body.removeChild(script);
        let scriptIndex = this.scriptList.indexOf(script);
        this.scriptList.splice(scriptIndex, 1);
      }
    }
  }

  // PWA 的文件缓存URL前缀
  static readonly PWA_CACHE_URL_PREFIX = import.meta.env.VITE_API_BASE_URL + "VirtualFile/GetPublishFile";

  // cacheName
  static readonly CACHE_NAME = "api-cache-v1";

  /**
   * 更新PWA的文件缓存
   */
  static async UpdateFileCache(updateFiles: Array<{ fileId: string; fullPath: string }>) {
    for (const file of updateFiles) {
      let cache = await caches.open(Compiler.CACHE_NAME);
      let url = Compiler.PWA_CACHE_URL_PREFIX + "?fileId=" + file.fileId;
      let response = await cache.match(url);
      // 如果缓存中没有该文件，则匹配 fullPath
      if (!response) {
        url = Compiler.PWA_CACHE_URL_PREFIX + "?fullPath=" + encodeURIComponent(file.fullPath);
        response = await cache.match(url);
      }
      if (response) {
        // 获取缓存的文件
        let cacheFile = (await response.json()).data as CompiledFile;
        if (!cacheFile) continue;
        Compiler.DeleteFile(cacheFile.fileId);
        // 删除缓存
        await cache.delete(response.url);
      }
    }
  }

  /**
   * 检查更新
   */
  static async CheckUpdate() {
    try {
      let cache = await caches.open(Compiler.CACHE_NAME);
      let keys = await cache.keys();
      let checkId2UrlMap = {};
      for (const key of keys) {
        let response = await cache.match(key);
        let file = (await response.json()).data as CompiledFile;
        if (file) {
          checkId2UrlMap[file["id"]] = {
            url: key.url,
            fileId: file.fileId,
          };
        }
      }

      // 文件ID列表
      let param = Object.keys(checkId2UrlMap);
      console.log("检查更新", param);

      // 存在更新的文件列表
      let updateFileIds = (await GlobalApi.CheckUpdate(param)).data as string[];
      for (const id of updateFileIds) {
        let { url, fileId } = checkId2UrlMap[id];
        console.log("存在更新", url);

        Compiler.DeleteFile(fileId);
        await cache.delete(url);
      }
    } catch {}
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
  let file = await Compiler.GetPublishFile(path, "fullPath");
  let url = Compiler.fileId2BlobUrlMap.get(file.fileId);
  return import(/* @vite-ignore */ url);
};
