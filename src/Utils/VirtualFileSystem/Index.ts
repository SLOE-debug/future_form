import { VritualFileSytem } from "@/Types/VirtualFileSystem";

type IFile = VritualFileSytem.IFile;
type IDirectory = VritualFileSytem.IDirectory;

export function IsDirectory(entity: IFile | IDirectory): entity is IDirectory {
  return (entity as IDirectory).directories !== undefined;
}

/**
 * 文件后缀对应的颜色
 */
export const suffix2Color = {
  ts: "#007acc",
  vue: "#41b883",
  scss: "#c6538c",
  html: "#e34c26",
  css: "#563d7c",
  js: "#f1e05a",
  json: "#f1e05a",
  md: "#f1e05a",
  txt: "#f1e05a",
};
