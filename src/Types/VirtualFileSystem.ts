export namespace VritualFileSytem {
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
    suffix: string;
    content: string;
  }

  export interface IDirectory extends Basic {
    spread: boolean;
    files: IFile[];
    directories: IDirectory[];
  }
  export type Coord = {
    x: number;
    y: number;
  };

  export type MenuItem = {
    text: string;
    code: string;
    shortcutKey?: string;
  };
}
