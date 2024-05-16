import Basic from "./Basic";
import { VritualFileSystemDeclare } from "@/Types/VritualFileSystemDeclare";

type IComepareFile = VritualFileSystemDeclare.ICompareFile;

/**
 * 对比文件
 */
export default class CompareFile extends Basic implements IComepareFile {
  /**
   * 构造函数
   */
  constructor(
    _name: string,
    _suffix: string,
    _originContent: string,
    _content: string,
    _originExtraData: any,
    _extraData: any
  ) {
    super(false);
    this.name = _name;
    this.originContent = _originContent;
    this.suffix = _suffix;
    this.content = _content;
    this.originExtraData = _originExtraData;
    this.extraData = _extraData;
  }

  originContent: string;
  originExtraData: any;
  name: string;
  showClose: boolean = false;
  isUnsaved: boolean;
  suffix: string = "";
  content: string = "";
  specialFile: boolean = false;
  children: VritualFileSystemDeclare.IFile[] = null;
  extraData: any = null;
  versionDescription: string = "";
  isNewFile: boolean = false;
  AddFile(...files: VritualFileSystemDeclare.IFile[]): void {}
}
