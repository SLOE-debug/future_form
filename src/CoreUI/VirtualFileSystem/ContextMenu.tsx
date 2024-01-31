import { VritualFileSytem } from "@/Types/VirtualFileSystem";
import { Component, Emit, Prop, Vue } from "vue-facing-decorator";

type Coord = VritualFileSytem.Coord;
type IDirectory = VritualFileSytem.IDirectory;
type IFile = VritualFileSytem.IFile;

@Component
export default class ContextMenu extends Vue {
  @Prop
  position!: Coord;

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

  render() {
    if (!this.position) return;
    return (
      <div class={css.contextMenu} style={this.style}>
        <ul>
          {this.$Store.state.VirtualFileSystem.ContextMenus.map((m) => {
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
