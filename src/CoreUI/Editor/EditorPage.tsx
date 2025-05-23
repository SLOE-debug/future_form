import SvgIcon from "@/Components/SvgIcon";
import { suffix2Color } from "@/Utils/VirtualFileSystem/Index";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { Component, Vue, Watch } from "vue-facing-decorator";
import { VritualFileSystemDeclare, UtilsDeclare } from "@/Types";
import DesignerSpace from "../Designer/DesignerSpace";
import SqlConfigurator from "../Designer/SqlConfigurator";
import { useVirtualFileSystemStore } from "@/Stores/VirtualFileSystemStore";
import { usePageStore } from "@/Stores/PageStore";
import { createEditor, disposeEditor, editor } from "@/Utils/Designer";

type IFile = VritualFileSystemDeclare.IFile;

@Component
export default class EditorPage extends Vue {
  declare $refs: any;

  get virtualFileSystemStore() {
    return useVirtualFileSystemStore();
  }

  get pageStore() {
    return usePageStore();
  }

  get style() {
    return {
      marginLeft: this.pageStore.sidebarWidth + "px",
      width: `calc(100% - ${this.pageStore.sidebarWidth}px)`,
    };
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
  @Watch("virtualFileSystemStore.currentFile")
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
    this.ScrollToCurrentFile();
  }

  // 是否是移至tabs上方
  isMoveToTabs: boolean = false;

  /**
   * 鼠标滚轮事件
   */
  Wheel(e: WheelEvent) {
    if (this.isMoveToTabs) {
      e.stopPropagation();
      let tabs = this.$refs.tabs as HTMLElement;
      tabs.scrollLeft += e.deltaY;
    }
  }

  created() {
    this.$nextTick(() => editor.SetContianer(this.$refs.editor as HTMLElement));
    editor.CreateAllFileModel();
    editor.OnModelChange(() => {
      if (this.isSqlEditor) this.$refs.sqlConfigurator.AnalysisSql(editor.editor.getValue());
    });
    window.addEventListener("wheel", this.Wheel);
    window.addEventListener("click", this.Click);
  }

  unmouted() {
    window.removeEventListener("wheel", this.Wheel);
    window.removeEventListener("click", this.Click);
  }

  // 当 $Store.get.VirtualFileSystem.CurrentFile 改变时，滚动到当前文件
  ScrollToCurrentFile() {
    this.$nextTick(() => {
      // 通过当前 $Store.get.VirtualFileSystem.CurrentFile.id 设置 tabs div 的滚动位置
      let tabs = this.$refs.tabs as HTMLElement;
      let tabRect = tabs.getBoundingClientRect();
      let currentTab = this.$refs[this.virtualFileSystemStore.currentFile.id] as HTMLElement;
      let currentTabRect = currentTab.getBoundingClientRect();
      if (currentTabRect.left < tabRect.left) {
        tabs.scrollLeft += currentTabRect.left - tabRect.left;
      } else if (currentTabRect.right > tabRect.right) {
        tabs.scrollLeft += currentTabRect.right - tabRect.right;
      }
    });
  }

  // 当 $Store.get.VirtualFileSystem.OpenFiles.length 改变时
  @Watch("virtualFileSystemStore.openFiles.length")
  OnOpenFilesLengthChange() {
    if (this.virtualFileSystemStore.openFiles.length == 0) {
      this.isDesigner = false;
    }
  }

  // 是否显示右键菜单
  isShowContextMenu: boolean = false;
  // 右键菜单位置
  tabsContextMenuPosition: UtilsDeclare.Coord = { x: 0, y: 0 };

  /**
   * 鼠标点击隐藏右键菜单事件
   */
  Click() {
    this.isShowContextMenu = false;
  }

  /**
   * tabs 右键事件
   */
  TabsContextMenu(e: MouseEvent) {
    e.preventDefault();
    this.isShowContextMenu = true;
    this.tabsContextMenuPosition = { x: e.clientX, y: e.clientY };
  }

  /**
   * 关闭文件
   */
  Close(file: IFile) {
    this.$Store.dispatch("VirtualFileSystem/CloseFile", file);
  }

  /**
   * 关闭其他文件
   */
  CloseOther() {
    let currentFile = this.virtualFileSystemStore.openFiles[this.currentContextMenuFileIndex];
    let otherFiles = this.virtualFileSystemStore.openFiles.filter((m, i) => m.id != this.currentContextMenuFileId);
    this.$Store.dispatch("VirtualFileSystem/SetAutoSelectNearFile", false);
    for (const file of otherFiles) {
      this.Close(file);
    }
    this.$Store.dispatch("VirtualFileSystem/SetAutoSelectNearFile", true);
    this.$Store.dispatch("VirtualFileSystem/SelectFile", currentFile);
  }

  /**
   * 关闭右侧文件
   */
  CloseRight() {
    let currentFile = this.virtualFileSystemStore.openFiles[this.currentContextMenuFileIndex];
    let rightFiles = this.virtualFileSystemStore.openFiles.filter((m, i) => i > this.currentContextMenuFileIndex);
    this.$Store.dispatch("VirtualFileSystem/SetAutoSelectNearFile", false);
    for (let i = rightFiles.length - 1; i >= 0; i--) {
      this.Close(rightFiles[i]);
    }
    this.$Store.dispatch("VirtualFileSystem/SetAutoSelectNearFile", true);
    this.$Store.dispatch("VirtualFileSystem/SelectFile", currentFile);
  }

  /**
   * 关闭左侧文件
   */
  CloseLeft() {
    let currentFile = this.virtualFileSystemStore.openFiles[this.currentContextMenuFileIndex];
    let leftFiles = this.virtualFileSystemStore.openFiles.filter((m, i) => i < this.currentContextMenuFileIndex);
    this.$Store.dispatch("VirtualFileSystem/SetAutoSelectNearFile", false);
    for (const file of leftFiles) {
      this.Close(file);
    }
    this.$Store.dispatch("VirtualFileSystem/SetAutoSelectNearFile", true);
    this.$Store.dispatch("VirtualFileSystem/SelectFile", currentFile);
  }

  /**
   * 右键菜单列表
   */
  tabsContextMenuList = [
    { text: "关闭", code: "Close" },
    { text: "关闭其他", code: "CloseOther" },
    { text: "关闭右侧", code: "CloseRight" },
    { text: "关闭左侧", code: "CloseLeft" },
  ];

  // 当前触发右键菜单的文件ID
  currentContextMenuFileId: string = "";
  // 当前触发右键菜单的文件Index
  currentContextMenuFileIndex: number = -1;

  /**
   * 渲染右键上下文菜单
   */
  RenderContextMenu() {
    return (
      <div
        class="absolute bg-[#3c3c3c] w-[240px] z-[1000] rounded-[4px] p-[5px]"
        style={{ left: this.tabsContextMenuPosition.x + "px", top: this.tabsContextMenuPosition.y + "px" }}
      >
        {this.tabsContextMenuList.map((m) => {
          return (
            <div
              class="h-[25px] text-white text-[14px] flex items-center justify-between p-[0_20px] hover:bg-[#094771]"
              onClick={(e: MouseEvent) => {
                // 获取事件选中的文件
                let file = this.virtualFileSystemStore.openFiles.find((f) => f.id == this.currentContextMenuFileId);
                this[`${m.code}`] && this[`${m.code}`](file);
                this.isShowContextMenu = false;
              }}
            >
              {m.text}
            </div>
          );
        })}
      </div>
    );
  }

  /**
   * 渲染关闭/未保存图标
   * @param m
   * @returns
   */
  RenderTabItemIcon(m: IFile) {
    let icon = null;
    if (m.isUnsaved && !m.showClose) {
      icon = <FontAwesomeIcon icon={"circle"} class="unsaved p-[2px] text-[10px] mt-[1.5px]" />;
    }

    if (!icon && (m.selected || m.showClose)) {
      icon = (
        <FontAwesomeIcon
          icon={"xmark"}
          {...{
            onClick: async (e: MouseEvent) => {
              this.Close(m);
              e.stopPropagation();
            },
          }}
        />
      );
    }

    return (
      <div class="close w-[18px] [&>svg]:cursor-pointer [&>svg]:p-[2px_4px] [&>svg]:mt-[2px] [&>svg]:rounded-[2px] [&>svg]:hover:bg-[#3e3e40] [&>svg]:hover:bg-[#FFFFFF4D]">
        {icon}
      </div>
    );
  }

  render() {
    return (
      <div style={this.style} class="editor h-screen">
        <div
          class={["h-[35px] select-none w-full flex", css.tabs].join(" ")}
          ref="tabs"
          onMouseenter={(e) => {
            this.isMoveToTabs = true;
          }}
          onMouseleave={(e) => {
            this.isMoveToTabs = false;
          }}
          onContextmenu={this.TabsContextMenu}
        >
          {this.virtualFileSystemStore.openFiles.map((m, i) => {
            return (
              <div
                class={[
                  "item cursor-pointer text-[#e6e6e6] p-[0_10px] h-full flex items-center text-[.8rem] duration-[.15s] hover:bg-[#1e1e1e]",
                  this.virtualFileSystemStore.currentFile == m ? "active bg-[#1e1e1e]" : "",
                ].join(" ")}
                onClick={(e) => {
                  this.$Store.dispatch("VirtualFileSystem/SelectFile", m);
                }}
                onMouseenter={() => {
                  m.showClose = true;
                }}
                onMouseleave={() => {
                  m.showClose = false;
                }}
                ref={m.id}
                onContextmenu={(e) => {
                  this.currentContextMenuFileId = m.id;
                  this.currentContextMenuFileIndex = i;
                }}
              >
                <SvgIcon {...{ name: `FileSuffix_${m.suffix}`, color: suffix2Color[m.suffix] }}></SvgIcon>
                <span class="m-[0_8px]">{m.name}</span>
                {this.RenderTabItemIcon(m)}
              </div>
            );
          })}
          {
            // 右键菜单
            this.isShowContextMenu && this.RenderContextMenu()
          }
        </div>
        <div class="content relative h-[calc(100vh-35px)]">
          {this.isDesigner && this.virtualFileSystemStore.currentFile && (
            <DesignerSpace ref={"designerSpace"} key={this.virtualFileSystemStore.currentFile.id}></DesignerSpace>
          )}
          {this.isSqlEditor && (
            <SqlConfigurator ref="sqlConfigurator" key={this.virtualFileSystemStore.currentFile.id}></SqlConfigurator>
          )}
          <div
            ref="editor"
            class="editorInstance w-full h-full"
            style={{ width: this.isSqlEditor ? "calc(100% - 280px)" : "100%" }}
          ></div>
        </div>
      </div>
    );
  }
}
