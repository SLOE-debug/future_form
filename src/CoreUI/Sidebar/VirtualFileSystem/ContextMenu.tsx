import { VritualFileSystemDeclare } from "@/Types/VritualFileSystemDeclare";
import { UtilsDeclare } from "@/Types/UtilsDeclare";
import { Component, Emit, Prop, Vue } from "vue-facing-decorator";
import {
  ElMessage,
  ElMessageBox,
} from "element-plus";

type Coord = UtilsDeclare.Coord;
type IDirectory = VritualFileSystemDeclare.IDirectory;
type IFile = VritualFileSystemDeclare.IFile;

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
      case "delete":
        ElMessageBox.confirm('确定要删除吗?','系统消息',{
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          }
        )
        .then(async () => {
          let entity = (await this.$Store.dispatch("VirtualFileSystem/GetCurrentEntity")) as IDirectory | IFile;
          
          if ("directories" in entity) {
            this.$Store.dispatch("VirtualFileSystem/DeleteDirectory", entity);
          } else {
            this.$Store.dispatch("VirtualFileSystem/DeleteFile", entity);
          }

          ElMessage({message: '删除成功！',type: 'success',});
        })
        .catch(() => {

        })
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
