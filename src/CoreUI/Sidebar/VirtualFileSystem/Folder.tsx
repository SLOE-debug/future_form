import { Component, Inject, Prop, Vue } from "vue-facing-decorator";
import Entity from "./Entity";
import { VritualFileSystemDeclare } from "@/Types/VritualFileSystemDeclare";
import { IsDirectory } from "@/Utils/VirtualFileSystem/Index";

type IDirectory = VritualFileSystemDeclare.IDirectory;

@Component
export default class Folder extends Vue {
  @Prop({ default: 0 })
  level: number;

  @Inject
  directory: IDirectory;

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
              this.$Store.dispatch("VirtualFileSystem/SelectDirectory", entity);
            } else {
              this.$Store.dispatch("VirtualFileSystem/SelectFile", entity);
            }
            this.$Store.dispatch("VirtualFileSystem/ClearContextMenuPosition");
            e.stopPropagation();
          },
        };
        return <Entity {...prop}></Entity>;
      });
  }
}
