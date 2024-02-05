export namespace VritualFileSystemDeclare {
  export interface Basic {
    id: string;
    path: string;
    isRename: boolean;
    isProtected: boolean;
    selected: boolean;
    name: string;
    Delete(): void;
    GetFullName(): string;
  }

  export interface IFile extends Basic {
    showClose: boolean;
    isUnsaved: boolean;
    suffix: string;
    content: string;
    specialFile: boolean;
    spread: boolean;
    children: IFile[];
  }

  export interface IDirectory extends Basic {
    spread: boolean;
    files: IFile[];
    directories: IDirectory[];
  }

  export type MenuItem = {
    text: string;
    code: string;
    shortcutKey?: string;
  };
}
