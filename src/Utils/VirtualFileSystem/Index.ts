import { VritualFileSystemDeclare } from "@/Types/VritualFileSystemDeclare";

type IFile = VritualFileSystemDeclare.IFile;
type IDirectory = VritualFileSystemDeclare.IDirectory;

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

// 排除的文件后缀
export const excludeSuffix = ["uid", "des"];
