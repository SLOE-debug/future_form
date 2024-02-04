import { VritualFileSystem } from "@/Types/VirtualFileSystem";
import { Component, Emit, Prop, Vue } from "vue-facing-decorator";

type Coord = VritualFileSystem.Coord;
type IDirectory = VritualFileSystem.IDirectory;
type IFile = VritualFileSystem.IFile;

@Component
export default class ContextMenu extends Vue {
  get position(): Coord {
    return this.$Store.get.VirtualFileSystem.ContextMenuPosition;
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
        let entity = (await this.$Store.dispatch("VirtualFileSystem/GetCurrentEntity")) as IDirectory | IFile;
        setTimeout(() => {
          entity.isRename = true;
        }, 0);
        break;
      default:
        break;
    }
    this.Close();
  }

  get ContextMenus() {
    return this.$Store.get.VirtualFileSystem.ContextMenus;
  }

  render() {
    if (!this.position) return;
    return (
      <div class={css.contextMenu} style={this.style}>
        <ul>
          {this.ContextMenus.map((m) => {
            return (
              <li
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
