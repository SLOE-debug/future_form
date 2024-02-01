import { VritualFileSytem } from "@/Types/VirtualFileSystem";

import Basic from "./Basic";

type IDirectory = VritualFileSytem.IDirectory;
type IFile = VritualFileSytem.IFile;

export default class Directory extends Basic implements IDirectory {
  /**
   * 文件夹名称
   */
  name: string;
  /**
   * 文件
   */
  files: IFile[] = [];
  /**
   * 子文件夹
   */
  directories: IDirectory[] = [];

  /**
   * 是否展开的
   */
  spread: boolean = false;

  /**
   * 添加文件夹
   * @param dirs 文件夹
   */
  AddDirectory(...dirs: IDirectory[]) {
    for (let i = 0; i < dirs.length; i++) {
      const d = dirs[i];
      d.path = `${this.path ? this.path + "/" : ""}${this.name}`;
    }

    this.directories.push(...dirs);
  }

  /**
   * 添加文件
   * @param files 文件
   */
  AddFile(...files: IFile[]) {
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      f.path = `${this.path ? this.path + "/" : ""}${this.name}`;
    }
    this.files.push(...files);
    this.files.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * 构造函数
   * @param _name 文件夹名称
   * @param _isProtected 是否是受保护的，意味着不可修改和删除的
   */
  constructor(_name: string, _isProtected: boolean = false) {
    super(_isProtected);
    this.name = _name;
    this.files = [];
    this.directories = [];
  }
}
