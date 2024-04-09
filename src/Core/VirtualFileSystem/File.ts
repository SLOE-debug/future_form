import { VritualFileSystemDeclare } from "@/Types/VritualFileSystemDeclare";
import Basic from "./Basic";

type IFile = VritualFileSystemDeclare.IFile;

export default class File extends Basic implements IFile {
  /**
   * 构造函数
   * @param _name 文件名称
   * @param _isProtected 是否是受保护的，意味着不可修改和删除的
   * @param _isNewFile 是否是新文件
   */
  constructor(_name: string, _isProtected: boolean = false, _isNewFile: boolean = true) {
    super(_isProtected);
    this.name = _name;
    this.isNewFile = _isNewFile;
  }

  /**
   * 是否新文件
   */
  isNewFile: boolean;

  /**
   * 文件名称
   */
  private _name: string;
  public get name(): string {
    return this._name;
  }
  public set name(v: string) {
    this._name = v;
    this.suffix = v.substring(v.indexOf(".") + 1);

    if (this.isNewFile && this.suffix == VritualFileSystemDeclare.FileType.FormDesigner) {
      this.specialFile = true;
      this.content = `export default class Page extends BaseWindow {
  constructor() {
    super('${this.id}');
  }
}`;
      let prefixname = v.split(".")[0];
      let tsName = prefixname + ".ts";

      if (this.children.length == 0) {
        let tsFile = new File(tsName);
        tsFile.content = `import Page from "../${prefixname}.form";\r\n\r\nexport default class ${prefixname} extends Page {\r\n\tconstructor() {\r\n\t\tsuper();\r\n\t}\r\n}`;
        this.AddFile(tsFile);
      } else {
        this.children[0].name = tsName;
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
   * 额外数据
   */
  extraData: any;

  /**
   * 版本描述
   */
  versionDescription: string;

  /**
   * 添加文件
   * @param files 文件
   */
  AddFile(...files: IFile[]) {
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      let prefix = this.name.substring(0, this.name.lastIndexOf("."));
      f.path = this.path + "/" + prefix;
    }
    this.children.push(...files);
  }
}
