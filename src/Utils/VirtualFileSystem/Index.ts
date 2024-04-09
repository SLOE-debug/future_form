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

/**
 * 获取设计器后台文件，例：tets.form.ts 的关联文件 test.ts
 */
export function GetDesignerBackgroundFile() {
  let backgroundFile = store.get.VirtualFileSystem.CurrentFile;
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
  let files: Array<IFile> = [];
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
      // 将 file 中的 _name 转换为 name
      let file = { ...dir } as any;
      file.fileId = file.id;
      delete file.id;
      file.name = file._name;
      file.isProtected = file._isProtected;
      file.fullPath = dir.GetFullName();
      delete file._name;
      delete file._isProtected;
      files.push(file);
    }
  }
  return files;
}
