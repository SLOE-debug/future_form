import SvgIcon from "@/Components/SvgIcon";
import { suffix2Color } from "@/Utils/VirtualFileSystem/Index";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { Component, Vue, Watch } from "vue-facing-decorator";
import { VritualFileSytem } from "@/Types/VirtualFileSystem";
import Editor from "@/Core/Editor/Editor";

type IFile = VritualFileSytem.IFile;

const editor = new Editor();

@Component
export default class EditorPage extends Vue {
  get Style() {
    return {
      marginLeft: this.$Store.get.Page.FileSidebarWidth + "px",
      width: `calc(100% - ${this.$Store.get.Page.FileSidebarWidth}px)`,
    };
  }

  @Watch("Style")
  OnStyleChange(nv: any, ov: any) {
    editor.editor?.layout();
  }

  get File() {
    return this.$Store.get.VirtualFileSystem.CurrentFile;
  }

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
    this.$nextTick(() => {
      editor.SwitchFile(nv, ov);
    });
  }

  created() {
    this.$nextTick(() => editor.SetContianer(this.$refs.editor as HTMLElement));
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
              >
                <SvgIcon {...{ name: `tsFileSuffix`, color: suffix2Color["ts"] }}></SvgIcon>
                <span>{m.name}</span>
                <FontAwesomeIcon
                  icon={"xmark"}
                  {...{
                    onClick: (e: MouseEvent) => {
                      this.$Store.dispatch("VirtualFileSystem/CloseFile", m);
                      if (this.$Store.get.VirtualFileSystem.OpenFiles.length == 0) {
                        editor.Dispose();
                      }
                      e.stopPropagation();
                    },
                  }}
                ></FontAwesomeIcon>
              </div>
            );
          })}
        </div>
        <div class={css.content}>
          <div
            ref="editor"
            class={css.editorInstance}
            onDblclick={(e) => {
              editor.GetCompiledCode();
            }}
          ></div>
          {/* <div style={{ color: "white" }}>编辑文件</div> */}
        </div>
      </div>
    );
  }
}
