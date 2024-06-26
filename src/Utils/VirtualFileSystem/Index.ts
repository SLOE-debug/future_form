import { VritualFileSystemDeclare } from "@/Types/VritualFileSystemDeclare";
import store from "@/Vuex/Store";
import { CloneStruct } from "../Index";

type IFile = VritualFileSystemDeclare.IFile;
type IDirectory = VritualFileSystemDeclare.IDirectory;
type Basic = VritualFileSystemDeclare.Basic;

/**
 * 判断是否是文件夹
 */
export function IsDirectory(entity: Basic): entity is IDirectory {
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
 * 获取文件夹的父级
 */
export function GetParentByDirectory(dir: IDirectory) {
  const queue: Array<IDirectory> = [store.get.VirtualFileSystem.Root];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current.directories.includes(dir)) {
      return current;
    }
    queue.push(...current.directories);
  }
  return null;
}

/**
 * 获取文件父级
 * @param file 文件
 * @returns 文件父级
 */
export function GetParentByFile(file: IFile) {
  const queue: Array<IFile | IDirectory> = [store.get.VirtualFileSystem.Root];

  while (queue.length > 0) {
    const current = queue.shift();

    // 处理目录类型
    if (IsDirectory(current)) {
      // 检查当前目录是否直接包含该文件
      if (current.files.includes(file)) {
        return current;
      }
      // 将子目录和文件加入队列
      queue.push(...current.directories, ...current.files);
    } else {
      // 处理特殊文件类型
      if (current.specialFile && current.children.includes(file)) {
        return current;
      }
      // 将子文件加入队列
      queue.push(...current.children);
    }
  }

  return null;
}

/**
 * 获取设计器后台文件，例：tets.form.ts 的关联文件 test.ts
 */
export function GetDesignerBackgroundFile() {
  let backgroundFile = store.get.VirtualFileSystem.CurrentFile;
  if (!backgroundFile) return;
  if (backgroundFile.suffix == VritualFileSystemDeclare.FileType.FormDesigner) {
    return backgroundFile.children[0];
  }
  backgroundFile = GetParentByFile(backgroundFile) as IFile;
  if (backgroundFile.suffix == VritualFileSystemDeclare.FileType.FormDesigner) {
    return backgroundFile.children[0];
  }

  return;
}

/**
 * 获取所有sql文件
 */
export function GetAllSqlFiles() {
  let sqlFiles: Array<IFile> = [];
  let dirs = [store.get.VirtualFileSystem.Root] as Array<IFile | IDirectory>;
  while (dirs.length > 0) {
    let dir = dirs.shift();
    if (IsDirectory(dir)) {
      dirs.push(...dir.directories);
      dirs.push(...dir.files);
    } else {
      if (dir.suffix == VritualFileSystemDeclare.FileType.Sql) {
        sqlFiles.push(dir);
      }
    }
  }
  return sqlFiles;
}

/**
 * 获取所有form文件
 */
export function GetAllFormFiles() {
  let formFiles: Array<IFile> = [];
  let dirs = [store.get.VirtualFileSystem.Root] as Array<IFile | IDirectory>;
  while (dirs.length > 0) {
    let dir = dirs.shift();
    if (IsDirectory(dir)) {
      dirs.push(...dir.directories);
      dirs.push(...dir.files);
    } else {
      if (dir.suffix == VritualFileSystemDeclare.FileType.FormDesigner) {
        formFiles.push(dir);
      }
    }
  }
  return formFiles;
}

/**
 * 通过id获取文件
 */
export function GetFileById(id: string) {
  let file: IFile;
  let dirs = [store.get.VirtualFileSystem.Root] as Array<IFile | IDirectory>;
  while (dirs.length > 0) {
    let dir = dirs.shift();
    if (IsDirectory(dir)) {
      dirs.push(...dir.directories);
      dirs.push(...dir.files);
      dir.files.forEach((file) => {
        dirs.push(...file.children);
      });
    } else {
      if (dir.id == id) {
        file = dir;
        break;
      }
    }
  }
  return file;
}

/**
 * 拍平Root，获取所有文件
 */
export function FlatRoot(root: IDirectory) {
  let files = [];
  let dirs = [root] as Array<IFile | IDirectory>;

  while (dirs.length > 0) {
    let dir = dirs.shift();
    if (IsDirectory(dir)) {
      dirs.push(...dir.directories);
      dirs.push(...dir.files);
      dir.files.forEach((file) => {
        dirs.push(...file.children);
      });
    } else {
      let m = dir as any;
      let file = {
        content: m.content,
        extraData: CloneStruct(m.extraData),
        fileId: m.id,
        name: m._name,
        fullPath: dir.GetFullName(),
        specialFile: m.specialFile,
        suffix: m.suffix,
        isProtected: m.isProtected,
      };

      files.push(file);
    }
  }
  return files;
}

// 备份的Root
export let backupRoot = [];

/**
 * 备份Root
 */
export function BackupRoot(root: IDirectory) {
  backupRoot = FlatRoot(root);
}
