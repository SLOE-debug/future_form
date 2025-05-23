import { VritualFileSystemDeclare } from "@/Types/VritualFileSystemDeclare";
import { UtilsDeclare } from "@/Types/UtilsDeclare";
import { Component, Emit, Vue } from "vue-facing-decorator";
import { useVirtualFileSystemStore } from "@/Stores/VirtualFileSystemStore";

type Coord = UtilsDeclare.Coord;
type IDirectory = VritualFileSystemDeclare.IDirectory;
type IFile = VritualFileSystemDeclare.IFile;

@Component
export default class ContextMenu extends Vue {
  get virtualFileSystemStore() {
    return useVirtualFileSystemStore();
  }

  get position(): Coord {
    return this.virtualFileSystemStore.contextMenuPosition;
  }

  get style() {
    let { x, y } = this.position;
    return {
      left: x + "px",
      top: y + "px",
    };
  }

  @Emit("close")
  Close() {}

  async Select(item: any) {
    switch (item.code) {
      case "rename":
        ((await this.$Store.dispatch("VirtualFileSystem/GetCurrentEntity")) as IDirectory | IFile).Rename();
        break;
      case "delete":
        ((await this.$Store.dispatch("VirtualFileSystem/GetCurrentEntity")) as IDirectory | IFile).Delete();
        break;
      default:
        break;
    }
    this.Close();
  }

  get ContextMenus() {
    return this.virtualFileSystemStore.contextMenus;
  }

  render() {
    if (!this.position) return;
    return (
      <div class="contextMenu absolute z-[1000] bg-[#3c3c3c] w-[240px] rounded-[4px]" style={this.style}>
        <ul class="w-full h-full p-[5px]">
          {this.ContextMenus.map((m) => {
            return (
              <li
                class="h-[25px] text-white text-[14px] flex items-center justify-between p-[0_20px] hover:bg-[#094771]"
                onMousedown={(e: MouseEvent) => {
                  this.Select(m);
                  e.stopPropagation();
                }}
              >
                <span>{m.text}</span>
                <span>{m.shortcutKey}</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}
