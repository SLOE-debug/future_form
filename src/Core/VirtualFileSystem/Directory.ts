import { VritualFileSytem } from "@/Types/VirtualFileSystem";

import BaseEntity from "./BaseEntity";

type IDirectory = VritualFileSytem.IDirectory;
type IFile = VritualFileSytem.IFile;

export default class Directory extends BaseEntity implements IDirectory {
  /**
   * 文件夹名称
   */
  name: string;
  /**
   * 文件
   */
  files: IFile[];
  /**
   * 子文件夹
   */
  directories: IDirectory[];
  /**
   * 构造函数
   * @param _name 文件夹名称
   */
  constructor(_name: string) {
    super();
    this.name = _name;
    this.files = [];
    this.directories = [];
  }
}
