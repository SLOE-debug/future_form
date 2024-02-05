import SvgIcon from "@/Components/SvgIcon";
import { suffix2Color } from "@/Utils/VirtualFileSystem/Index";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { Component, Vue, Watch } from "vue-facing-decorator";
import { VritualFileSystemDeclare } from "@/Types/VritualFileSystemDeclare";
import Editor from "@/Core/Editor/Editor";
import { Debounce } from "@/Utils/Index";
import DesignerSpace from "../Designer/DesignerSpace";

type IFile = VritualFileSystemDeclare.IFile;

export const editor = new Editor();

@Component
export default class EditorPage extends Vue {
  get Style() {
    return {
      marginLeft: this.$Store.get.Page.SidebarWidth + "px",
      width: `calc(100% - ${this.$Store.get.Page.SidebarWidth}px)`,
    };
  }

  @Watch("Style")
  @Debounce(100)
  OnStyleChange(nv: any, ov: any) {
    this.$nextTick(() => {
      editor.editor?.layout();
    });
  }

  get File() {
    return this.$Store.get.VirtualFileSystem.CurrentFile;
  }

  isDesigner: boolean = false;

  /**
   * 旧文件
   */
  oldFile: IFile;
  /**
   * 文件变化时，切换编辑器
   * @param nv 新文件
   * @param ov 旧文件
   */
  @Watch("File")
  OnFileChange(nv: IFile, ov: IFile) {
    if (!nv || nv.specialFile) return;
    if (nv.suffix == "des") {
      this.isDesigner = true;
      return;
    } else {
      this.isDesigner = false;
      this.$nextTick(() => {
        editor.SwitchFile(nv, ov);
      });
    }
  }

  created() {
    this.$nextTick(() => editor.SetContianer(this.$refs.editor as HTMLElement));
    editor.CreateAllFileModel();
  }

  RenderTabItemIcon(m: IFile) {
    if (m.isUnsaved && !m.showClose) {
      return <FontAwesomeIcon icon={"circle"} class={css.unsaved}></FontAwesomeIcon>;
    }

    if (m.selected || m.showClose) {
      return (
        <FontAwesomeIcon
          icon={"xmark"}
          {...{
            onClick: async (e: MouseEvent) => {
              this.$Store.dispatch("VirtualFileSystem/CloseFile", m);
              if (this.$Store.get.VirtualFileSystem.OpenFiles.length == 0) {
                editor.Dispose();
              }
              e.stopPropagation();
            },
          }}
        ></FontAwesomeIcon>
      );
    }

    return <div style={{ width: "18px" }}></div>;
  }

  render() {
    return (
      <div style={this.Style} class={css.editor}>
        <div class={css.tabs}>
          {this.$Store.get.VirtualFileSystem.OpenFiles.map((m) => {
            return (
              <div
                class={[css.item, this.$Store.get.VirtualFileSystem.CurrentFile == m ? css.active : ""].join(" ")}
                onClick={(e) => {
                  this.$Store.dispatch("VirtualFileSystem/SelectFile", m);
                }}
                onMouseenter={() => {
                  m.showClose = true;
                }}
                onMouseleave={() => {
                  m.showClose = false;
                }}
              >
                <SvgIcon {...{ name: `${m.suffix}FileSuffix`, color: suffix2Color[m.suffix] }}></SvgIcon>
                <span>{m.name}</span>
                {this.RenderTabItemIcon(m)}
              </div>
            );
          })}
        </div>
        <div class={css.content}>
          <DesignerSpace v-show={this.isDesigner} ref={"designerSpace"}></DesignerSpace>
          <div ref="editor" class={css.editorInstance}></div>
        </div>
      </div>
    );
  }
}
