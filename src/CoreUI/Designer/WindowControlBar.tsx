import SvgIcon from "@/Components/SvgIcon";
import { WindowDeclare } from "@/Types/WindowDeclare";
import { UtilsDeclare } from "@/Types/UtilsDeclare";
import { EventManager } from "@/Utils";
import { Component, Prop, Vue, Watch } from "vue-facing-decorator";
import { JSX } from "vue/jsx-runtime";

type Coord = UtilsDeclare.Coord;

@Component
export default class WindowControlBar extends Vue {
  declare $refs: any;

  @Prop
  formWidth: number;
  @Prop
  formHeight: number;
  @Prop({ default: "默认标题" })
  title: string;
  @Prop({ default: false })
  active: boolean;
  @Prop
  zIndex: number;
  @Prop({ default: false })
  dialogWindow: boolean;

  @Prop({ default: true })
  showMaximize: boolean;
  @Prop({ default: true })
  showClose: boolean;

  /**
   * 是否显示窗体控制条
   */
  @Prop({ default: true })
  showControlBar: boolean;

  @Prop({
    default: WindowDeclare.StartPosition.CenterScreen,
  })
  startPosition: WindowDeclare.StartPosition;

  @Prop({ default: false })
  max: boolean;
  @Prop
  instanceId: string;

  // 是否需要高度滚动条
  @Prop({ default: true })
  heightScroll: boolean;

  // 窗体头部高度，默认25
  headHeight: number = 25;

  maximize = false;

  @Watch("maximize")
  maximizeChange(nv, ov) {
    this.UpdateDesktopSize();
  }

  desktopSize: Coord = { x: 0, y: 0 };
  UpdateDesktopSize() {
    let rect = { width: window.innerWidth, height: window.innerHeight };
    this.desktopSize.x = rect.width;
    this.desktopSize.y = innerHeight;
  }

  get windowSize() {
    let w = this.formWidth;
    let h = this.formHeight + this.headHeight;

    if (this.maximize) {
      w = this.desktopSize.x;
      h = this.desktopSize.y;
    }

    let size = {
      width: w,
      height: h,
    };

    if (size.height > innerHeight && this.heightScroll) {
      size.height = innerHeight;
      size.width += this.maximize ? 0 : 8;
    }

    return size;
  }

  get barStyle() {
    let { width, height } = this.windowSize;
    let l = this.left,
      t = this.top;
    if (this.maximize) l = 0;
    if (this.maximize) t = 0;

    return {
      left: l + "px",
      top: t + "px",
      width: width + "px",
      height: height + "px",
      borderRadius: this.maximize ? 0 : "5px",
      zIndex: this.zIndex,
    };
  }

  get headStyle() {
    return { height: this.headHeight + "px" };
  }

  get containerStyle() {
    let { width, height } = this.windowSize;

    height -= this.headHeight;

    let style: any = { width: width + "px", height: height + "px" };
    // 如果是最大化
    if (this.maximize) {
      style = { ...style, minHeight: height + "px", minWidth: width + "px" };
    }
    if (!this.heightScroll) {
      style.overflowY = "hidden";
    }

    return style;
  }

  left = 0;
  top = 0;

  Close() {
    this.$Store.dispatch("Window/CloseWindow", this.instanceId);
  }

  RenderBarButtons() {
    return (
      <div class={css.buttons} onMousedown={(e) => e.stopPropagation()}>
        {this.showMaximize && (
          <SvgIcon
            {...{
              name: "Maximize",
              title: "最大化",
              class: css.max,
              onClick: (_) => {
                this.maximize = !this.maximize;
              },
            }}
          ></SvgIcon>
        )}
        {this.showClose && (
          <SvgIcon
            {...{
              name: "Close",
              title: "关闭",
              class: css.close,
              onClick: this.Close,
            }}
          ></SvgIcon>
        )}
      </div>
    );
  }

  isMove = false;
  offset: Coord = { x: 0, y: 0 };
  StartMove(e: MouseEvent) {
    if (!(e.target as HTMLDivElement).classList.contains(css.head)) return;
    let rect = ((e.target as HTMLElement).parentNode as HTMLElement).getBoundingClientRect();
    let deskRect = { left: 0, top: 0 };
    this.offset = { x: e.clientX - rect.left + deskRect.left, y: e.clientY - rect.top };

    this.isMove = true;
  }

  Move(e: MouseEvent) {
    if (this.isMove && !this.maximize) {
      this.top = e.clientY - this.offset.y;
      this.left = e.clientX - this.offset.x;
    }
  }

  CancelMove() {
    if (this.top < 0) this.top = 0;
    if (this.top > innerHeight) this.top = innerHeight - this.headHeight;
    this.isMove = false;
  }

  eventManger: EventManager = new EventManager();

  created() {
    // 如果不需要显示窗体控制条
    if (!this.showControlBar) {
      this.headHeight = 0;
    }

    switch (this.startPosition) {
      case WindowDeclare.StartPosition.Default:
        this.top = this.left = 0;
        break;
      case WindowDeclare.StartPosition.CenterScreen:
        let { width, height } = this.windowSize;

        let rect = {
          width: innerWidth,
          height: innerHeight,
        };
        this.top = rect.height / 2 - height / 2;
        this.left = rect.width / 2 - width / 2;
        break;
    }
    this.$nextTick(() => {
      if (this.max) {
        this.maximize = true;
      }
    });
  }

  mounted() {
    this.eventManger.addBatch(
      window,
      {
        mousemove: this.Move,
        mouseup: this.CancelMove,
        resize: () => {
          this.UpdateDesktopSize();
        },
      },
      this
    );
  }

  unmounted() {
    this.eventManger?.removeAll();
    this.eventManger = null;
  }

  ShowDialogWindow(jsx: JSX.Element) {
    return (
      <div
        style={{
          position: "absolute",
          zIndex: 999999999,
          left: 0,
          top: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0,0,0,0.2)",
        }}
      >
        {jsx}
      </div>
    );
  }

  /**
   * 窗体内容是否正在加载
   */
  contentLoading = true;
  render() {
    let window = (
      <div
        class={`${css.bar} ${this.active ? css.active : ""}`}
        style={this.barStyle}
        ref={"windowControl"}
        onMousedown={(e) => {
          this.$Store.dispatch("Window/SetFocusWindow", this.instanceId);
        }}
      >
        {this.showControlBar && (
          <div
            class={css.head}
            style={this.headStyle}
            onMousedown={this.StartMove}
            onDblclick={(_) => {
              if (this.showMaximize) this.maximize = !this.maximize;
            }}
          >
            {this.title}
            {this.RenderBarButtons()}
          </div>
        )}
        <div
          class={css.container}
          style={this.containerStyle}
          v-loading={this.contentLoading}
          element-loading-text="正在加载窗体..."
          element-loading-background="black"
        >
          {this.$slots.default()}
        </div>
      </div>
    );

    return this.dialogWindow ? this.ShowDialogWindow(window) : window;
  }
}
