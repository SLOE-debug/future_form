import { Component, Inject, Prop, Vue } from "vue-facing-decorator";
import Entity from "./Entity";
import { VritualFileSystemDeclare } from "@/Types/VritualFileSystemDeclare";
import { IsDirectory } from "@/Utils/VirtualFileSystem/Index";
import { useVirtualFileSystemStore } from "@/Stores/VirtualFileSystemStore";

type IDirectory = VritualFileSystemDeclare.IDirectory;
type IFile = VritualFileSystemDeclare.IFile;

@Component
export default class Folder extends Vue {
  @Prop({ default: 0 })
  level: number;

  @Inject
  directory: IDirectory;

  get virtualFileSystemStore() {
    return useVirtualFileSystemStore();
  }

  render() {
    let dirs = this.directory.directories;
    let entitys = [...dirs, ...this.directory.files];

    return entitys
      .filter((entity) => entity.deleted !== true)
      .map((entity, i) => {
        let dirsCount = dirs.length - 1;
        let index = i > dirsCount ? i - dirs.length : i;
        let isDirectory = IsDirectory(entity);
        let prop: any = {
          key: entity.id,
          level: this.level,
          index,
          isDirectory: isDirectory,
          onMousedown: (e: MouseEvent) => {
            if (isDirectory) {
              this.virtualFileSystemStore.SelectDirectory(entity as IDirectory);
            } else {
              this.virtualFileSystemStore.SelectFile(entity as IFile);
            }
            this.virtualFileSystemStore.ClearContextMenuPosition();
            e.stopPropagation();
          },
        };
        return <Entity {...prop}></Entity>;
      });
  }
}
