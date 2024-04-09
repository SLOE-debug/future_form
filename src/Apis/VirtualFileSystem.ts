export default {
  // 保存根目录
  SaveRoot: {
    method: "POST",
    url: "VirtualFile/SaveRoot",
  },
  // 获取根目录
  GetRoot: {
    method: "GET",
    url: "VirtualFile/GetRoot",
  },
  // 通过文件ID获取历史版本列表
  GetRootByVersion: {
    method: "GET",
    url: "VirtualFile/GetRootByVersion",
  },
};
