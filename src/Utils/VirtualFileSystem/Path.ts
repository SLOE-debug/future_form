export class Path {
  /**
   * 通过当前文件绝对路径和引用文件相对路径获取引用文件绝对路径
   * @param currentPath 当前文件绝对路径
   * @param relativePath 引用文件相对路径
   * @returns 引用文件绝对路径
   */
  static GetAbsolutePath(currentPath: string, relativePath: string) {
    let current = currentPath.split("/").filter((p) => !!p);
    let relative = relativePath.split("/").filter((p) => !!p);
    let path = current.slice(0, current.length - 1);
    relative.forEach((p) => {
      if (p === "..") {
        path.pop();
      } else if (p !== ".") {
        path.push(p);
      }
    });
    return path.join("/");
  }

  /**
   * 通过当前文件绝对路径和引用文件绝对路径获取引用文件相对路径
   * @param currentFullName 当前文件绝对路径
   * @param referenceFullName 引用文件绝对路径
   * @returns 引用文件相对路径
   */
  static GetRelativePath(currentFullName: string, referenceFullName: string) {
    currentFullName = Path.RemoveSuffix(currentFullName);
    referenceFullName = Path.RemoveSuffix(referenceFullName);
    let current = currentFullName.split("/");
    let reference = referenceFullName.split("/");
    let path = "";
    let i = 0;
    if (current.length <= reference.length) {
      path = "./";
    }
    while (i < current.length && i < reference.length) {
      if (current[i] !== reference[i]) {
        break;
      }
      i++;
    }
    for (let j = i; j < current.length - 1; j++) {
      path += "../";
    }
    for (let j = i; j < reference.length - 1; j++) {
      path += reference[j] + "/";
    }
    path += reference[reference.length - 1];
    return path;
  }

  /**
   * 去除文件名后缀
   * @param name 文件名
   * @returns 文件名
   */
  static RemoveSuffix(name: string) {
    return name.substring(0, name.lastIndexOf("."));
  }

  /**
   * 获取文件名
   * @param path 文件路径
   * @param suffix 是否包含后缀
   * @returns 文件名
   */
  static GetFileName(path: string, suffix: boolean = true) {
    let name = path.substring(path.lastIndexOf("/") + 1);
    if (!suffix) {
      name = this.RemoveSuffix(name);
    }
    return name;
  }

  /**
   * 补全文件后缀
   * @param path 文件路径
   * @param suffix 后缀
   * @returns 文件路径
   */
  static ComplementSuffix(path: string, suffix: string) {
    let name = path.substring(path.lastIndexOf("/") + 1);
    if (name.indexOf(".") === -1) {
      return path + suffix;
    }
    return path;
  }

  /**
   * 通过文件的FullPath获取文件的路径
   */
  static GetPathByFullPath(fullPath: string) {
    return fullPath.substring(0, fullPath.lastIndexOf("/"));
  }
}
