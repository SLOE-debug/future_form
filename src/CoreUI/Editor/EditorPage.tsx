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
      marginLeft: this.$Store.state.Page.FileSidebarWidth + "px",
      width: `calc(100% - ${this.$Store.state.Page.FileSidebarWidth}px)`,
    };
  }

  get File() {
    return this.$Store.state.VirtualFileSystem.CurrentFile;
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
          <div class={css.item}>
            <SvgIcon {...{ name: `tsFileSuffix`, color: suffix2Color["ts"] }}></SvgIcon>
            <span>index.ts</span>
            <FontAwesomeIcon icon={"xmark"}></FontAwesomeIcon>
          </div>
        </div>
        <div class={css.content}>
          <div ref="editor" class={css.editorInstance}></div>
          {/* <div style={{ color: "white" }}>编辑文件</div> */}
        </div>
      </div>
    );
  }
}
