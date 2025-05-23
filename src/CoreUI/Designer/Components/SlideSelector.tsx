import { useDesignerStore } from "@/Stores/designerStore";
import { UtilsDeclare } from "@/Types/UtilsDeclare";
import { EventManager } from "@/Utils";
import { Component, Emit, Prop, Vue } from "vue-facing-decorator";

type Coord = UtilsDeclare.Coord;
interface BoundingBox {
  top: number;
  left: number;
  width: number;
  height: number;
}
// 定义一个常量
const EMPTY_BOUNDING_BOX: BoundingBox = Object.freeze({
  top: 0,
  left: 0,
  width: 0,
  height: 0,
});

@Component
export default class SlideSelector extends Vue {
  @Prop
  start: Coord;

  @Emit("slide-end")
  SlideEnd() {
    const boundingBoxClone = { ...this.boundingBox };
    this.boundingBox = { ...EMPTY_BOUNDING_BOX };
    return boundingBoxClone;
  }

  boundingBox: BoundingBox = { ...EMPTY_BOUNDING_BOX };
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

  get style() {
    return {
      top: this.boundingBox.top + "px",
      left: this.boundingBox.left + "px",
      width: this.boundingBox.width + "px",
      height: this.boundingBox.height + "px",
    };
  }

  get designerStore() {
    return useDesignerStore();
  }

  eventManager: EventManager = new EventManager();

  mounted() {
    if (this.designerStore.debug) {
      this.eventManager.addBatch(
        window,
        {
          mousemove: this.Resize,
          mouseup: this.SlideEnd,
        },
        this
      );
    }
  }

  unmounted() {
    if (this.designerStore.debug) {
      this.eventManager?.removeAll();
      this.eventManager = null;
    }
  }

  render() {
    if (!this.boundingBox.width && !this.boundingBox.height) return;
    return (
      <div
        class="slideSelector absolute bg-[#55A9EE4D] z-[999] border-[1px] border-dashed border-[#55A9EE]"
        style={this.style}
      ></div>
    );
  }
}
