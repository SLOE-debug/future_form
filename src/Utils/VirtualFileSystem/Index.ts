import { VritualFileSystemDeclare } from "@/Types/VritualFileSystemDeclare";
import store from "@/Vuex/Store";

type IFile = VritualFileSystemDeclare.IFile;
type IDirectory = VritualFileSystemDeclare.IDirectory;

/**
 * 判断是否是文件夹
 */
export function IsDirectory(entity: IFile | IDirectory): entity is IDirectory {
  return (entity as IDirectory).directories !== undefined;
}

/**
 * 文件后缀对应的颜色
 */
export const suffix2Color = {
  ts: "#007acc",
  txt: "#f1e05a",
  "form.ts": "rgb(165 127 255)",
  sql: "rgb(217 179 53)",
};

/**
 * 获取文件父级
 * @param file 文件
 * @returns 文件父级
 */
export function GetParentByFile(file: IFile) {
  let parent: IFile | IDirectory = null;
  let dirs = [store.get.VirtualFileSystem.Root] as Array<IFile | IDirectory>;
  while (dirs.length > 0) {
    let dir = dirs.shift();
    if (IsDirectory(dir)) {
      if (dir.files.includes(file)) {
        parent = dir;
        break;
      } else {
        dirs.push(...dir.directories);
        dirs.push(...dir.files);
      }
    } else {
      if (dir.specialFile) {
        if (dir.children.includes(file)) {
          parent = dir;
          break;
        } else {
          dirs.push(...dir.children);
        }
      }
    }
  }
  return parent;
}
