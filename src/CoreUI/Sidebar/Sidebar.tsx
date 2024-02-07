import { Component, Vue } from "vue-facing-decorator";
import FileSidebar from "./VirtualFileSystem/FileSidebar";
import ControlLibray from "./ToolKit/ControlLibrary";
import SvgIcon from "@/Components/SvgIcon";
import Configurator from "./ToolKit/Configurator";

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
      name: "项目",
      icon: "project",
    },
    {
      name: "控件库",
      icon: "controlLibrary",
    },
    {
      name: "属性",
      icon: "property",
    },
  ];

  activeTab = "项目";

  render() {
    return (
      <div style={{ width: this.$Store.get.Page.SidebarWidth + "px" }} class={css.sidebar}>
        <div class={css.tabs}>
          {this.tabs.map((t) => {
            return (
              <SvgIcon
                {...{
                  name: t.icon,
                  class: [css.item, this.activeTab == t.name ? css.active : ""].join(" "),
                  onClick: () => {
                    this.activeTab = t.name;
                  },
                  title: t.name,
                  size: 26,
                }}
              ></SvgIcon>
            );
          })}
        </div>
        {this.activeTab == "项目" && <FileSidebar></FileSidebar>}
        {this.activeTab == "控件库" && <ControlLibray></ControlLibray>}
        {this.activeTab == "属性" && <Configurator></Configurator>}
        <div class={css.adjustEdge} onMousedown={this.BeginAdjust}></div>
      </div>
    );
  }
}
