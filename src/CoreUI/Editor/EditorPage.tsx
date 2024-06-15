import SvgIcon from "@/Components/SvgIcon";
import { suffix2Color } from "@/Utils/VirtualFileSystem/Index";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { Component, Vue, Watch } from "vue-facing-decorator";
import { VritualFileSystemDeclare } from "@/Types/VritualFileSystemDeclare";
import Editor from "@/Core/Editor/Editor";
import DesignerSpace from "../Designer/DesignerSpace";
import SqlConfigurator from "../Designer/SqlConfigurator";

type IFile = VritualFileSystemDeclare.IFile;

export const editor = new Editor();

@Component
export default class EditorPage extends Vue {
  declare $refs: any;

  get Style() {
    return {
      marginLeft: this.$Store.get.Page.SidebarWidth + "px",
      width: `calc(100% - ${this.$Store.get.Page.SidebarWidth}px)`,
    };
  }

  get File() {
    return this.$Store.get.VirtualFileSystem.CurrentFile;
  }

  isDesigner: boolean = false;
  isSqlEditor: boolean = false;

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
    if (!nv) {
      this.isDesigner = false;
      this.isSqlEditor = false;
      return;
    }
    this.$nextTick(() => {
      editor.SwitchFile(nv, ov);
    });
    switch (nv.suffix) {
      case VritualFileSystemDeclare.FileType.Sql:
        this.isSqlEditor = true;
        this.isDesigner = false;
        this.$nextTick(() => {
          this.$refs.sqlConfigurator.AnalysisSql(nv.content);
        });
        break;
      case VritualFileSystemDeclare.FileType.FormDesigner:
        this.isDesigner = true;
        this.isSqlEditor = false;
        break;
      default:
        this.isDesigner = false;
        this.isSqlEditor = false;
        break;
    }
  }

  created() {
    this.$nextTick(() => editor.SetContianer(this.$refs.editor as HTMLElement));
    editor.CreateAllFileModel();
    editor.OnModelChange(() => {
      if (this.isSqlEditor) this.$refs.sqlConfigurator.AnalysisSql(editor.editor.getValue());
    });
  }

  unmouted() {
    editor.Dispose();
  }

  RenderTabItemIcon(m: IFile) {
    let icon = null;
    if (m.isUnsaved && !m.showClose) {
      icon = <FontAwesomeIcon icon={"circle"} class={css.unsaved} />;
    }

    if (!icon && (m.selected || m.showClose)) {
      icon = (
        <FontAwesomeIcon
          icon={"xmark"}
          {...{
            onClick: async (e: MouseEvent) => {
              this.$Store.dispatch("VirtualFileSystem/CloseFile", m);
              if (this.$Store.get.VirtualFileSystem.OpenFiles.length == 0) {
                this.isDesigner = false;
              }
              e.stopPropagation();
            },
          }}
        />
      );
    }

    return <div class={css.close}>{icon}</div>;
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
                <SvgIcon {...{ name: `FileSuffix_${m.suffix}`, color: suffix2Color[m.suffix] }}></SvgIcon>
                <span>{m.name}</span>
                {this.RenderTabItemIcon(m)}
              </div>
            );
          })}
        </div>
        <div class={css.content}>
          {this.isDesigner && this.$Store.get.VirtualFileSystem.CurrentFile && (
            <DesignerSpace ref={"designerSpace"} key={this.$Store.get.VirtualFileSystem.CurrentFile.id}></DesignerSpace>
          )}
          {this.isSqlEditor && <SqlConfigurator ref="sqlConfigurator"></SqlConfigurator>}
          <div
            ref="editor"
            class={css.editorInstance}
            style={{ width: this.isSqlEditor ? "calc(100% - 280px)" : "100%" }}
          ></div>
        </div>
      </div>
    );
  }
}
