export namespace VritualFileSystemDeclare {
  export interface Basic {
    id: string;
    path: string;
    isRename: boolean;
    isProtected: boolean;
    selected: boolean;
    name: string;
    parent: Basic;
    Delete(): void;
    GetFullName(): string;
    Rename(): void;
  }

  export interface IFile extends Basic {
    showClose: boolean;
    isUnsaved: boolean;
    isNewFile: boolean;
    suffix: string;
    content: string;
    specialFile: boolean;
    children: IFile[];
    extraData: any;
    versionDescription: string;
    AddFile(...files: IFile[]): void;
  }

  export interface IDirectory extends Basic {
    spread: boolean;
    files: IFile[];
    directories: IDirectory[];
    AddFile(...files: IFile[]): void;
    AddDirectory(...directorys: IDirectory[]): void;
  }

  // 对比文件
  export interface ICompareFile extends IFile {
    originContent: string;
    originExtraData: any;
  }

  export type MenuItem = {
    text: string;
    code: string;
    shortcutKey?: string;
  };

  export enum FileType {
    Ts = "ts",
    FormDesigner = "form.ts",
    Sql = "sql",
  }
}
