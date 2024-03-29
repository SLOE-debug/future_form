import { Component, Vue } from "vue-facing-decorator";
import FileSidebar from "./VirtualFileSystem/FileSidebar";
import ControlLibray from "./ToolKit/ControlLibrary";
import SvgIcon from "@/Components/SvgIcon";
import Configurator from "./ToolKit/Configurator";
import { BindEventContext, RegisterEvent } from "@/Utils/Index";

@Component
export default class Sidebar extends Vue {
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
    } else if (this.$Store.get.Page.SidebarWidth == 2 && e.clientX > 20) {
      this.startAdjustX = this.$Store.get.Page.SidebarMinWidth;
      this.$Store.dispatch("Page/ShowSidebar");
      return;
    }
    if (e.clientX < this.$Store.get.Page.SidebarMinWidth) return;
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

  activeTab = "project";

  winEventHandlers = {
    keydown: function (e: KeyboardEvent) {
      // 如果按下的事件来源是 input 或者 textarea，则不响应
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key >= "1" && e.key <= "4") {
        this.activeTab = this.tabs[parseInt(e.key) - 1].type;
      }
      // 如果等于F5
      if (e.key == "F5") {
        this.activeTab = "project";
        this.$nextTick(() => {
          this.$refs.fileSidebar.Preview();
        });
      }
      e.stopPropagation();
      e.preventDefault();
    },
  };

  created() {
    BindEventContext(this.winEventHandlers, this);
    RegisterEvent.call(window, this.winEventHandlers);
  }

  unmounted() {
    RegisterEvent.call(window, this.winEventHandlers, true);
  }

  render() {
    return (
      <div style={{ width: this.$Store.get.Page.SidebarWidth + "px" }} class={css.sidebar}>
        <div class={css.tabs}>
          {this.tabs.map((t) => {
            return (
              <SvgIcon
                {...{
                  name: t.icon,
                  class: [css.item, this.activeTab == t.type ? css.active : ""].join(" "),
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
          <Configurator {...{ left: this.activeTab == "event" ? 50 : 0 }}></Configurator>
        )}
        <div class={css.adjustEdge} onMousedown={this.BeginAdjust}></div>
      </div>
    );
  }
}
