import { Guid } from "@/Utils/Index";

export default abstract class Basic {
  /**
   * 唯一标识
   */
  id: string = Guid.NewGuid();
  /**
   * 路径
   */
  path: string = "";
  /**
   * 是否处于重命名状态
   */
  isRename: boolean = false;
  /**
   * 是否被选中
   */
  selected: boolean = false;
  /**
   * 名称
   */
  abstract name: string;
  /**
   * 是否是受保护的，意味着不可修改和删除的
   */
  _isProtected: boolean = false;
  get isProtected(): boolean {
    return this._isProtected;
  }

  constructor(_isProtected: boolean = false) {
    this._isProtected = _isProtected;
  }

  /**
   * 获取全名
   * @returns 全名
   */
  GetFullName() {
    return this.path + "/" + this.name;
  }

  Delete() {
    console.log("删除成功！");
  }
}
