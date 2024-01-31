import { VritualFileSytem } from "@/Types/VirtualFileSystem";
import Basic from "./Basic";

type IFile = VritualFileSytem.IFile;

export default class File extends Basic implements IFile {
  /**
   * 构造函数
   * @param _name 文件名称
   * @param _isProtected 是否是受保护的，意味着不可修改和删除的
   */
  constructor(_name: string, _isProtected: boolean = false) {
    super(_isProtected);
    this.name = _name;
  }

  /**
   * 文件名称
   */
  private _name: string;
  public get name(): string {
    return this._name;
  }
  public set name(v: string) {
    this._name = v;
    this.suffix = v.split(".").pop().toLowerCase() || "";
  }

  /**
   * 文件后缀
   */
  public suffix: string;

  /**
   * 文件内容
   */
  content: string;
}
