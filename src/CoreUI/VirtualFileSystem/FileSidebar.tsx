import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { Component, Provide, Vue } from "vue-facing-decorator";
import Folder from "./Folder";
import { VritualFileSytem } from "@/Types/VirtualFileSystem";
import ContextMenu from "./ContextMenu";

type IDirectory = VritualFileSytem.IDirectory;
type Coord = VritualFileSytem.Coord;

@Component
export default class FileSidebar extends Vue {
  topTools = [
    {
      icon: "folder",
      active: true,
      title: "文件夹",
    },
    {
      icon: "magnifying-glass",
      active: false,
      title: "搜索",
    },
  ];

  projectTools = [
    {
      icon: "file-circle-plus",
      title: "新建文件",
    },
    {
      icon: "folder-plus",
      title: "新建文件夹",
    },
  ];

  @Provide("directory")
  directory: IDirectory;
  created() {
    this.directory = this.$Store.state.VirtualFileSystem.Root;
  }

  ProjectToolItemClick(m: any) {
    switch (m.title) {
      case "新建文件":
        this.$Store.dispatch("VirtualFileSystem/CreateFile");
        break;
      case "新建文件夹":
        this.$Store.dispatch("VirtualFileSystem/CreateDirectory");
        break;
    }
  }

  startAdjustX: number = 0;
  BeginAdjust(e: MouseEvent) {
    this.startAdjustX = e.clientX;
    window.addEventListener("mousemove", this.Adjusting);
    window.addEventListener("mouseup", this.AdjustEnd);
    e.stopPropagation();
  }

  Adjusting(e: MouseEvent) {
    if (e.clientX < this.$Store.state.Page.FileSidebarMinWidth) return;
    let diff = e.clientX - this.startAdjustX;
    this.startAdjustX = e.clientX;
    this.$Store.dispatch("Page/AdjustFileSidebarWidth", diff);
  }

  AdjustEnd(e: MouseEvent) {
    window.removeEventListener("mousemove", this.Adjusting);
    window.removeEventListener("mouseup", this.AdjustEnd);
  }

  contextMenuPosition: Coord = null;
  OpenContextMenu(e: MouseEvent) {
    this.contextMenuPosition = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  }

  render() {
    return (
      <div
        class={css.sidebar}
        onMousedown={() => {
          this.$Store.dispatch("VirtualFileSystem/SelectDirectory", this.$Store.state.VirtualFileSystem.Root);
          this.contextMenuPosition = null;
        }}
        style={{ width: this.$Store.state.Page.FileSidebarWidth + "px" }}
      >
        <div class={css.topTools}>
          {this.topTools.map((tool) => (
            <FontAwesomeIcon
              icon={tool.icon}
              class={tool.active ? css.active : ""}
              title={tool.title}
              {...{
                onMousedown: (e: MouseEvent) => {
                  this.topTools.forEach((t) => (t.active = false));
                  tool.active = true;
                  e.stopPropagation();
                },
              }}
            />
          ))}
        </div>
        <div class={css.content}>
          <div class={css.projectTitle}>
            项目名称
            <div class={css.projectTools}>
              {this.projectTools.map((tool) => (
                <FontAwesomeIcon
                  icon={tool.icon}
                  title={tool.title}
                  {...{
                    onMousedown: (e: MouseEvent) => {
                      this.ProjectToolItemClick(tool);
                      e.stopPropagation();
                    },
                  }}
                />
              ))}
            </div>
          </div>
          <div onContextmenu={this.OpenContextMenu}>
            <Folder />
          </div>
        </div>
        <div class={css.adjustEdge} onMousedown={this.BeginAdjust}></div>
        <ContextMenu
          {...{ position: this.contextMenuPosition, onClose: () => (this.contextMenuPosition = null) }}
        ></ContextMenu>
      </div>
    );
  }
}
