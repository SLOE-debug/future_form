import { VritualFileSystem } from "@/Types/VirtualFileSystem";
import Basic from "./Basic";
import { Path } from "@/Utils/VirtualFileSystem/Path";

type IFile = VritualFileSystem.IFile;

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
    if (this.suffix == "uid") {
      this.specialFile = true;
      let prefixname = Path.RemoveSuffix(v);

      let desName = prefixname + ".des";
      let tsName = prefixname + ".ts";

      if (this.children.length == 0) {
        this.children.push(new File(desName));
        this.children.push(new File(tsName));
      } else {
        this.children[0].name = desName;
        this.children[1].name = tsName;
      }
    }
  }

  /**
   * 文件后缀
   */
  suffix: string;

  /**
   * 文件内容
   */
  content: string = "";

  /**
   * 是否未保存
   */
  isUnsaved: boolean = false;

  /**
   * 是否显示关闭按钮
   */
  showClose: boolean = false;

  /**
   * 是否是特殊文件
   */
  specialFile: boolean = false;

  /**
   * 子文件
   */
  children: IFile[] = [];

  /**
   * 是否展开
   */
  spread: boolean = false;
}
