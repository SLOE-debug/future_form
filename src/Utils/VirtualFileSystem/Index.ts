import { VritualFileSystem } from "@/Types/VirtualFileSystem";

type IFile = VritualFileSystem.IFile;
type IDirectory = VritualFileSystem.IDirectory;

export function IsDirectory(entity: IFile | IDirectory): entity is IDirectory {
  return (entity as IDirectory).directories !== undefined;
}

/**
 * 文件后缀对应的颜色
 */
export const suffix2Color = {
  ts: "#007acc",
  txt: "#f1e05a",
  des: "rgb(165 127 255)",
};
