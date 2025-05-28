import { Component, Vue } from "vue-facing-decorator";
import FileSidebar from "./VirtualFileSystem/FileSidebar";
import ControlLibray from "./ToolKit/ControlLibrary";
import SvgIcon from "@/Components/SvgIcon";
import Configurator from "./ToolKit/Configurator";
import { EventManager } from "@/Utils";
import { VritualFileSystemDeclare } from "@/Types/VritualFileSystemDeclare";
import { useDesignerStore } from "@/Stores/DesignerStore";
import { usePageStore } from "@/Stores/PageStore";
import { useVirtualFileSystemStore } from "@/Stores/VirtualFileSystemStore";

type IDirectory = VritualFileSystemDeclare.IDirectory;
type IFile = VritualFileSystemDeclare.IFile;

@Component
export default class Sidebar extends Vue {
  declare $refs: {
    fileSidebar: InstanceType<typeof FileSidebar>;
  };

  get designerStore() {
    return useDesignerStore();
  }

  get virtualFileSystemStore() {
    return useVirtualFileSystemStore();
  }

  get pageStore() {
    return usePageStore();
  }

  startAdjustX: number = 0;
  BeginAdjust(e: MouseEvent) {
    this.startAdjustX = e.clientX;
    window.addEventListener("mousemove", this.Adjusting);
    window.addEventListener("mouseup", this.AdjustEnd);
    e.stopPropagation();
  }

  Adjusting(e: MouseEvent) {
    if (e.clientX < 20) {
      this.$Store.dispatch("Page/HideSidebar");
      return;
    } else if (this.pageStore.sidebarWidth == 2 && e.clientX > 20) {
      this.startAdjustX = this.pageStore.sidebarMinWidth;
      this.$Store.dispatch("Page/ShowSidebar");
      return;
    }
    if (e.clientX < this.pageStore.sidebarMinWidth) return;
    let diff = e.clientX - this.startAdjustX;
    this.startAdjustX = e.clientX;

    this.$Store.dispatch("Page/AdjustSidebarWidth", diff);
  }

  AdjustEnd(e: MouseEvent) {
    window.removeEventListener("mousemove", this.Adjusting);
    window.removeEventListener("mouseup", this.AdjustEnd);
  }

  tabs = [
    {
      name: "项目(1)",
      icon: "project",
      type: "project",
    },
    {
      name: "控件库(2)",
      icon: "controlLibrary",
      type: "controlLibrary",
    },
    {
      name: "属性(3)",
      icon: "property",
      type: "property",
    },
    {
      name: "事件(4)",
      icon: "event",
      type: "event",
    },
  ];

  Key_Number(e) {
    this.activeTab = this.tabs[parseInt(e.key) - 1].type;
  }

  Key_F5() {
    this.activeTab = "project";
    this.$nextTick(() => {
      this.$refs.fileSidebar.Preview();
    });
  }

  async Key_F2() {
    this.virtualFileSystemStore.GetCurrentEntity().Rename();
  }

  async Key_Delete() {
    if (this.designerStore.isActive || this.activeTab != "project") return;
    this.virtualFileSystemStore.GetCurrentEntity().Delete();
  }

  // Ctrl + Shift + Alt + S，保存至云端
  async Ctrl_Shift_Alt_Key_S() {
    this.activeTab = "project";
    this.$nextTick(() => {
      this.$refs.fileSidebar.SaveToCloud();
    });
  }

  // Ctrl + Shift + Alt + P，发布
  async Ctrl_Shift_Alt_Key_P() {
    this.activeTab = "project";
    this.$nextTick(() => {
      this.$refs.fileSidebar.Publish();
    });
  }

  activeTab = "project";

  // 键盘按下处理器
  HandleKeydown(e: KeyboardEvent) {
    // 如果按下的事件来源是 input 或者 textarea，则不响应
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    let methodName = "";

    if (e.ctrlKey) methodName = "Ctrl_";
    if (e.shiftKey) methodName += "Shift_";
    if (e.altKey) methodName += "Alt_";

    let key = isNaN(parseInt(e.key)) ? e.key : "Number";

    methodName += `Key_${key}`;
    this[methodName]?.(e);

    e.stopPropagation();
    e.preventDefault();
  }

  eventManger: EventManager = new EventManager();

  created() {
    this.eventManger.add(window, "keydown", this.HandleKeydown, this);
  }

  mounted() {
    this.$nextTick(() => {
      this.$refs.fileSidebar.Load();
    });
  }

  unmounted() {
    this.eventManger?.removeAll();
    this.eventManger = null;
  }

  render() {
    return (
      <div
        style={{ width: this.pageStore.sidebarWidth + "px" }}
        class="sidebar absolute select-none h-screen bg-[#151515]"
      >
        <div class="tabs w-full flex items-center h-[4%] pl-[5px] overflow-hidden relative">
          {this.tabs.map((t) => {
            return (
              <SvgIcon
                {...{
                  name: t.icon,
                  className: [
                    "item m-[5px_2px] cursor-pointer duration-[.15s] rounded-[4px] hover:bg-[#FFFFFF1A] !fill-[#999] [&>svg]:p-[2px]",
                    this.activeTab == t.type ? "bg-[#FFFFFF4D] !fill-[#e6e6e6] hover:bg-[#FFFFFF4D]" : "",
                  ].join(" "),
                  onClick: () => {
                    this.activeTab = t.type;
                  },
                  title: t.name,
                  size: 26,
                }}
              ></SvgIcon>
            );
          })}
        </div>
        {this.activeTab == "project" && <FileSidebar ref={"fileSidebar"}></FileSidebar>}
        {this.activeTab == "controlLibrary" && <ControlLibray></ControlLibray>}

        {(this.activeTab == "property" || this.activeTab == "event") && (
          <Configurator
            {...{
              left: this.activeTab == "event" ? 50 : 0,
            }}
          ></Configurator>
        )}
        <div
          class="adjustEdge absolute top-0 right-0 w-[2px] h-full bg-black cursor-[ew-resize] hover:bg-[#ad9cff] hover:w-[4px]"
          onMousedown={this.BeginAdjust}
        ></div>
      </div>
    );
  }
}
