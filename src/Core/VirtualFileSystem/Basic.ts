import { VritualFileSystemDeclare } from "@/Types/VritualFileSystemDeclare";
import { Guid } from "@/Utils/Index";
import { GetParentByDirectory, GetParentByFile, IsDirectory } from "@/Utils/VirtualFileSystem/Index";
import store from "@/Vuex/Store";
import { h } from "vue";

type IDirectory = VritualFileSystemDeclare.IDirectory;
type IFile = VritualFileSystemDeclare.IFile;

export default abstract class Basic {
  /**
   * 唯一标识
   */
  id: string = Guid.NewGuid();
  /**
   * 路径
   */
  get path() {
    if (this.parent) {
      let parentPath = this.parent.path;

      return parentPath + (parentPath ? "/" : "") + this.parent.name;
    }
    return "";
  }
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
   * 父级
   */
  parent: Basic;

  /**
   * 是否是受保护的，意味着不可修改和删除的
   */
  _isProtected: boolean = false;
  get isProtected(): boolean {
    return this._isProtected;
  }

  /**
   * 构造函数
   * @param _isProtected 是否是受保护的，意味着不可修改和删除的
   */
  constructor(_isProtected: boolean = false) {
    this._isProtected = _isProtected;
  }

  /**
   * 获取全名
   * @returns 全名
   */
  GetFullName() {
    return `${this.path ? this.path + "/" : ""}${this.name}`;
  }

  /**
   * 重命名
   */
  Rename() {
    // 如果当前是文件，则获取父级
    if (!IsDirectory(this)) {
      let parent = GetParentByFile(this as unknown as IFile);
      // 如果父级是特殊文件
      if (!IsDirectory(parent) && parent.specialFile) {
        ElMessage.error("子文件不允许重命名！");
        return;
      }
    }

    this.isRename = true;
  }

  /**
   * 删除
   */
  async Delete() {
    try {
      // 当前文件夹/文件集合
      let collection: Array<IDirectory | IFile> = [];
      // 删除下标
      let index: number = -1;
      // 是否是设计文件
      let isDesignFile: boolean = false;

      // 如果当前是文件夹
      if (IsDirectory(this)) {
        let dir = this as IDirectory;
        let parent = GetParentByDirectory(dir);
        collection = parent.directories;
        index = parent.directories.indexOf(dir);
      } else {
        let file = this as unknown as IFile;
        let parent = GetParentByFile(file);
        isDesignFile = file.suffix == VritualFileSystemDeclare.FileType.FormDesigner;
        if (IsDirectory(parent)) {
          collection = (parent as IDirectory).files;
          index = (parent as IDirectory).files.indexOf(file);
        } else {
          isDesignFile = parent.suffix == VritualFileSystemDeclare.FileType.FormDesigner;
          // 如果parent是特殊文件
          if (parent.specialFile) {
            let parentParent = GetParentByFile(parent) as IDirectory;
            collection = parentParent.files;
            index = parentParent.files.indexOf(parent);
          }
        }
      }

      let node = h("p", null, [h("span", null, "确认删除嘛？")]);
      if (isDesignFile) {
        node = h("p", null, [
          h("strong", { style: "color: red" }, "您正在删除一个设计文件！"),
          h("br"),
          h("span", null, "确认删除嘛？"),
        ]);
      }

      await ElMessageBox.confirm(node, "警告", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      });
      collection.splice(index, 1);
    } catch {}
  }
}
