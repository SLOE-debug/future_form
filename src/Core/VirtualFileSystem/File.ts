import { VritualFileSytem } from "@/Types/VirtualFileSystem";
import BaseEntity from "./BaseEntity";

type IFile = VritualFileSytem.IFile;

export default class File extends BaseEntity implements IFile {
  /**
   * 构造函数
   * @param _name 文件名称
   */
  constructor(_name: string) {
    super();
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
