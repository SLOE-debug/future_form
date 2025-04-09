import * as fs from "fs";
import * as path from "path";
import { Plugin } from "vite";

export default function autoImportSassPlugin(): Plugin {
  return {
    name: "auto-import-sass",
    transform(code, id) {
      // 只处理 .tsx 文件
      if (!id.endsWith(".tsx")) return null;

      // 获取相对路径
      const srcPath = path.resolve("src");
      const relativePath = path.relative(srcPath, id);
      // 构建 SASS 文件路径
      const sassRelativePath = relativePath.replace(".tsx", ".module.scss");
      const sassPath = `@/Assets/Sass/${sassRelativePath}`;
      // 构建实际文件系统路径用于检查文件是否存在
      const fullSassPath = path.resolve(srcPath, "Assets/Sass", sassRelativePath);
      // 检查 SASS 文件是否存在
      const exists = fs.existsSync(fullSassPath);
      if (exists) {
        // 使用正斜杠替换反斜杠，确保在任何操作系统上都能正常工作
        const importPath = sassPath.replace(/\\/g, "/");
        let prefix = `import css from "${importPath}";`;

        // 为 App.tsx 特殊处理
        if (path.basename(id) === "App.tsx") {
          prefix = `import "${importPath}";`;
        }

        return prefix + code;
      }

      return code;
    },
  };
}
