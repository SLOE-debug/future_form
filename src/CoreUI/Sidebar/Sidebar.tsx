import { Component, Vue } from "vue-facing-decorator";
import FileSidebar from "./VirtualFileSystem/FileSidebar";

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

  render() {
    return (
      <div style={{ width: this.$Store.get.Page.SidebarWidth + "px" }} class={css.sidebar}>
        <div>
          
        </div>
        <FileSidebar></FileSidebar>
        <div class={css.adjustEdge} onMousedown={this.BeginAdjust}></div>
      </div>
    );
  }
}
