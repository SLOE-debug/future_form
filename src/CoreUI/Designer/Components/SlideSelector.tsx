import { UtilsDeclare } from "@/Types/UtilsDeclare";
import { BindEventContext, RegisterEvent } from "@/Utils/Index";
import { Component, Emit, Prop, Vue, Watch } from "vue-facing-decorator";

type Coord = UtilsDeclare.Coord;

@Component
export default class SlideSelector extends Vue {
  @Prop
  start: Coord;
  @Watch("start")
  startChange(nv, ov) {
    if (nv) {
      RegisterEvent.call(window, this.winEventHandlers);
    } else {
      this.$emit("slideEnd", this.boundingBox);
      this.boundingBox = this.InitBoundingBox();
      RegisterEvent.call(window, this.winEventHandlers, true);
    }
  }

  @Emit("slideEnd")
  SlideEnd() {}

  boundingBox = this.InitBoundingBox();
  Resize(e: MouseEvent) {
    if (!this.start) return;
    let { x: sx, y: sy } = this.start;
    if (!!sx && !!sy) {
      let { left: l, top: t } = this.$parent.$parent.$el.getBoundingClientRect() || { left: 0, top: 0 };
      let { clientX: x, clientY: y } = e;

      let w = x - sx,
        h = y - sy,
        top = sy - t,
        left = sx - l;

      if (x < sx) {
        left = x - l;
        w = -w;
      }

      if (y < sy) {
        top = y - t;
        h = -h;
      }
      this.boundingBox = { top, left, width: w, height: h };
    }
  }

  InitBoundingBox() {
    return { top: 0, left: 0, width: 0, height: 0 };
  }

  get style() {
    return {
      top: this.boundingBox.top + "px",
      left: this.boundingBox.left + "px",
      width: this.boundingBox.width + "px",
      height: this.boundingBox.height + "px",
    };
  }

  winEventHandlers = {
    mousemove: this.Resize,
    mouseup: this.SlideEnd,
  };
  mounted() {
    if (this.$Store.get.Designer.Debug) {
      BindEventContext(this.winEventHandlers, this);
    }
  }

  unmounted() {
    if (this.$Store.get.Designer.Debug) {
      RegisterEvent.call(window, this.winEventHandlers, true);
      this.winEventHandlers = null;
    }
  }

  render() {
    if (!this.boundingBox.width && !this.boundingBox.height) return;
    return <div class={css.slideselector} style={this.style}></div>;
  }
}
