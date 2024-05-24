export default {
  /**
   * 保存根目录
   */
  SaveRoot: {
    method: "POST",
    url: "VirtualFile/SaveRoot",
  },
  /**
   * 获取根目录
   */
  GetRoot: {
    method: "GET",
    url: "VirtualFile/GetRoot",
  },
  /**
   * 获取指定版本的根目录
   */
  GetRootByVersion: {
    method: "GET",
    url: "VirtualFile/GetRootByVersion",
  },
  /**
   * 通过文件ID获取历史版本列表
   */
  GetVersions: {
    method: "GET",
    url: "VirtualFile/GetVersions",
  },
  /**
   * 发布
   */
  Publish: {
    method: "POST",
    url: "VirtualFile/Publish",
  },
  /**
   * 通过文件ID获取发布的文件
   */
  GetPublishFile: {
    method: "GET",
    url: "VirtualFile/GetPublishFile",
  },
};
