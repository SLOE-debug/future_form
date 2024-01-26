export  namespace VritualFileSytem {
  export interface BaseEntity {
    name: string;
    Delete: () => void;
  }

  export interface IFile extends BaseEntity {
    content: string;
  }

  export interface IDirectory extends BaseEntity {
    files: IFile[];
    directories: IDirectory[];
  }
}
