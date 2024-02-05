import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { Component, Provide, Vue } from "vue-facing-decorator";
import Folder from "./Folder";
import { VritualFileSystemDeclare } from "@/Types/VritualFileSystemDeclare";
import ContextMenu from "./ContextMenu";
import Compiler from "@/Core/Compile/Compile";

type IDirectory = VritualFileSystemDeclare.IDirectory;

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
    this.directory = this.$Store.get.VirtualFileSystem.Root;
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

  OpenContextMenu(e: MouseEvent) {
    this.$Store.dispatch("VirtualFileSystem/SetContextMenuPosition", { x: e.clientX, y: e.clientY });
    e.preventDefault();
  }

  isRun = false;
  RenderRunTool() {
    if (this.isRun) return <FontAwesomeIcon icon={"stop"} style={{ color: "#C85961" }} title="停止"></FontAwesomeIcon>;
    return (
      <FontAwesomeIcon
        icon={"play"}
        style={{ color: "#9AE69A" }}
        title="运行"
        {...{
          onClick: async () => {
            this.isRun = true;
            let compiler = new Compiler();
            let files = await compiler.GetCompiledFiles();
            compiler.RunCompiledFiles(files);
            this.isRun = false;
          },
        }}
      ></FontAwesomeIcon>
    );
  }

  render() {
    return (
      <div
        class={css.sidebar}
        onMousedown={() => {
          this.$Store.dispatch("VirtualFileSystem/SelectDirectory", this.$Store.get.VirtualFileSystem.Root);
          this.$Store.dispatch("VirtualFileSystem/ClearContextMenuPosition");
        }}
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
          {this.RenderRunTool()}
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
        <ContextMenu
          {...{ onClose: () => this.$Store.dispatch("VirtualFileSystem/ClearContextMenuPosition") }}
        ></ContextMenu>
      </div>
    );
  }
}
